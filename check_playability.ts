import https from 'https';
import fs from 'fs';

const fileContent = fs.readFileSync('./src/components/MusicWidget.tsx', 'utf-8');
const regex = /videoId:\s*'([^']+)'/g;
let match;
const videoIds = [];

while ((match = regex.exec(fileContent)) !== null) {
  videoIds.push(match[1]);
}

async function checkPlayability(id) {
  return new Promise((resolve) => {
    https.get(`https://www.youtube.com/watch?v=${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/"playabilityStatus":\{"status":"([^"]+)"/);
        if (match) {
          resolve({ id, status: match[1] });
        } else {
          resolve({ id, status: 'UNKNOWN' });
        }
      });
    }).on('error', (e) => {
      resolve({ id, status: 'ERROR', error: e.message });
    });
  });
}

async function run() {
  const results = [];
  for (const id of videoIds) {
    const res = await checkPlayability(id);
    results.push(res);
  }
  const unplayable = results.filter(r => r.status !== 'OK');
  console.log(`Unplayable (${unplayable.length}):`, unplayable);
}

run();
