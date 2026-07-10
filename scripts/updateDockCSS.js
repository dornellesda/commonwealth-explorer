import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/index.css', 'utf-8');
  
  if (!content.includes('explore-cta-button')) {
    const cssToAdd = `
.explore-cta-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}
`;
    await fs.writeFile('src/index.css', content + cssToAdd);
    console.log('Added explore-cta-button to index.css');
  }
}
main();
