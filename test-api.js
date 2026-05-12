import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_PROMPT = `Tu es un coach...`;

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const workoutDaySchema = {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING },
        is_rest_day: { type: Type.BOOLEAN },
        focus: { type: Type.STRING },
        safety_alerts: { type: Type.ARRAY, items: { type: Type.STRING } },
        warmup: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, duration: { type: Type.STRING }, instructions: { type: Type.STRING } } } },
        workout: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, image_search_query: { type: Type.STRING }, sets: { type: Type.NUMBER }, reps: { type: Type.STRING }, duration_seconds: { type: Type.NUMBER }, rest_time_seconds: { type: Type.NUMBER }, rpe: { type: Type.NUMBER }, rest: { type: Type.STRING }, instructions: { type: Type.STRING }, tips: { type: Type.ARRAY, items: { type: Type.STRING } }, technique: { type: Type.STRING }, group_id: { type: Type.STRING } } } },
        cardio: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, duration: { type: Type.STRING }, intensity: { type: Type.STRING }, instructions: { type: Type.STRING } } },
        cooldown: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, duration: { type: Type.STRING }, instructions: { type: Type.STRING } } } }
      }
    };

    const schema = {
      type: Type.OBJECT,
      properties: {
        weekly_plan: {
          type: Type.ARRAY,
          items: workoutDaySchema
        }
      },
      required: ["weekly_plan"]
    };

    const model = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Génère un plan de entraînement extrêmement détaillé pour cet utilisateur : {"weight":70,"height":175,"age":30,"activity_level":"sedentary","gender":"male","goal":"lose_weight"}.`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    console.log(model.text);
  } catch (error) {
    console.error("ERROR:", error);
  }
}
test();
