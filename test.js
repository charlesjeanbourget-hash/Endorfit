import { generatePlan } from './src/services/geminiService.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const res = await generatePlan({ weight: 70, height: 175, age: 30, activity_level: 'sedentary', gender: 'male', goal: 'lose_weight' }, 'workout');
    console.log(res);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
