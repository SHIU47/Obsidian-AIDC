import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import { fileURLToPath } from 'url';

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ENV_PATH = path.join(__dirname, '../.env');
const WIKI_DIR = path.resolve(path.join(__dirname, '../../wiki'));
const STATE_PATH = path.resolve(path.join(__dirname, '../../.notion_sync_state.json'));

// Load environment variables manually
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnv(ENV_PATH);

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

// Rate limiting utility (Notion API limits: 3 requests per second)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sha1(str) {
  return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

function loadSyncState() {
  if (fs.existsSync(STATE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      console.warn('Warning: Failed to parse sync state. Starting fresh.', e);
    }
  }
  return { folders: {}, pages: {} };
}

function saveSyncState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function getFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  });
  return results;
}

// Convert frontmatter data to a Notion callout block
function createMetadataBlock(data) {
  if (!data || Object.keys(data).length === 0) return null;
  const lines = Object.entries(data).map(([key, val]) => {
    let valStr = val;
    if (Array.isArray(val)) valStr = val.join(', ');
    else if (typeof val === 'object') valStr = JSON.stringify(val);
    return `**${key}**: ${valStr}`;
  });

  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `📌 筆記元資料 (Metadata)\n` + lines.join('\n'),
          },
        },
      ],
      icon: {
        type: 'emoji',
        emoji: '⚙️',
      },
      color: 'gray_background',
    },
  };
}

async function getOrCreateFolderPage(folderRelativePath, rootParentId, syncState, notion) {
  if (!folderRelativePath) {
    return rootParentId;
  }
  const normalized = folderRelativePath.replace(/\\/g, '/');

  if (syncState.folders[normalized]) {
    return syncState.folders[normalized];
  }

  const parts = normalized.split('/');
  let parentId = rootParentId;

  if (parts.length > 1) {
    const parentFolderRelative = parts.slice(0, -1).join('/');
    parentId = await getOrCreateFolderPage(parentFolderRelative, rootParentId, syncState, notion);
  }

  const folderName = parts[parts.length - 1];
  console.log(`Creating folder page in Notion: "${folderName}" under parent "${parentId}"...`);

  await delay(350);
  try {
    const response = await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: [
          {
            text: {
              content: folderName,
            },
          },
        ],
      },
    });

    syncState.folders[normalized] = response.id;
    saveSyncState(syncState);
    return response.id;
  } catch (err) {
    console.error(`Error creating folder page for "${folderName}":`, err.message);
    throw err;
  }
}

async function deletePageChildren(notion, pageId) {
  console.log(`Clearing existing content for page: ${pageId}...`);
  let hasMore = true;
  let startCursor = undefined;
  const childIds = [];

  while (hasMore) {
    await delay(350);
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: startCursor,
      page_size: 100,
    });
    childIds.push(...res.results.map((block) => block.id));
    hasMore = res.has_more;
    startCursor = res.next_cursor;
  }

  for (const childId of childIds) {
    await delay(350);
    try {
      await notion.blocks.delete({ block_id: childId });
    } catch (e) {
      console.warn(`Failed to delete child block ${childId}:`, e.message);
    }
  }
}

async function appendPageBlocks(notion, pageId, blocks) {
  // Batch in chunks of 100 blocks
  for (let i = 0; i < blocks.length; i += 100) {
    const batch = blocks.slice(i, i + 100);
    await delay(350);
    try {
      await notion.blocks.children.append({
        block_id: pageId,
        children: batch,
      });
    } catch (err) {
      console.error(`Error appending block batch at index ${i} for page ${pageId}:`, err.message);
      throw err;
    }
  }
}

