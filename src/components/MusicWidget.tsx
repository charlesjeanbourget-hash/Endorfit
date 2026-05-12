import React, { useState } from 'react';
import { Music, X, PlayCircle, ListMusic, Headphones } from 'lucide-react';

const WORKOUT_MIXES = [
  {
    id: '113',
    title: 'The Weeknd - Blinding Lights',
    videoId: '4NRXx6U8ABQ',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/mqdefault.jpg'
  },
  {
    id: '114',
    title: 'Dua Lipa - Levitating',
    videoId: 'TUVcZfQe-Kw',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/TUVcZfQe-Kw/mqdefault.jpg'
  },
  {
    id: '115',
    title: 'Eminem - Lose Yourself',
    videoId: '_Yhyp-_hX2s',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/_Yhyp-_hX2s/mqdefault.jpg'
  },
  {
    id: '116',
    title: 'Kanye West - POWER',
    videoId: 'L53gjP-TtGE',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/L53gjP-TtGE/mqdefault.jpg'
  },
  {
    id: '117',
    title: 'Avicii - Wake Me Up',
    videoId: 'IcrbM1l_BoI',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/IcrbM1l_BoI/mqdefault.jpg'
  },
  {
    id: '118',
    title: 'Ed Sheeran - Shape of You',
    videoId: 'JGwWNGJdvx8',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg'
  },
  {
    id: '119',
    title: 'Macklemore - Can\'t Hold Us',
    videoId: '2zNSgSzhBfM',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/2zNSgSzhBfM/mqdefault.jpg'
  },
  {
    id: '120',
    title: 'Imagine Dragons - Believer',
    videoId: '7wtfhZwyrcc',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/7wtfhZwyrcc/mqdefault.jpg'
  },
  {
    id: '121',
    title: 'David Guetta - Titanium',
    videoId: 'JRfuAukYTKg',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/JRfuAukYTKg/mqdefault.jpg'
  },
  {
    id: '122',
    title: 'Coldplay - Viva La Vida',
    videoId: 'dvgZvnPRvw',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/dvgZvnPRvw/mqdefault.jpg'
  },
  {
    id: '123',
    title: 'Katy Perry - Roar',
    videoId: 'CevxZvSJLk8',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/CevxZvSJLk8/mqdefault.jpg'
  },
  {
    id: '124',
    title: 'Lady Gaga - Bad Romance',
    videoId: 'qrO4YZeyl0I',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/qrO4YZeyl0I/mqdefault.jpg'
  },
  {
    id: '125',
    title: 'The Black Eyed Peas - I Gotta Feeling',
    videoId: 'uSD4vsh1zDA',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/uSD4vsh1zDA/mqdefault.jpg'
  },
  {
    id: '126',
    title: 'Sia - Chandelier',
    videoId: '2vjPBrBU-TM',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/2vjPBrBU-TM/mqdefault.jpg'
  },
  {
    id: '127',
    title: 'Rihanna - We Found Love',
    videoId: 'tg00YEETFzg',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/tg00YEETFzg/mqdefault.jpg'
  },
  {
    id: '128',
    title: 'Beyoncé - Crazy In Love',
    videoId: 'ViwtNLUqkMY',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/ViwtNLUqkMY/mqdefault.jpg'
  },
  {
    id: '129',
    title: 'Outkast - Hey Ya!',
    videoId: 'PWgvGjAhvIw',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/PWgvGjAhvIw/mqdefault.jpg'
  },
  {
    id: '130',
    title: 'Shakira - Waka Waka',
    videoId: 'pRpeEdMmi_o',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/pRpeEdMmi_o/mqdefault.jpg'
  },
  {
    id: '131',
    title: 'Bruno Mars - Uptown Funk',
    videoId: 'OPf0YbXqDm0',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/mqdefault.jpg'
  },
  {
    id: '132',
    title: 'Post Malone - Circles',
    videoId: 'wXhTHyIgQ_U',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/wXhTHyIgQ_U/mqdefault.jpg'
  },
  {
    id: '133',
    title: 'Harry Styles - As It Was',
    videoId: 'H5v3kku4y6Q',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/H5v3kku4y6Q/mqdefault.jpg'
  },
  {
    id: '134',
    title: 'Billie Eilish - bad guy',
    videoId: 'DyDfgMOUjCI',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/DyDfgMOUjCI/mqdefault.jpg'
  },
  {
    id: '135',
    title: 'Drake - God\'s Plan',
    videoId: 'xpVfcZ0ZcFM',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/xpVfcZ0ZcFM/mqdefault.jpg'
  },
  {
    id: '136',
    title: 'Travis Scott - SICKO MODE',
    videoId: '6ONRf7h3Mdk',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/6ONRf7h3Mdk/mqdefault.jpg'
  },
  {
    id: '137',
    title: 'Kendrick Lamar - HUMBLE.',
    videoId: 'tvTRZCU1tP4',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/tvTRZCU1tP4/mqdefault.jpg'
  },
  {
    id: '138',
    title: 'Foo Fighters - The Pretender',
    videoId: 'SBjQ9tuuTJQ',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/SBjQ9tuuTJQ/mqdefault.jpg'
  },
  {
    id: '139',
    title: 'Linkin Park - Numb',
    videoId: 'kXYiU_JCYtU',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/kXYiU_JCYtU/mqdefault.jpg'
  },
  {
    id: '140',
    title: 'Red Hot Chili Peppers - Can\'t Stop',
    videoId: 'BfOdWSiYKmc',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/BfOdWSiYKmc/mqdefault.jpg'
  },
  {
    id: '141',
    title: 'The Killers - Mr. Brightside',
    videoId: 'gGdGFtwczR8',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/gGdGFtwczR8/mqdefault.jpg'
  },
  {
    id: '142',
    title: 'Muse - Uprising',
    videoId: 'w8KOf2yV_N4',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/w8KOf2yV_N4/mqdefault.jpg'
  },
  {
    id: '143',
    title: 'Arctic Monkeys - Do I Wanna Know?',
    videoId: 'bpOSxM0rNPM',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/bpOSxM0rNPM/mqdefault.jpg'
  },
  {
    id: '144',
    title: 'Calvin Harris - Summer',
    videoId: 'ebXbLfLJCA',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/ebXbLfLJCA/mqdefault.jpg'
  },
  {
    id: '145',
    title: 'Tiësto - The Business',
    videoId: 'nCg3ufihKyU',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/nCg3ufihKyU/mqdefault.jpg'
  },
  {
    id: '146',
    title: 'Skrillex - Bangarang',
    videoId: 'YJVmu6yttsq',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/YJVmu6yttsq/mqdefault.jpg'
  },
  {
    id: '147',
    title: 'Oasis - Wonderwall',
    videoId: '6hzrDeceEKc',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/6hzrDeceEKc/mqdefault.jpg'
  },
  {
    id: '148',
    title: 'Blink-182 - All The Small Things',
    videoId: '9Ht5RZpzPqw',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/9Ht5RZpzPqw/mqdefault.jpg'
  },
  {
    id: '149',
    title: 'Green Day - American Idiot',
    videoId: 'Ee_uiX2nJb4',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/Ee_uiX2nJb4/mqdefault.jpg'
  },
  {
    id: '150',
    title: 'System Of A Down - Chop Suey!',
    videoId: 'CSvFpBOe8eY',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/CSvFpBOe8eY/mqdefault.jpg'
  },
  {
    id: '151',
    title: 'Papa Roach - Last Resort',
    videoId: '3v3r2Yt25tQ',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/3v3r2Yt25tQ/mqdefault.jpg'
  },
  {
    id: '152',
    title: 'Disturbed - Down With The Sickness',
    videoId: '09LTT0xwdfw',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/09LTT0xwdfw/mqdefault.jpg'
  },
  {
    id: '153',
    title: 'Slipknot - Duality',
    videoId: '6fVE8kSM43I',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/6fVE8kSM43I/mqdefault.jpg'
  },
  {
    id: '154',
    title: 'Korn - Freak On a Leash',
    videoId: 'jRGrNDV2mKc',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/jRGrNDV2mKc/mqdefault.jpg'
  },
  {
    id: '155',
    title: 'Avril Lavigne - Sk8er Boi',
    videoId: 'TIy3n2b7V9k',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/TIy3n2b7V9k/mqdefault.jpg'
  },
  {
    id: '156',
    title: 'Paramore - Misery Business',
    videoId: 'aCyGvGEtOwc',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/aCyGvGEtOwc/mqdefault.jpg'
  },
  {
    id: '157',
    title: 'Fall Out Boy - Sugar, We\'re Goin Down',
    videoId: 'uhG-vLZrb-g',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/uhG-vLZrb-g/mqdefault.jpg'
  },
  {
    id: '158',
    title: 'My Chemical Romance - Teenagers',
    videoId: 'k6EQAOmJrbw',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/k6EQAOmJrbw/mqdefault.jpg'
  },
  {
    id: '159',
    title: 'Panic! At The Disco - I Write Sins Not Tragedies',
    videoId: 'vc6vs-l5dkc',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/vc6vs-l5dkc/mqdefault.jpg'
  },
  {
    id: '160',
    title: 'Twenty One Pilots - Stressed Out',
    videoId: 'pXRV2iM8-cw',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/pXRV2iM8-cw/mqdefault.jpg'
  },
  {
    id: '161',
    title: 'The Strokes - Reptilia',
    videoId: 'b8-tXG8KrWs',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/b8-tXG8KrWs/mqdefault.jpg'
  },
  {
    id: '162',
    title: 'Franz Ferdinand - Take Me Out',
    videoId: 'GhCXAiNz9Jo',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/GhCXAiNz9Jo/mqdefault.jpg'
  },
  {
    id: '1',
    title: 'Survivor - Eye Of The Tiger',
    videoId: 'btPJPFnesV4',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/btPJPFnesV4/mqdefault.jpg'
  },
  {
    id: '2',
    title: "Bryan Adams - Summer Of '69",
    videoId: '9f06QZCVUHg',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/9f06QZCVUHg/mqdefault.jpg'
  },
  {
    id: '3',
    title: "Bon Jovi - Livin' On A Prayer",
    videoId: 'lDK9QqIzhwk',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/lDK9QqIzhwk/mqdefault.jpg'
  },
  {
    id: '4',
    title: 'AC/DC - Thunderstruck',
    videoId: 'v2AC41dglnM',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/v2AC41dglnM/mqdefault.jpg'
  },
  {
    id: '5',
    title: "Queen - Don't Stop Me Now",
    videoId: 'HgzGwKwLmgM',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/HgzGwKwLmgM/mqdefault.jpg'
  },
  {
    id: '6',
    title: "Guns N' Roses - Welcome To The Jungle",
    videoId: 'o1tj2zJ2Wvg',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/o1tj2zJ2Wvg/mqdefault.jpg'
  },
  {
    id: '7',
    title: 'Europe - The Final Countdown',
    videoId: '9jK-NcRmVcw',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/9jK-NcRmVcw/mqdefault.jpg'
  },
  {
    id: '8',
    title: 'Kenny Loggins - Danger Zone',
    videoId: 'siwpn14IE7E',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/siwpn14IE7E/mqdefault.jpg'
  },
  {
    id: '9',
    title: "Journey - Don't Stop Believin'",
    videoId: '1k8craCGpgs',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/1k8craCGpgs/mqdefault.jpg'
  },
  {
    id: '10',
    title: 'AC/DC - Back In Black',
    videoId: 'pAgnJDJN4VA',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/pAgnJDJN4VA/mqdefault.jpg'
  },
  {
    id: '11',
    title: 'Queen - We Will Rock You',
    videoId: '-tJYN-eG1zk',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/-tJYN-eG1zk/mqdefault.jpg'
  },
  {
    id: '12',
    title: 'Aerosmith - Walk This Way',
    videoId: '4c8O2n1Gfto',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/4c8O2n1Gfto/mqdefault.jpg'
  },
  {
    id: '13',
    title: "KISS - I Was Made For Lovin' You",
    videoId: 'ZhIsAZO5gl0',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/ZhIsAZO5gl0/mqdefault.jpg'
  },
  {
    id: '14',
    title: "Joan Jett - I Love Rock 'n' Roll",
    videoId: 'wMsazR6Tnf8',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/wMsazR6Tnf8/mqdefault.jpg'
  },
  {
    id: '15',
    title: 'Bruce Springsteen - Born to Run',
    videoId: 'IxuThNgl3YA',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/IxuThNgl3YA/mqdefault.jpg'
  },
  {
    id: '16',
    title: 'The Rolling Stones - Start Me Up',
    videoId: 'SGyOaCXr8Lw',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/SGyOaCXr8Lw/mqdefault.jpg'
  },
  {
    id: '17',
    title: 'Metallica - Enter Sandman',
    videoId: 'CD-E-LDc384',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/CD-E-LDc384/mqdefault.jpg'
  },
  {
    id: '18',
    title: 'Nirvana - Smells Like Teen Spirit',
    videoId: 'hTWKbfoikeg',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/hTWKbfoikeg/mqdefault.jpg'
  },
  {
    id: '19',
    title: 'Van Halen - Jump',
    videoId: 'SwYN7mTi6HM',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/SwYN7mTi6HM/mqdefault.jpg'
  },
  {
    id: '20',
    title: 'Survivor - Burning Heart',
    videoId: 'Kc71KZG87X4',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/Kc71KZG87X4/mqdefault.jpg'
  },
  {
    id: '21',
    title: 'Elvis Presley - Jailhouse Rock',
    videoId: 'gj0Rz-uP4Mk',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/gj0Rz-uP4Mk/mqdefault.jpg'
  },
  {
    id: '22',
    title: 'Elvis Presley - Hound Dog',
    videoId: 'aNYWl13IWhY',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/aNYWl13IWhY/mqdefault.jpg'
  },
  {
    id: '23',
    title: 'Elvis Presley - Blue Suede Shoes',
    videoId: 'Bm5HKlQ6nGM',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/Bm5HKlQ6nGM/mqdefault.jpg'
  },
  {
    id: '24',
    title: 'Little Richard - Tutti Frutti',
    videoId: 'F13JNjpNW6c',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/F13JNjpNW6c/mqdefault.jpg'
  },
  {
    id: '25',
    title: 'Little Richard - Long Tall Sally',
    videoId: 'Q0cBzyYlJuo',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/Q0cBzyYlJuo/mqdefault.jpg'
  },
  {
    id: '26',
    title: 'The Beatles - Twist and Shout',
    videoId: '2RicaUqd9Hg',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/2RicaUqd9Hg/mqdefault.jpg'
  },
  {
    id: '27',
    title: 'The Beatles - Hey Jude',
    videoId: 'A_MjCqQoLLA',
    duration: '7 Min',
    thumbnail: 'https://img.youtube.com/vi/A_MjCqQoLLA/mqdefault.jpg'
  },
  {
    id: '28',
    title: "Bee Gees - Stayin' Alive",
    videoId: 'I_izvAbhExY',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/I_izvAbhExY/mqdefault.jpg'
  },
  {
    id: '29',
    title: 'Bee Gees - Night Fever',
    videoId: '-ihs-vT9T3Q',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/-ihs-vT9T3Q/mqdefault.jpg'
  },
  {
    id: '30',
    title: "Tom Jones - It's Not Unusual",
    videoId: '2h1XHxVQIVY',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/2h1XHxVQIVY/mqdefault.jpg'
  },
  {
    id: '31',
    title: "Tom Jones - She's A Lady",
    videoId: 'EC6ZVvshpuw',
    duration: '2 Min',
    thumbnail: 'https://img.youtube.com/vi/EC6ZVvshpuw/mqdefault.jpg'
  },
  {
    id: '32',
    title: 'Tom Jones - Delilah',
    videoId: 'Qvo5SeAwz88',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/Qvo5SeAwz88/mqdefault.jpg'
  },
  {
    id: '33',
    title: 'Les Cowboys Fringants - Les étoiles filantes',
    videoId: 'j6QGhc67iJY',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/j6QGhc67iJY/mqdefault.jpg'
  },
  {
    id: '34',
    title: "Les Cowboys Fringants - Toune d'automne",
    videoId: 'Zu39zAMvk1c',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/Zu39zAMvk1c/mqdefault.jpg'
  },
  {
    id: '35',
    title: "Les Cowboys Fringants - L'Amérique pleure",
    videoId: 'sYRp8oP0yiw',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/sYRp8oP0yiw/mqdefault.jpg'
  },
  {
    id: '36',
    title: 'Les Cowboys Fringants - Joyeux Calvaire',
    videoId: 'BOsoq482X9k',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/BOsoq482X9k/mqdefault.jpg'
  },
  {
    id: '37',
    title: 'Kaïn - Embarque ma belle',
    videoId: 'zZU7wTcg698',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/zZU7wTcg698/mqdefault.jpg'
  },
  {
    id: '38',
    title: 'Kaïn - Yé midi kek part',
    videoId: 'uRyE8kZFxDA',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/uRyE8kZFxDA/mqdefault.jpg'
  },
  {
    id: '39',
    title: 'Kaïn - La bonne franquette',
    videoId: 'MQZi0Y5Mt0U',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/MQZi0Y5Mt0U/mqdefault.jpg'
  },
  {
    id: '40',
    title: 'Kaïn - Comme dans le temps',
    videoId: 'oMO_v_SWP04',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/oMO_v_SWP04/mqdefault.jpg'
  },
  {
    id: '41',
    title: 'Michael Jackson - Billie Jean',
    videoId: 'Zi_XLOBDo_Y',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/Zi_XLOBDo_Y/mqdefault.jpg'
  },
  {
    id: '42',
    title: 'Prince - Purple Rain',
    videoId: 'TvnYmWpD_T8',
    duration: '8 Min',
    thumbnail: 'https://img.youtube.com/vi/TvnYmWpD_T8/mqdefault.jpg'
  },
  {
    id: '43',
    title: 'Madonna - Like a Prayer',
    videoId: '79fzeNUqQbQ',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/79fzeNUqQbQ/mqdefault.jpg'
  },
  {
    id: '44',
    title: 'Whitney Houston - I Wanna Dance with Somebody',
    videoId: 'eH3giaIzONA',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/eH3giaIzONA/mqdefault.jpg'
  },
  {
    id: '45',
    title: 'Rick Astley - Never Gonna Give You Up',
    videoId: 'dQw4w9WgXcQ',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
  },
  {
    id: '46',
    title: 'Tears for Fears - Everybody Wants To Rule The World',
    videoId: 'aGCdLKXNF3w',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/aGCdLKXNF3w/mqdefault.jpg'
  },
  {
    id: '47',
    title: 'a-ha - Take On Me',
    videoId: 'djV11Xbc914',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/djV11Xbc914/mqdefault.jpg'
  },
  {
    id: '48',
    title: 'Cyndi Lauper - Girls Just Want To Have Fun',
    videoId: 'PIb6AZdTr-A',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/PIb6AZdTr-A/mqdefault.jpg'
  },
  {
    id: '49',
    title: 'Wham! - Wake Me Up Before You Go-Go',
    videoId: 'pIgZ7gMze7A',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/pIgZ7gMze7A/mqdefault.jpg'
  },
  {
    id: '50',
    title: 'Eurythmics - Sweet Dreams (Are Made of This)',
    videoId: 'qeMFqkcPYcg',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/qeMFqkcPYcg/mqdefault.jpg'
  },
  {
    id: '51',
    title: 'Dr. Dre ft. Snoop Dogg - Still D.R.E.',
    videoId: '_CL6n0FJZpk',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/_CL6n0FJZpk/mqdefault.jpg'
  },
  {
    id: '52',
    title: 'Eminem - Lose Yourself',
    videoId: '_Yhyp-_hX2s',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/_Yhyp-_hX2s/mqdefault.jpg'
  },
  {
    id: '53',
    title: 'Outkast - Hey Ya!',
    videoId: 'PWgvGjAhvIw',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/PWgvGjAhvIw/mqdefault.jpg'
  },
  {
    id: '54',
    title: 'Britney Spears - ...Baby One More Time',
    videoId: 'C-u5WLJ9Yk4',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/C-u5WLJ9Yk4/mqdefault.jpg'
  },
  {
    id: '55',
    title: 'Backstreet Boys - I Want It That Way',
    videoId: '4fndeDfaWCg',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/4fndeDfaWCg/mqdefault.jpg'
  },
  {
    id: '56',
    title: 'Spice Girls - Wannabe',
    videoId: 'gJLIiF15wjQ',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/gJLIiF15wjQ/mqdefault.jpg'
  },
  {
    id: '57',
    title: 'Daft Punk - One More Time',
    videoId: 'FGBhQbmPwH8',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/FGBhQbmPwH8/mqdefault.jpg'
  },
  {
    id: '58',
    title: 'Gorillaz - Feel Good Inc.',
    videoId: 'HyHNuVaZJ-k',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/HyHNuVaZJ-k/mqdefault.jpg'
  },
  {
    id: '59',
    title: 'Linkin Park - In The End',
    videoId: 'eVTXPUF4Oz4',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/eVTXPUF4Oz4/mqdefault.jpg'
  },
  {
    id: '60',
    title: 'Red Hot Chili Peppers - Californication',
    videoId: 'YlUKcNNmywk',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/YlUKcNNmywk/mqdefault.jpg'
  },
  {
    id: '61',
    title: 'Beyoncé - Crazy In Love',
    videoId: 'ViwtNLUqkMY',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/ViwtNLUqkMY/mqdefault.jpg'
  },
  {
    id: '62',
    title: 'Rihanna - Umbrella',
    videoId: 'CvBfHwUxHIk',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/CvBfHwUxHIk/mqdefault.jpg'
  },
  {
    id: '63',
    title: 'Lady Gaga - Poker Face',
    videoId: 'bESGLojNYSo',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/bESGLojNYSo/mqdefault.jpg'
  },
  {
    id: '64',
    title: 'Katy Perry - Firework',
    videoId: 'QGJuMBdaqIw',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/QGJuMBdaqIw/mqdefault.jpg'
  },
  {
    id: '65',
    title: 'Adele - Rolling in the Deep',
    videoId: 'rYEDA3JcQqw',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/rYEDA3JcQqw/mqdefault.jpg'
  },
  {
    id: '66',
    title: 'Bruno Mars - Uptown Funk',
    videoId: 'OPf0YbXqDm0',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/mqdefault.jpg'
  },
  {
    id: '67',
    title: 'Pharrell Williams - Happy',
    videoId: 'ZbZSe6N_BXs',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/ZbZSe6N_BXs/mqdefault.jpg'
  },
  {
    id: '68',
    title: 'Taylor Swift - Shake It Off',
    videoId: 'nfWlot6h_JM',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/nfWlot6h_JM/mqdefault.jpg'
  },
  {
    id: '69',
    title: 'Ed Sheeran - Shape of You',
    videoId: 'JGwWNGJdvx8',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg'
  },
  {
    id: '70',
    title: 'Luis Fonsi - Despacito',
    videoId: 'kJQP7kiw5Fk',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg'
  },
  {
    id: '71',
    title: 'Dua Lipa - Levitating',
    videoId: 'TUVcZfQe-Kw',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/TUVcZfQe-Kw/mqdefault.jpg'
  },
  {
    id: '72',
    title: 'The Weeknd - Blinding Lights',
    videoId: '4NRXx6U8ABQ',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/mqdefault.jpg'
  },
  {
    id: '73',
    title: 'Harry Styles - As It Was',
    videoId: 'H5v3kku4y6Q',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/H5v3kku4y6Q/mqdefault.jpg'
  },
  {
    id: '74',
    title: 'Miley Cyrus - Flowers',
    videoId: 'G7KNmW9a75Y',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/G7KNmW9a75Y/mqdefault.jpg'
  },
  {
    id: '75',
    title: 'Billie Eilish - bad guy',
    videoId: 'DyDfgMOUjCI',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/DyDfgMOUjCI/mqdefault.jpg'
  },
  {
    id: '76',
    title: 'Olivia Rodrigo - good 4 u',
    videoId: 'gNi_6U5Pm_o',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/gNi_6U5Pm_o/mqdefault.jpg'
  },
  {
    id: '77',
    title: 'SZA - Kill Bill',
    videoId: 'MSRcC626prw',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/MSRcC626prw/mqdefault.jpg'
  },
  {
    id: '78',
    title: 'Doja Cat - Paint The Town Red',
    videoId: 'm4_9TFeMfJE',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/m4_9TFeMfJE/mqdefault.jpg'
  },
  {
    id: '79',
    title: 'Sabrina Carpenter - Espresso',
    videoId: 'eVli-tstM5E',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/eVli-tstM5E/mqdefault.jpg'
  },
  {
    id: '80',
    title: 'Post Malone - Circles',
    videoId: 'wXhTHyIgQ_U',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/wXhTHyIgQ_U/mqdefault.jpg'
  },
  {
    id: '81',
    title: 'Drake - God\'s Plan',
    videoId: 'xpVfcZ0ZcFM',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/xpVfcZ0ZcFM/mqdefault.jpg'
  },
  {
    id: '82',
    title: 'Kendrick Lamar - HUMBLE.',
    videoId: 'tvTRZJ-4EyI',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/tvTRZJ-4EyI/mqdefault.jpg'
  },
  {
    id: '83',
    title: 'Imagine Dragons - Believer',
    videoId: '7wtfhZwyrcc',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/7wtfhZwyrcc/mqdefault.jpg'
  },
  {
    id: '84',
    title: 'Maroon 5 - Sugar',
    videoId: '09R8_2nJtjg',
    duration: '5 Min',
    thumbnail: 'https://img.youtube.com/vi/09R8_2nJtjg/mqdefault.jpg'
  },
  {
    id: '85',
    title: 'Justin Bieber - Sorry',
    videoId: 'fRh_vgS2dFE',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/fRh_vgS2dFE/mqdefault.jpg'
  },
  {
    id: '86',
    title: 'Sia - Chandelier',
    videoId: '2vjPBrBU-TM',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/2vjPBrBU-TM/mqdefault.jpg'
  },
  {
    id: '87',
    title: 'Coldplay - Viva La Vida',
    videoId: 'dvgZkm1xWPE',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/dvgZkm1xWPE/mqdefault.jpg'
  },
  {
    id: '88',
    title: 'Arctic Monkeys - Do I Wanna Know?',
    videoId: 'bpOSxM0rNPM',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/bpOSxM0rNPM/mqdefault.jpg'
  },
  {
    id: '89',
    title: 'The Killers - Mr. Brightside',
    videoId: 'gOgpdp3lP8M',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/gOgpdp3lP8M/mqdefault.jpg'
  },
  {
    id: '90',
    title: 'Kings of Leon - Use Somebody',
    videoId: 'gnhXHvRoUd0',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/gnhXHvRoUd0/mqdefault.jpg'
  },
  {
    id: '91',
    title: 'Foo Fighters - The Pretender',
    videoId: 'SBjQ9tuuTJQ',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/SBjQ9tuuTJQ/mqdefault.jpg'
  },
  {
    id: '92',
    title: 'Green Day - American Idiot',
    videoId: 'Ee_uujKuJMI',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/Ee_uujKuJMI/mqdefault.jpg'
  },
  {
    id: '93',
    title: 'Blink-182 - All The Small Things',
    videoId: '9Ht5RZpzPqw',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/9Ht5RZpzPqw/mqdefault.jpg'
  },
  {
    id: '94',
    title: 'Fall Out Boy - Sugar, We\'re Goin Down',
    videoId: 'uhG-vLZrb-g',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/uhG-vLZrb-g/mqdefault.jpg'
  },
  {
    id: '95',
    title: 'Panic! At The Disco - High Hopes',
    videoId: 'IPXIgEAGe4U',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/IPXIgEAGe4U/mqdefault.jpg'
  },
  {
    id: '96',
    title: 'Twenty One Pilots - Stressed Out',
    videoId: 'pXRviuL6vMY',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/pXRviuL6vMY/mqdefault.jpg'
  },
  {
    id: '97',
    title: 'Glass Animals - Heat Waves',
    videoId: 'mRD0-GxqHVo',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/mRD0-GxqHVo/mqdefault.jpg'
  },
  {
    id: '98',
    title: 'Lil Nas X - Old Town Road',
    videoId: 'w2Ov5jzm3j8',
    duration: '3 Min',
    thumbnail: 'https://img.youtube.com/vi/w2Ov5jzm3j8/mqdefault.jpg'
  },
  {
    id: '99',
    title: 'Bad Bunny - Tití Me Preguntó',
    videoId: 'Cr8K88UcO0s',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/Cr8K88UcO0s/mqdefault.jpg'
  },
  {
    id: '100',
    title: 'Karol G - PROVENZA',
    videoId: 'ca48oMV59LU',
    duration: '4 Min',
    thumbnail: 'https://img.youtube.com/vi/ca48oMV59LU/mqdefault.jpg'
  }
];

