// game/pipeline/migrate_cache.js
import fs from 'fs';
import path from 'path';

const CACHE_FILE = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizbank_cache.json';
const QUIZZES_DIR = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizzes';

function getFolderName(source) {
  const norm = source.replace(/\\/g, '/');
  if (norm.includes('concepts/')) {
    const parts = norm.split('/');
    // e.g., "concepts/02_air_cooling/CRAC.md" -> "02_air_cooling"
    return parts[1] || 'unknown';
  } else {
    const parts = norm.split('/');
    // e.g., "comparisons/CRAC vs CRAH.md" -> "comparisons"
    return parts[0] || 'unknown';
  }
}

function main() {
  console.log(`Starting migration from cache: ${CACHE_FILE}`);
  if (!fs.existsSync(CACHE_FILE)) {
    console.error("Monolithic cache file does not exist. Run sync first.");
    process.exit(1);
  }

  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse cache file: ${err.message}`);
    process.exit(1);
  }

  const levelIds = Object.keys(cache);
  console.log(`Found ${levelIds.length} levels in cache.`);

  let migratedCount = 0;

  for (const levelId of levelIds) {
    const levelData = cache[levelId];
    const source = levelData.source;
    if (!source) {
      console.warn(`Level ${levelId} is missing source path. Skipping.`);
      continue;
    }

    const folderName = getFolderName(source);
    const targetDir = path.join(QUIZZES_DIR, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFile = path.join(targetDir, `${levelId}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(levelData, null, 2), 'utf8');
    migratedCount++;
  }

  console.log(`Success! Losslessly migrated ${migratedCount} level files into ${QUIZZES_DIR}`);
}

main();
