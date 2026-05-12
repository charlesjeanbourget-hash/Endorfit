import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY,
    -- Profil et Métabolisme
    name TEXT,
    gender TEXT,
    age INTEGER,
    height REAL,
    weight REAL,
    profession TEXT,
    
    -- Santé et Biomécanique
    daily_posture TEXT,
    activity_level_non_gym TEXT,
    current_injuries TEXT,
    past_injuries TEXT,
    medical_conditions TEXT,
    medications TEXT,
    flexibility_limitations TEXT,
    chronic_pain TEXT,
    
    -- Objectifs et Psychologie
    primary_goal TEXT,
    secondary_goal TEXT,
    timeline TEXT,
    event_objective TEXT,
    event_date TEXT,
    deep_motivation TEXT,
    past_obstacles TEXT,
    
    -- Expérience et Préférences
    experience_level TEXT,
    past_sports TEXT,
    technical_mastery TEXT, -- JSON string of movements
    disliked_exercises TEXT,
    favorite_exercises TEXT,
    
    -- Logistique et Équipement
    training_location TEXT, -- 'Gym' or 'Home'
    home_equipment TEXT, -- JSON string
    days_per_week INTEGER,
    max_duration_minutes INTEGER,
    
    -- Mode de Vie et Récupération
    sleep_hours REAL,
    sleep_quality INTEGER,
    stress_level INTEGER,
    current_dietary_habits TEXT,
    general_energy_level INTEGER,
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    weight REAL,
    body_fat_percentage REAL,
    waist_cm REAL,
    chest_cm REAL,
    arms_cm REAL,
    thighs_cm REAL,
    imc REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'workout' or 'nutrition'
    content TEXT, -- JSON string from LLM
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Ensure a default user exists for the demo
  INSERT OR IGNORE INTO users (id, email, password) VALUES (1, 'demo@elitecoach.ai', 'password');
`);

// Migration: Add name and gender columns if they don't exist
try {
  db.exec(`ALTER TABLE user_profiles ADD COLUMN name TEXT;`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE user_profiles ADD COLUMN gender TEXT;`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE user_profiles ADD COLUMN event_objective TEXT;`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE user_profiles ADD COLUMN event_date TEXT;`);
} catch (e) {}

export default db;
