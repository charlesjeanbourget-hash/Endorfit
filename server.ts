import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import cors from "cors";

// Initialize Stripe lazily
let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Initialize Mailer lazily
let transporter: any = null;
function getTransporter() {
  if (!transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  
  // Webhook needs raw body
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const stripeClient = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeClient || !webhookSecret || !sig) {
      return res.status(400).send('Webhook Error: Missing configuration');
    }

    let event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // Here you would update the user's subscription status in Firestore
      // Since we can't directly access Firestore from here easily without admin SDK,
      // we'll assume the client will poll or we'll use a custom endpoint.
      console.log(`Payment successful for session ${session.id}`);
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, userId, userEmail, tierId, promoCode, discount, duration } = req.body;
    const stripeClient = getStripe();

    const isDummyPrice = priceId === 'price_123' || priceId === 'price_456' || priceId === 'price_789';

    // Si Stripe n'est pas configuré ou si on utilise un faux priceId, on simule le paiement
    if (!stripeClient || isDummyPrice) {
      console.log(`Simulating payment for tier ${tierId} (User: ${userId})`);
      return res.json({ 
        id: 'simulated_session',
        url: null
      });
    }

    try {
      let finalPriceId = priceId;
      if (priceId.startsWith('prod_')) {
        const product = await stripeClient.products.retrieve(priceId);
        if (product.default_price) {
          finalPriceId = typeof product.default_price === 'string' ? product.default_price : product.default_price.id;
        } else {
          throw new Error(`Le produit ${priceId} n'a pas de prix par défaut configuré dans Stripe.`);
        }
      }

      let discounts = undefined;
      if (promoCode && discount) {
        try {
          // Try to retrieve the coupon, if it doesn't exist, create it
          let coupon;
          try {
            coupon = await stripeClient.coupons.retrieve(promoCode);
          } catch (e) {
            // Create coupon
            coupon = await stripeClient.coupons.create({
              id: promoCode,
              percent_off: discount,
              duration: duration && duration > 0 ? 'repeating' : 'forever',
              duration_in_months: duration && duration > 0 ? duration : undefined,
            });
          }
          discounts = [{ coupon: coupon.id }];
        } catch (e: any) {
          console.error("Error creating/retrieving coupon:", e);
          throw new Error("Erreur lors de l'application du code promotionnel: " + e.message);
        }
      }

      const successUrl = new URL(`${process.env.APP_URL || 'http://localhost:3000'}/`);
      successUrl.searchParams.append('session_id', '{CHECKOUT_SESSION_ID}');
      successUrl.searchParams.append('tier', tierId);
      if (promoCode) {
        successUrl.searchParams.append('promo', promoCode);
        if (duration !== undefined) {
          successUrl.searchParams.append('promo_duration', duration.toString());
        }
      }

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: finalPriceId, quantity: 1 }],
        mode: 'subscription',
        discounts: discounts,
        success_url: successUrl.toString(),
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/pricing`,
        customer_email: userEmail,
        metadata: { userId, tierId }
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notify-coach", async (req, res) => {
    const { clientName, message } = req.body;
    const mailer = getTransporter();
    const coachEmail = process.env.COACH_EMAIL || "charlesjeanbourget@gmail.com";

    if (!mailer) {
      console.log("Email not configured, skipping notification");
      return res.json({ success: true, mocked: true });
    }

    try {
      await mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: coachEmail,
        subject: `Nouveau message de ${clientName}`,
        text: `Vous avez reçu un nouveau message de ${clientName}:\n\n${message}`
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  app.post("/api/notify-fasting", async (req, res) => {
    const { userEmail, userName, action, duration } = req.body;
    const mailer = getTransporter();

    if (!mailer) {
      console.log("Email not configured, skipping fasting notification");
      return res.json({ success: true, mocked: true });
    }

    const subject = action === 'start' ? 'Début de votre jeûne' : 'Fin de votre jeûne';
    const text = action === 'start'
      ? `Bonjour ${userName},\n\nVotre jeûne de ${duration} heures vient de commencer. Bon courage !\n\nL'équipe ENDORFIT`
      : `Bonjour ${userName},\n\nFélicitations ! Votre jeûne de ${duration} heures est terminé. Vous pouvez maintenant manger.\n\nL'équipe ENDORFIT`;

    try {
      await mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject,
        text
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending fasting email:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Predefined programs data
  const PREDEFINED_PROGRAMS = [
    // Weight Loss - Gym (5)
    {
      id: "wl-gym-1",
      title: "Brûle-Graisse Express (Gym)",
      category: 'weight_loss',
      location: 'gym',
      exercises: [
        { name: "Presse à cuisses", sets: 4, reps: "15", instructions: "Poussez avec les talons, gardez le dos plaqué.", tips: ["Ne verrouillez pas les genoux"] },
        { name: "Tirage poitrine", sets: 4, reps: "15", instructions: "Tirez la barre vers le haut de la poitrine.", tips: ["Gardez le buste droit"] },
        { name: "Fentes haltères", sets: 4, reps: "12 par jambe", instructions: "Faites un grand pas en avant.", tips: ["Le genou arrière descend vers le sol"] },
        { name: "Pompes", sets: 4, reps: "max", instructions: "Corps bien aligné.", tips: ["Gainez les abdos"] },
        { name: "Gainage", sets: 4, reps: "45s", instructions: "Sur les coudes, corps droit.", tips: ["Ne cambrez pas le dos"] }
      ]
    },
    {
      id: "wl-gym-2",
      title: "Métabolisme Boost (Gym)",
      category: 'weight_loss',
      location: 'gym',
      exercises: [
        { name: "Squats gobelet", sets: 3, reps: "12", instructions: "Tenez un haltère contre votre poitrine.", tips: ["Dos droit"] },
        { name: "Développé militaire", sets: 3, reps: "12", instructions: "Poussez les haltères au-dessus de la tête.", tips: ["Ne cambrez pas"] },
        { name: "Soulevé de terre jambes tendues", sets: 3, reps: "15", instructions: "Descendez l'haltère le long des jambes.", tips: ["Sentez l'étirement des ischios"] },
        { name: "Rameur intense", sets: 1, reps: "5 min", instructions: "Rythme soutenu.", tips: ["Poussez fort avec les jambes"] }
      ]
    },
    {
      id: "wl-gym-3",
      title: "Full Body Tonification (Gym)",
      category: 'weight_loss',
      location: 'gym',
      content: "Super-sets: (Squat + Pompes) x3, (Fentes + Tirage horizontal) x3, (Leg Curl + Dips) x3. 15 reps par exercice, peu de repos."
    },
    {
      id: "wl-gym-4",
      title: "Endurance & Force (Gym)",
      category: 'weight_loss',
      location: 'gym',
      content: "45min de musculation modérée suivie de 20min de cardio zone 2 (vélo). Focus sur les grands groupes musculaires pour maximiser la dépense calorique."
    },
    {
      id: "wl-gym-5",
      title: "Circuit Haute Intensité (Gym)",
      category: 'weight_loss',
      location: 'gym',
      content: "Kettlebell swings (20), Box jumps (15), Burpees (10), Battle ropes (30s). Répéter 5 fois. Repos minimal."
    },

    // Weight Loss - Home (5)
    {
      id: "wl-home-1",
      title: "Perte de Poids Débutant (Maison)",
      category: 'weight_loss',
      location: 'home',
      exercises: [
        { name: "Squats", sets: 3, reps: "20", instructions: "Poids sur les talons.", tips: ["Regardez devant vous"] },
        { name: "Pompes sur les genoux", sets: 3, reps: "15", instructions: "Mains plus larges que les épaules.", tips: ["Gardez le corps aligné"] },
        { name: "Fentes alternées", sets: 3, reps: "20", instructions: "Alternez jambe gauche et droite.", tips: ["Gardez l'équilibre"] },
        { name: "Planche", sets: 3, reps: "30s", instructions: "Statique sur les coudes.", tips: ["Respirez calmement"] }
      ]
    },
    {
      id: "wl-home-2",
      title: "HIIT Brûle-Calories (Maison)",
      category: 'weight_loss',
      location: 'home',
      content: "40s travail / 20s repos: Jumping Jacks, Mountain Climbers, Squat Jumps, Pompes, High Knees. Faire 4 tours."
    },
    {
      id: "wl-home-3",
      title: "Tabata Intense (Maison)",
      category: 'weight_loss',
      location: 'home',
      content: "8 cycles de 20s intense / 10s repos. Alterner Burpees et Fentes sautées. Total 4 minutes explosives."
    },
    {
      id: "wl-home-4",
      title: "Sculpt & Burn (Maison)",
      category: 'weight_loss',
      location: 'home',
      content: "Focus bas du corps: 50 Squats, 40 Fentes, 30 Ponts fessiers, 20 Squats sautés, 1min de chaise. Répéter 3 fois."
    },
    {
      id: "wl-home-5",
      title: "Cardio-Renfo Express (Maison)",
      category: 'weight_loss',
      location: 'home',
      content: "Circuit 20min: 1min de chaque : Corde à sauter imaginaire, Pompes, Fentes arrière, Planche dynamique, Burpees. 30s repos entre les exercices."
    },

    // Muscle Gain - Gym (5)
    {
      id: "mg-gym-1",
      title: "Hypertrophie Push (Gym)",
      category: 'muscle_gain',
      location: 'gym',
      exercises: [
        { name: "Développé couché", sets: 4, reps: "8-10", instructions: "Barre au milieu de la poitrine.", tips: ["Pieds ancrés au sol"] },
        { name: "Développé incliné haltères", sets: 3, reps: "12", instructions: "Banc à 30-45 degrés.", tips: ["Contrôlez la descente"] },
        { name: "Élévations latérales", sets: 3, reps: "15", instructions: "Levez les bras sur les côtés.", tips: ["Légère flexion des coudes"] },
        { name: "Extensions triceps poulie", sets: 3, reps: "12", instructions: "Gardez les coudes collés au corps.", tips: ["Extension complète"] }
      ]
    },
    {
      id: "mg-gym-2",
      title: "Hypertrophie Pull (Gym)",
      category: 'muscle_gain',
      location: 'gym',
      content: "Dos/Biceps: Tirage poitrine 4x10, Rowing barre 3x8, Facepull 3x15, Curl barre EZ 3x12, Curl marteau 3x12."
    },
    {
      id: "mg-gym-3",
      title: "Puissance Jambes (Gym)",
      category: 'muscle_gain',
      location: 'gym',
      content: "Bas du corps: Squat barre 4x6-8, Presse à cuisses 3x12, Leg Extension 3x15, Leg Curl 3x15, Mollets debout 4x20."
    },
    {
      id: "mg-gym-4",
      title: "Volume Épaules & Bras (Gym)",
      category: 'muscle_gain',
      location: 'gym',
      content: "Développé militaire 4x10, Élévations frontales 3x12, Oiseau haltères 3x15, Dips 3x max, Curl incliné 3x12."
    },
    {
      id: "mg-gym-5",
      title: "Force Fondamentale (Gym)",
      category: 'muscle_gain',
      location: 'gym',
      content: "Focus 5x5: Squat, Développé couché, Soulevé de terre. Priorité à la charge et à la technique."
    },

    // Muscle Gain - Home (5)
    {
      id: "mg-home-1",
      title: "Volume Poids du Corps (Maison)",
      category: 'muscle_gain',
      location: 'home',
      content: "Pompes classiques 4x max, Pompes déclinées (pieds sur chaise) 3x12, Dips sur chaise 3x15, Tractions (si barre) ou Rowing inversé sous table 4x10."
    },
    {
      id: "mg-home-2",
      title: "Jambes d'Acier (Maison)",
      category: 'muscle_gain',
      location: 'home',
      content: "Squats bulgares (un pied sur chaise) 4x12 par jambe, Fentes marchées 3x20, Nordic Curls (pieds bloqués) 3x8, Mollets une jambe 4x20."
    },
    {
      id: "mg-home-3",
      title: "Full Body Résistance (Maison)",
      category: 'muscle_gain',
      location: 'home',
      content: "Pompes diamant 3x12, Pike pushups (épaules) 3x10, Squat jumps 4x15, Superman (lombaires) 3x15, Planche 3x1min."
    },
    {
      id: "mg-home-4",
      title: "Focus Bras & Épaules (Maison)",
      category: 'muscle_gain',
      location: 'home',
      content: "Pompes mains serrées 4x15, Dips 4x15, Élévations latérales avec bouteilles d'eau 4x20, Curl bouteilles 4x20."
    },
    {
      id: "mg-home-5",
      title: "Explosivité & Masse (Maison)",
      category: 'muscle_gain',
      location: 'home',
      content: "Pompes claquées 3x8, Burpees 3x12, Tuck jumps 3x10, Fentes sautées 3x16. Focus sur la puissance."
    },

    // Cardio - Gym (5)
    {
      id: "cardio-gym-1",
      title: "Intervalles Tapis (Gym)",
      category: 'cardio',
      location: 'gym',
      content: "5min échauffement. 10 cycles : 1min course rapide / 1min marche rapide. 5min retour au calme."
    },
    {
      id: "cardio-gym-2",
      title: "Pyramide Rameur (Gym)",
      category: 'cardio',
      location: 'gym',
      content: "Rameur: 1min intense, 1min repos, 2min intense, 1min repos, 3min intense, 1min repos, puis redescendre (2min, 1min)."
    },
    {
      id: "cardio-gym-3",
      title: "Endurance Vélo (Gym)",
      category: 'cardio',
      location: 'gym',
      content: "45min de vélo à intensité constante (60-70% FCM). Idéal pour la récupération active et la santé cardiaque."
    },
    {
      id: "cardio-gym-4",
      title: "Circuit Cardio-Muscu (Gym)",
      category: 'cardio',
      location: 'gym',
      content: "500m Rameur, 20 Squats, 500m Vélo, 20 Pompes. Enchaîner 4 fois le plus vite possible."
    },
    {
      id: "cardio-gym-5",
      title: "Escalier Infernal (Gym)",
      category: 'cardio',
      location: 'gym',
      content: "20min de Stairmaster. Alterner 2min rythme lent / 1min rythme très rapide. Brûle énormément de calories."
    },

    // Cardio - Home (5)
    {
      id: "cardio-home-1",
      title: "HIIT Brûleur de Graisse (Maison)",
      category: 'cardio',
      location: 'home',
      content: "30s effort / 15s repos: Jumping Jacks, Burpees, Mountain Climbers, Skater Jumps. Faire 5 tours."
    },
    {
      id: "cardio-home-2",
      title: "Cardio Boxe (Maison)",
      category: 'cardio',
      location: 'home',
      content: "Enchaînements de coups de poing et esquives dans le vide. 3min de 'round' / 1min de repos. Faire 5 rounds."
    },
    {
      id: "cardio-home-3",
      title: "Corde à Sauter (Maison)",
      category: 'cardio',
      location: 'home',
      content: "Si vous avez une corde : 10x 1min de saut / 30s repos. Sinon, petits sauts sur place en simulant le mouvement."
    },
    {
      id: "cardio-home-4",
      title: "AMRAP 15 Minutes (Maison)",
      category: 'cardio',
      location: 'home',
      content: "Le plus de tours possible en 15min: 10 Burpees, 20 Mountain Climbers, 30 Jumping Jacks."
    },
    {
      id: "cardio-home-5",
      title: "Cardio Low Impact (Maison)",
      category: 'cardio',
      location: 'home',
      content: "Sans sauts: Marche active sur place, Squats rapides, Fentes alternées, Boxe légère. 30min en continu."
    },

    // Abs - Gym (3)
    {
      id: "abs-gym-1",
      title: "Abdos Poulie & Banc (Gym)",
      category: 'abs',
      location: 'gym',
      content: "Crunch à la poulie haute 3x20, Relevé de jambes suspendu 3x12, Woodchopper à la poulie 3x15 par côté."
    },
    {
      id: "abs-gym-2",
      title: "Gainage Lesté (Gym)",
      category: 'abs',
      location: 'gym',
      content: "Planche avec disque sur le dos 3x45s, Russian Twist avec medecine ball 3x20, Gainage latéral 3x45s par côté."
    },
    {
      id: "abs-gym-3",
      title: "Core Stability (Gym)",
      category: 'abs',
      location: 'gym',
      content: "Ab wheel (roulette) 3x10, Deadbug avec swiss ball 3x12, Pallof press à la poulie 3x12 par côté."
    },

    // Abs - Home (3)
    {
      id: "abs-home-1",
      title: "Circuit Abdos Classique (Maison)",
      category: 'abs',
      location: 'home',
      content: "3 rounds: 20 Crunches, 20 Leg raises, 20 Bicycle crunches, 45s Planche."
    },
    {
      id: "abs-home-2",
      title: "Gainage Dynamique (Maison)",
      category: 'abs',
      location: 'home',
      content: "Planche 'commando' (coudes-mains) 3x12, Mountain climbers lents 3x20, Planche latérale avec rotations 3x12 par côté."
    },
    {
      id: "abs-home-3",
      title: "Abdos Inférieurs (Maison)",
      category: 'abs',
      location: 'home',
      content: "Flutter kicks 3x30s, Scissors kicks 3x30s, Reverse crunches 3x15, Hollow body hold 3x30s."
    }
  ];

  app.get("/api/predefined-programs", (req, res) => {
    res.json(PREDEFINED_PROGRAMS);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
