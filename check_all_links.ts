import https from 'https';
import fs from 'fs';

const fileContent = fs.readFileSync('./src/components/MusicWidget.tsx', 'utf-8');
const regex = /videoId:\s*'([^']+)'/g;
let match;
const videoIds = [];

while ((match = regex.exec(fileContent)) !== null) {
  videoIds.push(match[1]);
}

console.log(`Found ${videoIds.length} video IDs.`);

async function checkVideoId(id) {
  return new Promise((resolve) => {
    https.get(`https://img.youtube.com/vi/${id}/mqdefault.jpg`, (res) => {
      resolve({ id, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ id, status: 'error', error: e.message });
    });
  });
}

async function run() {
  const results = [];
  for (const id of videoIds) {
    const res = await checkVideoId(id);
    results.push(res);
  }
  const broken = results.filter(r => r.status !== 200);
  console.log(`Broken links (${broken.length}):`, broken);
}

run();