async function main() {
  if (!NOTION_API_KEY || NOTION_API_KEY === 'your_notion_integration_token_here') {
    console.error('Error: NOTION_API_KEY is not set or is still the default placeholder in game/.env.');
    console.error('Please configure your Notion Integration Token before running the sync.');
    process.exit(1);
  }

  if (!NOTION_PARENT_PAGE_ID || NOTION_PARENT_PAGE_ID === 'your_notion_parent_page_id_here') {
    console.error('Error: NOTION_PARENT_PAGE_ID is not set or is still the default placeholder in game/.env.');
    console.error('Please configure your Notion Parent Page ID before running the sync.');
    process.exit(1);
  }

  console.log('Initializing Notion Client...');
  const notion = new Client({ auth: NOTION_API_KEY });

  const syncState = loadSyncState();
  const allMdFiles = getFilesRecursively(WIKI_DIR);

  console.log(`Found ${allMdFiles.length} local markdown files in wiki/ directory.`);

  // Keep track of visited paths in this run to identify deleted files later
  const visitedPaths = new Set();

  for (const filepath of allMdFiles) {
    const relativePath = path.relative(WIKI_DIR, filepath).replace(/\\/g, '/');
    visitedPaths.add(relativePath);

    const raw = fs.readFileSync(filepath, 'utf8');
    const currentHash = sha1(raw);

    const { data: frontmatter, content: markdownBody } = matter(raw);
    const title = frontmatter.title || path.basename(filepath, '.md');

    // Resolve blocks
    let blocks = [];
    const metaBlock = createMetadataBlock(frontmatter);
    if (metaBlock) {
      blocks.push(metaBlock);
    }
    
    try {
      const parsedBlocks = markdownToBlocks(markdownBody);
      blocks.push(...parsedBlocks);
    } catch (err) {
      console.error(`Failed to parse markdown to blocks for ${relativePath}:`, err);
      continue;
    }

    const stateEntry = syncState.pages[relativePath];

    if (stateEntry) {
      if (stateEntry.hash === currentHash) {
        console.log(`[Skip]  ${relativePath} (up-to-date)`);
        continue;
      }

      console.log(`[Update] ${relativePath} has changed. Updating Notion page...`);
      const pageId = stateEntry.page_id;

      try {
        // First try to update the page title in case it changed
        await delay(350);
        await notion.pages.update({
          page_id: pageId,
          properties: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
        });

        // Delete existing blocks and append new ones
        await deletePageChildren(notion, pageId);
        await appendPageBlocks(notion, pageId, blocks);

        // Update state
        stateEntry.hash = currentHash;
        saveSyncState(syncState);
        console.log(`[Done]  Updated ${relativePath}`);
      } catch (err) {
        if (err.code === 'object_not_found' || err.status === 404) {
          console.warn(`[Warning] Page ${pageId} not found in Notion. It might have been deleted. Re-creating...`);
          // Remove from state so it gets recreated below
          delete syncState.pages[relativePath];
        } else {
          console.error(`[Error] Failed to update ${relativePath}:`, err.message);
          continue;
        }
      }
    }

    // Double check if page needs creation (either new, or removed from state because of 404)
    if (!syncState.pages[relativePath]) {
      console.log(`[Create] ${relativePath} is new. Creating Notion page...`);
      const folderRelative = path.dirname(relativePath);
      const parentFolderId = folderRelative === '.' ? NOTION_PARENT_PAGE_ID : await getOrCreateFolderPage(folderRelative, NOTION_PARENT_PAGE_ID, syncState, notion);

      await delay(350);
      try {
        // Create page with first 100 blocks
        const firstBatch = blocks.slice(0, 100);
        const response = await notion.pages.create({
          parent: { page_id: parentFolderId },
          properties: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
          children: firstBatch,
        });

        const newPageId = response.id;

        // Append the rest of the blocks if any
        if (blocks.length > 100) {
          await appendPageBlocks(notion, newPageId, blocks.slice(100));
        }

        // Save page info in state
        syncState.pages[relativePath] = {
          page_id: newPageId,
          hash: currentHash,
        };
        saveSyncState(syncState);
        console.log(`[Done]  Created page for ${relativePath}`);
      } catch (err) {
        console.error(`[Error] Failed to create page for ${relativePath}:`, err.message);
      }
    }
  }

  // Check for deleted files (exist in state but no longer locally)
  const stateFiles = Object.keys(syncState.pages);
  const deletedFiles = stateFiles.filter(file => !visitedPaths.has(file));
  if (deletedFiles.length > 0) {
    console.log('\n--- Sync complete. The following files were deleted locally but kept in Notion for safety:');
    deletedFiles.forEach(file => {
      console.log(` - ${file} (Notion Page ID: ${syncState.pages[file].page_id})`);
    });
  } else {
    console.log('\n--- Sync complete. All files are fully synchronized.');
  }
}

main().catch(err => {
  console.error('Fatal error in sync script:', err);
  process.exit(1);
});
