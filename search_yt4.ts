const songs = [
  "Beyoncé - Crazy In Love",
  "Sabrina Carpenter - Espresso",
  "Green Day - American Idiot",
  "Bad Bunny - Tití Me Preguntó",
  "Karol G - PROVENZA"
];

async function run() {
  for (const song of songs) {
    try {
      const query = encodeURIComponent(song);
      const res = await fetch(`https://www.youtube.com/results?search_query=${query}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const html = await res.text();
      const matches = [...html.matchAll(/"videoId":"([^"]{11})"/g)];
      if (matches.length > 0) {
        const uniqueIds = [...new Set(matches.map(m => m[1]))].slice(0, 5);
        console.log(`${song}: ${uniqueIds.join(', ')}`);
      } else {
        console.log(`${song}: Not found`);
      }
    } catch (e) {
      console.log(`${song}: Error ${e.message}`);
    }
  }
}

run();
