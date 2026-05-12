import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generatePrograms = () => {
  const programs = [];
  let idCounter = 1;

  const createProgram = (name, category, location, description, level, days) => {
    const weekly_plan = [[], [], [], [], [], [], []];
    days.forEach((day, index) => {
      if (index < 7) {
        weekly_plan[index] = day;
      }
    });
    
    programs.push({
      id: `prog-${idCounter++}`,
      name,
      category,
      location,
      description,
      duration: '4 semaines',
      level,
      content: { weekly_plan }
    });
  };

  // 10 Maison (home_workout)
  for (let i = 1; i <= 10; i++) {
    createProgram(
      `Maison - Programme Full Body ${i}`,
      'home_workout',
      'home',
      `Entraînement complet à la maison sans matériel - Variante ${i}.`,
      i <= 3 ? 'Débutant' : i <= 7 ? 'Intermédiaire' : 'Avancé',
      [
        [{ name: 'Pompes', sets: 4, reps: '10-15', rest: '60s' }, { name: 'Squats', sets: 4, reps: '20', rest: '60s' }],
        [],
        [{ name: 'Fentes', sets: 4, reps: '15/jambe', rest: '60s' }, { name: 'Planche', sets: 3, reps: '45s', rest: '45s' }],
        [],
        [{ name: 'Burpees', sets: 3, reps: '10', rest: '60s' }, { name: 'Crunch', sets: 4, reps: '20', rest: '45s' }]
      ]
    );
  }

  // 10 Gym (gym_workout)
  for (let i = 1; i <= 10; i++) {
    createProgram(
      `Salle - Programme Hypertrophie ${i}`,
      'gym_workout',
      'gym',
      `Entraînement en salle avec machines et poids libres - Variante ${i}.`,
      i <= 3 ? 'Débutant' : i <= 7 ? 'Intermédiaire' : 'Avancé',
      [
        [{ name: 'Développé couché', sets: 4, reps: '8-10', rest: '90s' }, { name: 'Tirage vertical', sets: 4, reps: '10', rest: '90s' }],
        [],
        [{ name: 'Squat barre', sets: 4, reps: '8-10', rest: '120s' }, { name: 'Presse à cuisses', sets: 3, reps: '12', rest: '90s' }],
        [],
        [{ name: 'Développé militaire', sets: 4, reps: '10', rest: '90s' }, { name: 'Curl biceps', sets: 3, reps: '12', rest: '60s' }]
      ]
    );
  }

  // 5 Biceps (biceps)
  for (let i = 1; i <= 5; i++) {
    createProgram(
      `Focus Biceps ${i}`,
      'biceps',
      i % 2 === 0 ? 'home' : 'gym',
      `Programme ciblé pour exploser vos biceps - Variante ${i}.`,
      'Tous niveaux',
      [
        [{ name: 'Curl barre', sets: 4, reps: '10-12', rest: '60s' }, { name: 'Curl marteau', sets: 3, reps: '12', rest: '60s' }],
        [],
        [{ name: 'Curl pupitre', sets: 4, reps: '10', rest: '60s' }, { name: 'Curl concentré', sets: 3, reps: '12-15', rest: '45s' }],
        [],
        []
      ]
    );
  }

  // 5 Abdos (abs)
  for (let i = 1; i <= 5; i++) {
    createProgram(
      `Abdos en Béton ${i}`,
      'abs',
      'home',
      `Circuit training ciblé sur la sangle abdominale - Variante ${i}.`,
      'Tous niveaux',
      [
        [{ name: 'Crunches', sets: 4, reps: '20', rest: '30s' }, { name: 'Planche', sets: 4, reps: '60s', rest: '30s' }],
        [],
        [{ name: 'Leg Raises', sets: 4, reps: '15', rest: '30s' }, { name: 'Russian Twists', sets: 4, reps: '30', rest: '30s' }],
        [],
        [{ name: 'Mountain Climbers', sets: 4, reps: '40s', rest: '30s' }, { name: 'V-Ups', sets: 3, reps: '12', rest: '30s' }]
      ]
    );
  }

  // 5 Fessiers (glutes)
  for (let i = 1; i <= 5; i++) {
    createProgram(
      `Booty Builder ${i}`,
      'glutes',
      i % 2 === 0 ? 'home' : 'gym',
      `Programme spécial fessiers pour galber et muscler - Variante ${i}.`,
      'Tous niveaux',
      [
        [{ name: 'Hip Thrust', sets: 4, reps: '12-15', rest: '90s' }, { name: 'Fentes bulgares', sets: 3, reps: '10/jambe', rest: '60s' }],
        [],
        [{ name: 'Soulevé de terre roumain', sets: 4, reps: '10-12', rest: '90s' }, { name: 'Kickbacks', sets: 3, reps: '15/jambe', rest: '60s' }],
        [],
        []
      ]
    );
  }

  const fileContent = `export const defaultPredefinedPrograms = ${JSON.stringify(programs, null, 2)};\n`;
  
  const dirPath = path.join(__dirname, 'src', 'data');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dirPath, 'predefinedPrograms.ts'), fileContent);
  console.log('Programs generated successfully in src/data/predefinedPrograms.ts');
};

generatePrograms();
