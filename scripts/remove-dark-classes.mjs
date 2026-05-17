import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

// Simple recursive file finder
function getAllFiles(dir, results = []) {
  const items = readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      getAllFiles(fullPath, results)
    } else if (
      item.name.endsWith(".tsx") ||
      item.name.endsWith(".ts") ||
      item.name.endsWith(".css")
    ) {
      results.push(fullPath)
    }
  }
  return results
}

const files = getAllFiles("src")

let totalReplacements = 0
let filesModified = 0

for (const file of files) {
  let content = readFileSync(file, "utf-8")
  const original = content

  // Multi-pass removal of `dark:` classes
  // Pass 1: " dark:XXX" (preceded by space)
  let newContent = content.replace(/\s+dark:[^"\s]+/g, "")

  // Pass 2: "dark:XXX " at start or after other classes
  newContent = newContent.replace(/(?<=["'\s])dark:[^"\s]+/g, "")

  if (newContent !== original) {
    writeFileSync(file, newContent)
    filesModified++
    const count = (original.match(/dark:/g) || []).length
    totalReplacements += count
    console.log(`Modified: ${file} (removed ~${count} dark: classes)`)
  }
}

console.log(`\nDone! Modified ${filesModified} files, removed ${totalReplacements} dark: classes.`)
