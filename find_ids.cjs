const queries = [
  { id: '30', q: "Tom Jones It's Not Unusual audio" },
  { id: '31', q: "Tom Jones She's A Lady audio" },
  { id: '32', q: "Tom Jones Delilah audio" },
  { id: '33', q: "Les Cowboys Fringants Les étoiles filantes audio" },
  { id: '34', q: "Les Cowboys Fringants Toune d'automne audio" },
  { id: '35', q: "Les Cowboys Fringants L'Amérique pleure audio" },
  { id: '36', q: "Les Cowboys Fringants Joyeux Calvaire audio" },
  { id: '37', q: "Kaïn Embarque ma belle audio" },
  { id: '38', q: "Kaïn Yé midi kek part audio" },
  { id: '39', q: "Kaïn La bonne franquette audio" },
  { id: '40', q: "Kaïn Comme dans le temps audio" }
];

async function findIds() {
  const results = {};
  for (const item of queries) {
    try {
      // Using a different search engine or approach if possible, but let's try DDG again with better parsing
      const url = `https://duckduckgo.com/html/?q=site:youtube.com+${encodeURIComponent(item.q)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const regex = /watch\?v=([a-zA-Z0-9_-]{11})/g;
      let match;
      const ids = [];
      while ((match = regex.exec(html)) !== null) {
        ids.push(match[1]);
      }
      results[item.id] = ids.length > 0 ? ids[0] : 'NOT_FOUND';
    } catch (e) {
      results[item.id] = 'ERROR';
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log(JSON.stringify(results, null, 2));
}

findIds();
