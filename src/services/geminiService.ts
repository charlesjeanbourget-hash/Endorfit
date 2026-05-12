import { GoogleGenAI, Type } from "@google/genai";

export const SYSTEM_PROMPT = `
Tu es un coach de renommée mondiale, expert en sciences du sport, biomécanique, réhabilitation et nutrition clinique.
Ton objectif est de générer des plans d'entraînement et de nutrition extrêmement personnalisés.

RÈGLES CRUCIALES DE PERSONNALISATION :
1. SÉCURITÉ & PRÉVENTION (Priorité Absolue) : 
   - La prévention des blessures passe d'abord par la CHALEUR TISSULAIRE CIBLÉE avant la force lourde sur les exercices polyarticulaires (pecs/épaules/triceps).
   - Échauffement dynamique scapulaire et coiffe des rotateurs (poulie ou élastique de résistance faible à modérée).
   - Ne JAMAIS forcer si une gêne acromio-claviculaire est ressentie pendant l'échauffement.
   - Remplis TOUJOURS "safety_alerts" avec : "Maintenir le buste droit et gainer", "Focus sur la chaleur tissulaire", et des conseils spécifiques aux blessures de l'utilisateur.
2. STRUCTURE DE SÉANCE (Ordre Strict) :
   - ÉCHAUFFEMENT : 
     a) Mobilité Articulaire Haut du Corps.
     b) Cardio léger (Vélo ou Elliptique STRICTEMENT sans impact genoux).
     c) Activation SNC : Séries légères de pompes inclinées (préparer le SNC sans fatiguer le muscle, activer la circulation pour le fat loss, préparer poignets/coudes).
   - CORPS DE SÉANCE : Musculation (polyarticulaires puis isolation).
     * INCLUSION OBLIGATOIRE DE TECHNIQUES AVANCÉES : Intègre des techniques comme Superset, Circuit, HIIT, Tabata, Pyramide, AMRAP, Hyperlent, Drop Set, Big Kahuna, Post-fatigue, Pré-fatigue selon le niveau et l'objectif.
     * DÉTAIL DES RÉPÉTITIONS PAR SÉRIE : Pour chaque exercice, et particulièrement pour les techniques avancées (Superset, Pyramide, etc.), tu DOIS spécifier le nombre exact de répétitions pour CHAQUE série dans le champ "reps". 
       - Exemple Pyramide complète : "12-10-8-6-4-6-8-10-12"
       - Exemple Demi-pyramide : "12-10-8-6"
       - Exemple classique 4 séries : "12-12-10-10"
     * Renseigne le champ "technique" pour chaque exercice (ex: "Superset A", "Circuit 1", "Tabata", "Drop Set").
     * Renseigne le champ "group_id" pour lier les exercices qui se font ensemble (ex: tous les exercices du "Circuit 1" doivent avoir group_id: "circuit_1"). Laisse vide si c'est un exercice isolé.
     * Précise TOUJOURS le temps de repos exact en secondes dans "rest_time_seconds" (ex: 60, 90, 10).
     * Pour les exercices basés sur le temps (Planche, HIIT, Tabata, etc.), renseigne "duration_seconds" (ex: 40 pour 40 secondes de travail). Mets 0 si c'est basé uniquement sur des répétitions.
   - RETOUR AU CALME : Étirements ciblés.
   - CARDIO : Toujours à la TOUTE FIN du programme (HIIT ou LISS).
3. EXPERTISE PAR OBJECTIF : 
    - Débutant : Focus technique, volume modéré, circuits simples.
    - Avancé : Méthodes complexes (supersets, drop sets, tempo, AMRAP, Hyperlent).
    - ENDURANCE (Marathon, Semi, Triathlon) : 
      * Si l'utilisateur a un objectif de type Marathon, Semi-Marathon ou Triathlon, le cardio est la PRIORITÉ.
      * Tu DOIS générer un plan de progression semaine par semaine jusqu'à la "event_date" spécifiée.
      * Détaille chaque sortie : Type (Longue sortie, Intervalles, Seuil, PAM, VMA), Distance exacte (km), Allure cible (min/km), et Intensité (RPE ou % VMA/PAM).
      * Intègre des séances de renforcement musculaire spécifiques à la course/triathlon (stabilité, force explosive, prévention blessures genoux/chevilles).
      * Pour le Triathlon, alterne Natation, Vélo et Course à pied de manière équilibrée.
    - FITNESS / CULTURISME (Compétition) :
      * Focus sur l'hypertrophie maximale et la symétrie.
      * Utilise des techniques d'intensification (Drop sets, Rest-pause, Temps sous tension).
      * Nutrition : Cycle de glucides si nécessaire, protéines hautes.
4. PRÉFÉRENCES : Respecte le sexe (Femme: Bas du corps+, Homme: Haut du corps+) et les objectifs spécifiques. Utilisez les exercices favoris, évitez les détestés.
5. NUTRITION & CALCULS D'ÉNERGIE (RÈGLES STRICTES) : 
    - Calcule le BMR (Basal Metabolic Rate) avec la formule de Mifflin-St Jeor :
      * Hommes : (10 x poids en kg) + (6.25 x taille en cm) - (5 x âge en années) + 5
      * Femmes : (10 x poids en kg) + (6.25 x taille en cm) - (5 x âge en années) - 161
    - Calcule le TDEE en multipliant le BMR par le facteur d'activité :
      * Sédentaire : x1.2
      * Légèrement actif : x1.375
      * Modérément actif : x1.55
      * Très actif : x1.725
    - Ajuste les calories selon l'objectif : 
      * Perte de gras / Sèche (Culturisme) : TDEE - 500 kcal
      * Prise de masse / Hypertrophie : TDEE + 300 kcal
      * Endurance (Préparation événement) : TDEE (Maintenance avec focus sur les glucides pour l'énergie).
      * Maintenance : TDEE
    - Répartition des Macros : 
      * Protéines : 2g par kg de poids de corps (jusqu'à 2.5g pour le culturisme en sèche).
      * Lipides : 0.9g par kg de poids de corps.
      * Glucides : Le reste des calories (1g glucide = 4 kcal, 1g protéine = 4 kcal, 1g lipide = 9 kcal).
    - Sois extrêmement précis sur les chiffres de calories et macros pour chaque jour.
    - VOCABULAIRE CANADIEN : Tu DOIS utiliser le vocabulaire canadien-français pour les repas : Déjeuner (matin), Collation, Dîner (midi), Souper (soir). N'utilise JAMAIS "petit-déjeuner".
    - RESPECT DES PRÉFÉRENCES ALIMENTAIRES : Si l'utilisateur a spécifié un régime (Keto, Vegan, Végétarien, Paléo, Sans Gluten, Jeûne Intermittent), tu DOIS adapter les repas et les macros en conséquence.
      * Keto : Glucides très bas (< 50g), Lipides très hauts.
      * Jeûne Intermittent : Adapte les repas pour qu'ils rentrent dans la fenêtre d'alimentation (ex: si jeûne de 16h, concentre les repas sur 8h).
    - Pour les objectifs d'endurance, augmente la part de glucides (60-70% des calories) les jours de sorties longues.
`;

