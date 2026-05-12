import https from 'https';
import fs from 'fs';

const fileContent = fs.readFileSync('./src/components/MusicWidget.tsx', 'utf-8');
const regex = /videoId:\s*'([^']+)'/g;
let match;
const videoIds = [];

while ((match = regex.exec(fileContent)) !== null) {
  videoIds.push(match[1]);
}

async function checkEmbeddable(id) {
  return new Promise((resolve) => {
    https.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ id, embeddable: true });
        } else {
          resolve({ id, embeddable: false, status: res.statusCode });
        }
      });
    }).on('error', (e) => {
      resolve({ id, embeddable: false, error: e.message });
    });
  });
}

async function run() {
  const results = [];
  for (const id of videoIds) {
    const res = await checkEmbeddable(id);
    results.push(res);
  }
  const notEmbeddable = results.filter(r => !r.embeddable);
  console.log(`Not embeddable (${notEmbeddable.length}):`, notEmbeddable);
}

run();
