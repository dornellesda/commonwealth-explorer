import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  // We need to remove the entire block from `{!geojson ? (` to the closing `) : null}`
  const startStr = '{!geojson ? (';
  const startIndex = content.indexOf(startStr);
  
  if (startIndex === -1) {
    console.log('Could not find Loading screen start');
    process.exit(1);
  }

  // The loading block ends with `) : null}`
  const endStr = ') : null}';
  const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

  content = content.substring(0, startIndex) + content.substring(endIndex);

  await fs.writeFile('src/AppNew.jsx', content);
  console.log('Removed Loading screen');
}
main();
