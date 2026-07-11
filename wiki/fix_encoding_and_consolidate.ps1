# fix_encoding_and_consolidate.ps1
# This script consolidates all markdown files in the wiki directory into a single file Engineering_Wiki_Consolidated.md.
# It also ensures all files are read and written with UTF-8 encoding.

$wikiDir = $PSScriptRoot
$consolidatedPath = Join-Path $PSScriptRoot "Engineering_Wiki_Consolidated.md"

Write-Output "Starting wiki consolidation..."

# Initialize consolidated file with header
$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$header = @"
# AIDC HVAC Engineering Wiki - Consolidated Knowledge Base
Generated on: $currentDate
This document contains a consolidated version of all engineering wiki pages for easy import into NotebookLM.
---
"@

$header | Set-Content -Path $consolidatedPath -Encoding utf8

# Helper to append a file to the consolidated file
function Append-WikiFile($filePath) {
    if (Test-Path $filePath) {
        Write-Output "Consolidating: $filePath"
        $absolutePath = (Get-Item $filePath).FullName
        
        # Add document separator
        $separator = @"


## ================================================================================
## DOCUMENT: $absolutePath
## ================================================================================

"@
        [System.IO.File]::AppendAllText($consolidatedPath, $separator, [System.Text.Encoding]::UTF8)
        
        # Read file content (ensure UTF-8)
        $content = [System.IO.File]::ReadAllText($absolutePath, [System.Text.Encoding]::UTF8)
        [System.IO.File]::AppendAllText($consolidatedPath, $content, [System.Text.Encoding]::UTF8)
    }
}

# 1. Add index.md
Append-WikiFile (Join-Path $wikiDir "index.md")

# 2. Add log.md
Append-WikiFile (Join-Path $wikiDir "log.md")

# 3. Add comparisons
$comparisons = Get-ChildItem (Join-Path $wikiDir "comparisons") -Filter "*.md" | Sort-Object Name
foreach ($file in $comparisons) {
    Append-WikiFile $file.FullName
}

# 4. Add concepts subdirectories in order
$conceptsDirs = @(
    "01_modules",
    "02_air_cooling",
    "03_liquid_cooling",
    "04_cooling_sources",
    "05_power_systems",
    "06_standards_calculations",
    "07_design_safety",
    "08_racks_platforms",
    "09_chips_packaging"
)

foreach ($dirName in $conceptsDirs) {
    $dirPath = Join-Path (Join-Path $wikiDir "concepts") $dirName
    if (Test-Path $dirPath) {
        $conceptsFiles = Get-ChildItem $dirPath -Filter "*.md" | Sort-Object Name
        foreach ($file in $conceptsFiles) {
            Append-WikiFile $file.FullName
        }
    }
}

# 5. Add entities
$entities = Get-ChildItem (Join-Path $wikiDir "entities") -Filter "*.md" | Sort-Object Name
foreach ($file in $entities) {
    Append-WikiFile $file.FullName
}

# 6. Add sources
$sources = Get-ChildItem (Join-Path $wikiDir "sources") -Filter "*.md" | Sort-Object Name
foreach ($file in $sources) {
    Append-WikiFile $file.FullName
}

Write-Output "Wiki consolidation completed! Saved to: $consolidatedPath"