export const MusicWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMix, setCurrentMix] = useState(WORKOUT_MIXES[0]);
  const [hasStarted, setHasStarted] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setHasStarted(true);
  };

  const handleSelectMix = (mix: typeof WORKOUT_MIXES[0]) => {
    setCurrentMix(mix);
    setHasStarted(true);
  };

  return (
    <>
      {/* Minimized Button */}
      <button 
        onClick={handleOpen}
        className={`fixed bottom-28 left-4 sm:left-6 z-[150] bg-brand-teal text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(124,6,32,0.4)] hover:bg-brand-teal/80 transition-all duration-300 flex items-center gap-2 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Headphones size={24} />
      </button>

      {/* Full Widget */}
      <div className={`fixed bottom-28 left-4 sm:left-6 z-[150] bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl w-80 flex flex-col transition-all duration-300 origin-bottom-left ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-brand-teal font-bold">
          <Headphones size={20} />
          <span>Workout Hits</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Player */}
        <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-white/5">
          <div className="aspect-video w-full bg-black relative">
            {hasStarted ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${currentMix.videoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              ></iframe>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <PlayCircle size={40} className="text-slate-500" />
              </div>
            )}
          </div>
          <div className="p-3 text-center">
            <h4 className="text-white font-bold text-sm truncate w-full">{currentMix.title}</h4>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-slate-400 text-[10px]">{hasStarted ? 'En cours de lecture' : 'Prêt à lire'}</p>
              <a 
                href={`https://www.youtube.com/watch?v=${currentMix.videoId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-teal text-[10px] hover:underline flex items-center justify-center gap-1"
              >
                Ouvrir dans YouTube <PlayCircle size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* Playlists */}
        <div className="flex-1 overflow-y-auto max-h-48 no-scrollbar space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ListMusic size={14} /> Sélections
          </h4>
          
          {WORKOUT_MIXES.map(mix => (
            <button 
              key={mix.id}
              onClick={() => handleSelectMix(mix)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left ${
                currentMix.id === mix.id ? 'bg-brand-teal/20 border border-brand-teal/30' : 'hover:bg-slate-800'
              }`}
            >
              <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0">
                <img src={mix.thumbnail} className="w-full h-full object-cover" alt={mix.title} />
                {currentMix.id === mix.id && hasStarted && (
                  <div className="absolute inset-0 bg-brand-teal/40 flex items-center justify-center">
                    <PlayCircle size={20} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${currentMix.id === mix.id ? 'text-brand-teal' : 'text-white'}`}>
                  {mix.title}
                </p>
                <p className="text-xs text-slate-500 truncate">{mix.duration}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};
