const fs = require('fs');

const moreSongs = [
  { id: '113', title: "The Weeknd - Blinding Lights", videoId: "4NRXx6U8ABQ", duration: "3 Min" },
  { id: '114', title: "Dua Lipa - Levitating", videoId: "TUVcZfQe-Kw", duration: "3 Min" },
  { id: '115', title: "Eminem - Lose Yourself", videoId: "_Yhyp-_hX2s", duration: "5 Min" },
  { id: '116', title: "Kanye West - POWER", videoId: "L53gjP-TtGE", duration: "4 Min" },
  { id: '117', title: "Avicii - Wake Me Up", videoId: "IcrbM1l_BoI", duration: "4 Min" },
  { id: '118', title: "Ed Sheeran - Shape of You", videoId: "JGwWNGJdvx8", duration: "4 Min" },
  { id: '119', title: "Macklemore - Can't Hold Us", videoId: "2zNSgSzhBfM", duration: "4 Min" },
  { id: '120', title: "Imagine Dragons - Believer", videoId: "7wtfhZwyrcc", duration: "3 Min" },
  { id: '121', title: "David Guetta - Titanium", videoId: "JRfuAukYTKg", duration: "4 Min" },
  { id: '122', title: "Coldplay - Viva La Vida", videoId: "dvgZvnPRvw", duration: "4 Min" },
  { id: '123', title: "Katy Perry - Roar", videoId: "CevxZvSJLk8", duration: "3 Min" },
  { id: '124', title: "Lady Gaga - Bad Romance", videoId: "qrO4YZeyl0I", duration: "4 Min" },
  { id: '125', title: "The Black Eyed Peas - I Gotta Feeling", videoId: "uSD4vsh1zDA", duration: "4 Min" },
  { id: '126', title: "Sia - Chandelier", videoId: "2vjPBrBU-TM", duration: "3 Min" },
  { id: '127', title: "Rihanna - We Found Love", videoId: "tg00YEETFzg", duration: "3 Min" },
  { id: '128', title: "Beyoncé - Crazy In Love", videoId: "ViwtNLUqkMY", duration: "3 Min" },
  { id: '129', title: "Outkast - Hey Ya!", videoId: "PWgvGjAhvIw", duration: "3 Min" },
  { id: '130', title: "Shakira - Waka Waka", videoId: "pRpeEdMmi_o", duration: "3 Min" },
  { id: '131', title: "Bruno Mars - Uptown Funk", videoId: "OPf0YbXqDm0", duration: "4 Min" },
  { id: '132', title: "Post Malone - Circles", videoId: "wXhTHyIgQ_U", duration: "3 Min" },
  { id: '133', title: "Harry Styles - As It Was", videoId: "H5v3kku4y6Q", duration: "2 Min" },
  { id: '134', title: "Billie Eilish - bad guy", videoId: "DyDfgMOUjCI", duration: "3 Min" },
  { id: '135', title: "Drake - God's Plan", videoId: "xpVfcZ0ZcFM", duration: "3 Min" },
  { id: '136', title: "Travis Scott - SICKO MODE", videoId: "6ONRf7h3Mdk", duration: "5 Min" },
  { id: '137', title: "Kendrick Lamar - HUMBLE.", videoId: "tvTRZCU1tP4", duration: "3 Min" },
  { id: '138', title: "Foo Fighters - The Pretender", videoId: "SBjQ9tuuTJQ", duration: "4 Min" },
  { id: '139', title: "Linkin Park - Numb", videoId: "kXYiU_JCYtU", duration: "3 Min" },
  { id: '140', title: "Red Hot Chili Peppers - Can't Stop", videoId: "BfOdWSiYKmc", duration: "4 Min" },
  { id: '141', title: "The Killers - Mr. Brightside", videoId: "gGdGFtwczR8", duration: "3 Min" },
  { id: '142', title: "Muse - Uprising", videoId: "w8KOf2yV_N4", duration: "5 Min" },
  { id: '143', title: "Arctic Monkeys - Do I Wanna Know?", videoId: "bpOSxM0rNPM", duration: "4 Min" },
  { id: '144', title: "Calvin Harris - Summer", videoId: "ebXbLfLJCA", duration: "3 Min" },
  { id: '145', title: "Tiësto - The Business", videoId: "nCg3ufihKyU", duration: "2 Min" },
  { id: '146', title: "Skrillex - Bangarang", videoId: "YJVmu6yttsq", duration: "3 Min" },
  { id: '147', title: "Oasis - Wonderwall", videoId: "6hzrDeceEKc", duration: "4 Min" },
  { id: '148', title: "Blink-182 - All The Small Things", videoId: "9Ht5RZpzPqw", duration: "2 Min" },
  { id: '149', title: "Green Day - American Idiot", videoId: "Ee_uiX2nJb4", duration: "2 Min" },
  { id: '150', title: "System Of A Down - Chop Suey!", videoId: "CSvFpBOe8eY", duration: "3 Min" },
  { id: '151', title: "Papa Roach - Last Resort", videoId: "3v3r2Yt25tQ", duration: "3 Min" },
  { id: '152', title: "Disturbed - Down With The Sickness", videoId: "09LTT0xwdfw", duration: "4 Min" },
  { id: '153', title: "Slipknot - Duality", videoId: "6fVE8kSM43I", duration: "3 Min" },
  { id: '154', title: "Korn - Freak On a Leash", videoId: "jRGrNDV2mKc", duration: "4 Min" },
  { id: '155', title: "Avril Lavigne - Sk8er Boi", videoId: "TIy3n2b7V9k", duration: "3 Min" },
  { id: '156', title: "Paramore - Misery Business", videoId: "aCyGvGEtOwc", duration: "3 Min" },
  { id: '157', title: "Fall Out Boy - Sugar, We're Goin Down", videoId: "uhG-vLZrb-g", duration: "3 Min" },
  { id: '158', title: "My Chemical Romance - Teenagers", videoId: "k6EQAOmJrbw", duration: "2 Min" },
  { id: '159', title: "Panic! At The Disco - I Write Sins Not Tragedies", videoId: "vc6vs-l5dkc", duration: "3 Min" },
  { id: '160', title: "Twenty One Pilots - Stressed Out", videoId: "pXRV2iM8-cw", duration: "3 Min" },
  { id: '161', title: "The Strokes - Reptilia", videoId: "b8-tXG8KrWs", duration: "3 Min" },
  { id: '162', title: "Franz Ferdinand - Take Me Out", videoId: "GhCXAiNz9Jo", duration: "3 Min" }
];

const songsArrStr = moreSongs.map(s => {
  return `  {
    id: '${s.id}',
    title: '${s.title.replace(/'/g, "\\'")}',
    videoId: '${s.videoId}',
    duration: '${s.duration}',
    thumbnail: 'https://img.youtube.com/vi/${s.videoId}/mqdefault.jpg'
  }`;
}).join(',\n');

let fileContent = fs.readFileSync('src/components/MusicWidget.tsx', 'utf8');
const searchRegex = /const WORKOUT_MIXES = \[/;

if (searchRegex.test(fileContent)) {
  fileContent = fileContent.replace(searchRegex, `const WORKOUT_MIXES = [\n${songsArrStr},`);
  fs.writeFileSync('src/components/MusicWidget.tsx', fileContent);
  console.log("Songs added!");
} else {
  console.log("Could not find WORKOUT_MIXES");
}