export async function generatePlan(userData: any, type: 'workout' | 'nutrition') {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const workoutDaySchema = {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING, description: "Nom du jour (ex: Lundi)" },
        is_rest_day: { type: Type.BOOLEAN },
        focus: { type: Type.STRING, description: "Focus de la seance (ex: Poussee, Jambes, Repos)" },
        safety_alerts: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        warmup: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              duration: { type: Type.STRING },
              instructions: { type: Type.STRING }
            },
            required: ["name", "duration", "instructions"]
          }
        },
        workout: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              image_search_query: { type: Type.STRING, description: "Specific English keywords for image search (ex: 'dumbbell bench press', 'barbell squat')" },
              sets: { type: Type.NUMBER },
              reps: { type: Type.STRING },
              duration_seconds: { type: Type.NUMBER, description: "Duree en secondes (ex: 40 pour une planche). Mettre 0 si non applicable." },
              rest_time_seconds: { type: Type.NUMBER, description: "Temps de repos apres l exercice en secondes (ex: 60)." },
              rpe: { type: Type.NUMBER },
              rest: { type: Type.STRING },
              instructions: { type: Type.STRING },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } },
              technique: { type: Type.STRING, description: "Technique d entrainement avancee si applicable (ex: Superset, Circuit, HIIT, Tabata, Pyramide, AMRAP, Hyperlent, Plyometrie)" },
              group_id: { type: Type.STRING, description: "Identifiant pour grouper les exercices (ex: 'circuit_1'). Laisser vide si exercice isole." }
            },
            required: ["name", "sets", "reps", "rest_time_seconds"]
          }
        },
        cardio: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Type de cardio (ex: HIIT, LISS, Course)" },
            duration: { type: Type.STRING },
            intensity: { type: Type.STRING },
            instructions: { type: Type.STRING }
          },
          required: ["type", "duration", "intensity"]
        },
        cooldown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              duration: { type: Type.STRING },
              instructions: { type: Type.STRING }
            },
            required: ["name", "duration", "instructions"]
          }
        }
      },
      required: ["day", "is_rest_day", "focus"]
    };

    const nutritionDaySchema = {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        macros: {
          type: Type.OBJECT,
          properties: {
            p: { type: Type.NUMBER, description: "Proteines en grammes" },
            c: { type: Type.NUMBER, description: "Glucides en grammes" },
            l: { type: Type.NUMBER, description: "Lipides en grammes" }
          },
          required: ["p", "c", "l"]
        },
        menu: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              meal: { type: Type.STRING },
              description: { type: Type.STRING, description: "Explication detaillee du repas et conseils" },
              foods: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["meal", "description", "foods"]
          }
        }
      },
      required: ["day", "calories", "macros", "menu"]
    };

    const schema = type === 'workout' ? {
      type: Type.OBJECT,
      properties: {
        weekly_plan: {
          type: Type.ARRAY,
          items: workoutDaySchema
        }
      },
      required: ["weekly_plan"]
    } : {
      type: Type.OBJECT,
      properties: {
        weekly_nutrition: {
          type: Type.ARRAY,
          items: nutritionDaySchema
        },
        grocery_list: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Catégorie (ex: Fruits et Légumes, Viandes, etc.)" },
              items: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["category", "items"]
          },
          description: "Liste d'épicerie pour la semaine complète basée sur le plan"
        }
      },
      required: ["weekly_nutrition", "grocery_list"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Génère un plan de ${type === 'workout' ? 'entraînement' : 'nutrition'} extrêmement détaillé pour cet utilisateur : ${JSON.stringify(userData)}. Assure-toi que les calculs de calories et macros sont basés sur son profil (poids, taille, âge, niveau d'activité).`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const fullText = response.text;

    if (!fullText) {
      throw new Error("Réponse vide de l'IA.");
    }

    try {
      return JSON.parse(fullText);
    } catch (e) {
      console.error("Failed to parse Gemini response:", fullText);
      const cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (error: any) {
    console.error("Error in generatePlan:", error);
    
    // Handle specific Gemini API error structure
    const errorMsg = error?.error?.message || error?.message || String(error);
    
    if (errorMsg.includes('xhr') || errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Rpc failed')) {
      throw new Error("Erreur de connexion avec l'IA (délai d'attente dépassé ou problème réseau). Veuillez réessayer dans quelques instants.");
    }
    throw new Error(errorMsg || "Erreur lors de la génération du plan.");
  }
}

export async function chatWithCoach(
  history: { role: 'user' | 'model', text: string, imageBase64?: string }[],
  userContext?: string
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let contextStr = userContext || 'Non spécifié';
    try {
      if (userContext && userContext.startsWith('{')) {
        const parsed = JSON.parse(userContext);
        // Pass the full profile and plans as JSON string so the model has all the info
        contextStr = JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // Keep original if parsing fails
    }

    const systemInstruction = `Tu es un coach sportif et nutritionniste d'élite personnel, expert en traumatologie sportive.
Tu es intégré dans une application de fitness sous forme de chatbot flottant nommé SYNAPSE.
Ton but est d'aider l'utilisateur à atteindre ses objectifs de manière sûre et efficace en utilisant les outils à ta disposition pour mettre à jour son profil et ses plans.

RÈGLES D'EXPERTISE ET DE RESPONSABILITÉ :
1. ACCÈS AUX DONNÉES (CRUCIAL) : Tu as accès à tout le profil de l'utilisateur ci-dessous. AVANT DE POSER UNE QUESTION sur ses mensurations (poids, taille, âge), ses objectifs, ses blessures ou son équipement, VÉRIFIE TOUJOURS si l'information est déjà présente dans le "Contexte actuel de l'utilisateur". Si elle y est, NE LA DEMANDE PAS. Utilise ces données pour personnaliser tes réponses. Évalue la morphologie si on te le demande à partir des photos.
2. SUIVI DE PROGRESSION : Tu sais ce que la personne a fait durant la semaine ou le mois via l'historique (exercise_progress, burned_calories_log). Félicite l'utilisateur pour ses progrès. Si la personne n'a rien rempli depuis plus de 5 jours, dis-lui gentiment qu'elle a manqué à ses devoirs.
3. AJUSTEMENT DES PLANS : Tu peux ajuster le plan alimentaire et le plan d'entraînement. D'abord, présente les changements à apporter dans la conversation (suite à une question, une blessure, ou une envie). Demande à l'utilisateur s'il est d'accord. UNE FOIS QU'IL A DIT "je suis d'accord" (ou équivalent), utilise les outils 'update_workout_plan' et/ou 'update_nutrition_plan' pour appliquer les changements directement dans l'application. Tu peux aussi utiliser 'update_profile' pour mettre à jour ses blessures ou objectifs.
4. AVERTISSEMENT LÉGAL (CRUCIAL) : Mentionne EN TOUT TEMPS que les plans alimentaires et nutritionnels sont des recommandations. S'il y a un seul pépin, conseille d'aller communiquer avec un spécialiste de la santé.
5. PERSONA TRAUMATOLOGUE : 
   - Si l'utilisateur mentionne une douleur ou une blessure, analyse la situation.
   - Pour des cas sérieux : Recommande impérativement de consulter un professionnel (Médecin, Physiothérapeute, Chiropracteur, Massothérapeute).
   - Pour des "bobos" simples : Tu peux recommander le protocole GREC (Glace, Repos, Élévation, Compression), le taping ou le repos.
6. RÉALISME ET SÉCURITÉ :
   - Si les demandes de l'utilisateur sont irréalistes ou dangereuses, avertis-le CLAIREMENT des risques.
   - Si l'utilisateur INSISTE malgré tes avertissements, adapte le plan au mieux pour minimiser les risques.
7. INTÉGRATION SYSTÈME : Ne donne pas de plans complets en texte brut si tu peux les intégrer via les outils. Utilise 'update_workout_plan' ou 'update_nutrition_plan' pour que les changements soient effectifs.
8. VOCABULAIRE : Utilise le vocabulaire canadien-français (Déjeuner, Collation, Dîner, Souper).

${SYSTEM_PROMPT}

Contexte actuel de l'utilisateur (VÉRIFIE CECI AVANT DE POSER DES QUESTIONS) :
${contextStr}`;

    const tools = [
      {
        functionDeclarations: [
          {
            name: "update_profile",
            description: "Met à jour les informations du profil de l'utilisateur (poids, objectif calorique, etc.)",
            parameters: {
              type: Type.OBJECT,
              properties: {
                updates: {
                  type: Type.STRING,
                  description: "Chaîne JSON contenant les champs à mettre à jour (ex: '{\"weight\": 75, \"daily_calorie_goal\": 2200}')"
                }
              },
              required: ["updates"]
            }
          },
          {
            name: "update_workout_plan",
            description: "Met à jour le plan d'entraînement hebdomadaire complet de l'utilisateur.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                plan: {
                  type: Type.STRING,
                  description: "Chaîne JSON représentant le nouveau plan d'entraînement complet (doit contenir la clé 'weekly_plan' qui est un tableau de jours)."
                }
              },
              required: ["plan"]
            }
          },
          {
            name: "update_nutrition_plan",
            description: "Met à jour le plan de nutrition hebdomadaire complet de l'utilisateur.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                plan: {
                  type: Type.STRING,
                  description: "Chaîne JSON représentant le nouveau plan de nutrition complet (doit contenir la clé 'weekly_nutrition' qui est un tableau de jours)."
                }
              },
              required: ["plan"]
            }
          }
        ]
      }
    ];

    const contents = history.map(msg => {
      const parts: any[] = [];
      if (msg.text) parts.push({ text: msg.text });
      if (msg.imageBase64) {
        const mimeType = msg.imageBase64.split(';')[0].split(':')[1];
        const data = msg.imageBase64.split(',')[1];
        parts.push({ inlineData: { data, mimeType } });
      }
      return { role: msg.role, parts };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents,
      config: {
        systemInstruction,
        tools: tools as any
      }
    });
    
    // Check for function calls
    const calls = response.functionCalls;
    let text = '';
    try {
      text = response.text || '';
    } catch (e) {
      // response.text might throw if only function calls are present
    }

    if (calls && calls.length > 0) {
      return {
        text: text,
        functionCalls: calls
      };
    }

    return { text: text };
  } catch (error: any) {
    console.error("Error in chatWithCoach:", error);
    throw new Error("Désolé, je n'ai pas pu répondre. Réessaie !");
  }
}

