const fs = require('fs');

const queries = [
  "Survivor Eye Of The Tiger lyric video",
  "Bryan Adams Summer Of 69 lyric video",
  "Bon Jovi Livin On A Prayer lyric video",
  "AC DC Thunderstruck audio",
  "Queen Dont Stop Me Now lyric video",
  "Guns N Roses Welcome To The Jungle audio",
  "Europe The Final Countdown lyric video",
  "Kenny Loggins Danger Zone audio",
  "Journey Dont Stop Believin lyric video",
  "AC DC Back In Black audio",
  "Queen We Will Rock You lyric video",
  "Aerosmith Walk This Way audio",
  "KISS I Was Made For Lovin You lyric video",
  "Joan Jett I Love Rock n Roll lyric video",
  "Bruce Springsteen Born to Run audio",
  "The Rolling Stones Start Me Up audio",
  "Metallica Enter Sandman audio",
  "Nirvana Smells Like Teen Spirit audio",
  "Van Halen Jump lyric video",
  "Survivor Burning Heart lyric video",
  "Elvis Presley Jailhouse Rock audio",
  "Elvis Presley Hound Dog audio",
  "Elvis Presley Blue Suede Shoes audio",
  "Little Richard Tutti Frutti audio",
  "Little Richard Long Tall Sally audio",
  "The Beatles Twist and Shout audio",
  "The Beatles Hey Jude audio",
  "Bee Gees Stayin Alive lyric video",
  "Bee Gees Night Fever audio",
  "Tom Jones Its Not Unusual audio",
  "Tom Jones Shes A Lady audio",
  "Tom Jones Delilah audio",
  "Les Cowboys Fringants Les etoiles filantes audio",
  "Les Cowboys Fringants Toune d automne audio",
  "Les Cowboys Fringants L Amerique pleure audio",
  "Les Cowboys Fringants Joyeux Calvaire audio",
  "Kain Embarque ma belle audio",
  "Kain Ye midi kek part audio",
  "Kain La bonne franquette audio",
  "Kain Comme dans le temps audio"
];

async function search() {
  const results = [];
  for (const q of queries) {
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=site:youtube.com+${encodeURIComponent(q)}`);
      const text = await res.text();
      const match = text.match(/v=([a-zA-Z0-9_-]{11})/);
      if (match) {
        results.push({ query: q, id: match[1] });
      } else {
        results.push({ query: q, id: 'NOT_FOUND' });
      }
    } catch (e) {
      results.push({ query: q, id: 'ERROR' });
    }
    // sleep to avoid rate limit
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(JSON.stringify(results, null, 2));
}

search();
