import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getMusicIds() {
  const songs = [
    "Tom Jones - Delilah",
    "Les Cowboys Fringants - Les étoiles filantes",
    "Les Cowboys Fringants - Toune d'automne",
    "Les Cowboys Fringants - L'Amérique pleure",
    "Les Cowboys Fringants - Joyeux Calvaire",
    "Kaïn - Embarque ma belle",
    "Kaïn - Yé midi kek part",
    "Kaïn - La bonne franquette",
    "Kaïn - Comme dans le temps"
  ];

  const results = [];
  for (const song of songs) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the official or most popular YouTube video ID for the song: "${song}". Return ONLY the 11-character video ID.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    results.push({ song, id: response.text.trim() });
  }
  console.log(JSON.stringify(results, null, 2));
}

getMusicIds();