export async function analyzeMeal(imageBase64: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const mimeType = imageBase64.split(';')[0].split(':')[1];
    const data = imageBase64.split(',')[1];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: "Analyse ce repas. Donne-moi une estimation des calories, protéines, glucides et lipides. Retourne le résultat au format JSON avec les clés suivantes : 'name' (nom du plat), 'calories' (nombre entier), 'details' (description concise des macros)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.INTEGER },
            details: { type: Type.STRING }
          },
          required: ["name", "calories", "details"]
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA.");
    
    // Clean up markdown formatting if present
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error in analyzeMeal:", error);
    throw error;
  }
}

export async function generateExerciseImage(name: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A high-quality, realistic professional fitness photo of a person performing the exercise: ${name}. Modern gym setting, clear form.` }
        ]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating exercise image:", error);
    return null;
  }
}

export async function estimateCalories(foodInput: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `L'utilisateur a mangé : "${foodInput}". Estime le nombre total de kilocalories (kcal) de ce repas. Réponds UNIQUEMENT avec un objet JSON valide contenant une propriété 'calories' avec la valeur numérique estimée. Exemple: {"calories": 450}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.INTEGER }
          },
          required: ["calories"]
        }
      }
    });

    let text = response.text;
    if (!text) return 0;
    
    // Clean up markdown formatting if present
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const result = JSON.parse(text);
    return result.calories || 0;
  } catch (error) {
    console.error("Error estimating calories:", error);
    return 0;
  }
}

export async function correctMessage(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es un correcteur orthographique et grammatical expert. Corrige le message suivant tout en conservant son ton et son sens original. Si le message est déjà correct, renvoie-le tel quel. Réponds UNIQUEMENT avec le texte corrigé, sans commentaires additionnels.\n\nMessage à corriger :\n"${text}"`,
    });

    let corrected = response.text?.trim() || text;
    // Remove surrounding quotes if the model added them
    if (corrected.startsWith('"') && corrected.endsWith('"')) {
      corrected = corrected.slice(1, -1).trim();
    }
    return corrected;
  } catch (error) {
    console.error("Error correcting message:", error);
    throw error;
  }
}
