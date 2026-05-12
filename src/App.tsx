import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  LineChart, 
  UserCircle,
  ChevronRight,
  ChevronLeft,
  Activity,
  Heart,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Flame,
  Target,
  X,
  PlayCircle,
  Info,
  LogOut,
  LogIn,
  ShieldCheck,
  Trash2,
  Users,
  ShoppingCart,
  Eye,
  Tag,
  Ticket,
  CreditCard,
  Zap,
  Plus,
  MessageSquare,
  Library,
  FileText,
  Moon,
  Sun,
  CreditCard as PaymentIcon,
  ArrowDown,
  Music,
  BarChart2,
  Camera,
  Play,
  Square,
  Star,
  Smartphone,
  Volume2,
  VolumeX,
  Scale,
  Loader2,
  Send,
  Download
} from 'lucide-react';
import { MusicWidget } from './components/MusicWidget';
import { WorkoutTimerWidget } from './components/WorkoutTimerWidget';
import { AICoachWidget } from './components/AICoachWidget';
import { generatePlan, chatWithCoach, analyzeMeal, generateExerciseImage, estimateCalories, correctMessage } from './services/geminiService';
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, googleProvider, secondaryAuth } from './firebase';
import { signInWithPopup, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, collection, query, getDocs, onSnapshot, orderBy, limit, deleteDoc, where, or, deleteField, increment, addDoc, writeBatch } from 'firebase/firestore';
import { defaultPredefinedPrograms } from './data/predefinedPrograms';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const Logo = ({ className = "h-12", variant = "full" }: { className?: string, variant?: 'full' | 'icon' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative w-12 h-12 flex-shrink-0 group/logo">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-teal to-brand-green rounded-2xl rotate-3 opacity-20 group-hover/logo:rotate-6 transition-transform duration-500 blur-sm" />
      <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl flex items-center justify-center overflow-hidden">
        <Activity size={26} className="text-slate-900 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] relative z-10 transition-transform group-hover/logo:scale-110" />
      </div>
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-green rounded-full border border-slate-950 shadow-[0_0_10px_rgba(225,29,72,0.8)] animate-pulse" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-brand-teal rounded-full border border-slate-950 shadow-[0_0_10px_rgba(124,6,32,0.8)]" />
    </div>
    {variant === 'full' && (
      <div className="flex flex-col">
        <div className="flex text-3xl font-black italic tracking-tighter leading-none select-none">
          <span className="text-slate-900 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">ENDOR</span>
          <span className="text-brand-green drop-shadow-[0_0_15px_rgba(225,29,72,0.4)]">FIT</span>
        </div>
        <div className="micro-label mt-1.5 pl-0.5 text-slate-900/40">
          FITNESS & PHARMACIE • BIEN-ÊTRE
        </div>
      </div>
    )}
  </div>
);

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  gender?: 'male' | 'female';
  age?: number;
  height?: number;
  weight?: number;
  profession?: string;
  daily_posture?: string;
  activity_level_non_gym?: string;
  current_injuries?: string;
  past_injuries?: string;
  medical_conditions?: string;
  medications?: string;
  flexibility_limitations?: string;
  chronic_pain?: string;
  primary_goal?: string;
  secondary_goal?: string;
  timeline?: string;
  event_objective?: string;
  event_date?: string;
  target_time?: string;
  deep_motivation?: string;
  past_obstacles?: string;
  experience_level?: string;
  past_sports?: string;
  technical_mastery?: string;
  disliked_exercises?: string;
  favorite_exercises?: string;
  training_location?: string;
  home_equipment?: string;
  days_per_week?: number;
  max_duration_minutes?: number;
  dietary_preference?: string;
  food_allergies?: string;
  liked_foods?: string;
  disliked_foods?: string;
  meals_per_day?: number;
  cooking_time_available?: string;
  fasting_duration?: number;
  is_fasting?: boolean;
  fasting_start_time?: string | null;
  sleep_hours?: number;
  sleep_quality?: number;
  stress_level?: number;
  current_dietary_habits?: string;
  general_energy_level?: number;
  subscription_tier?: 'free' | 'premium' | 'elite' | 'coach';
  subscription_status?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  promo_code_used?: string;
  promo_code_applied_at?: string;
  promo_code_duration?: number;
  pharmacy_banner?: string;
  pharmacy_owner?: string;
  daily_calories_log?: Record<string, number>;
  daily_calorie_goal?: number;
  daily_food_entries?: Record<string, {id: string, name: string, calories: number}[]>;
  burned_calories_log?: Record<string, number>;
  extra_activities?: Record<string, {id: string, name: string, calories: number}[]>;
  consecutive_days?: number;
  last_workout_date?: string;
  current_week_start?: string;
  exercise_progress?: Record<string, Record<string, boolean[]>>;
  weight_tracking?: Record<string, {date: string, weight: number}[]>;
  progress_photos?: {date: string, url: string, type: 'front' | 'side' | 'back'}[];
  created_at?: string;
  updated_at?: string;
  points?: number;
  level?: number;
  badges?: string[];
}

interface Plan {
  id?: string;
  type?: 'workout' | 'nutrition';
  content?: any;
  created_at?: string;
  safety_alerts?: string[];
  warmup?: any[];
  workout?: any[];
  cardio?: {
    type: string;
    duration: string;
    intensity: string;
    instructions: string;
  };
  cooldown?: any[];
  nutrition?: {
    calories: number;
    macros: { p: number; c: number; l: number };
    menu: any[];
  };
}

const BADGES = [
  { id: 'first_workout', name: 'Premier Pas', icon: '🎯', description: 'Premier entraînement complété' },
  { id: 'streak_3', name: 'Régularité', icon: '🔥', description: '3 jours consécutifs' },
  { id: 'streak_7', name: 'Déterminé', icon: '⚡', description: '7 jours consécutifs' },
  { id: 'weight_loss_5', name: 'Transformation', icon: '⚖️', description: '5kg perdus' },
  { id: 'early_bird', name: 'Lève-tôt', icon: '🌅', description: 'Entraînement avant 8h' },
  { id: 'night_owl', name: 'Guerrier de nuit', icon: '🌙', description: 'Entraînement après 21h' },
];

const ProgressPhotoCard = ({ photo, onDelete }: { photo: any, onDelete: () => void }) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <div className="relative group rounded-2xl overflow-hidden aspect-[3/4] bg-slate-800 border border-slate-100">
      <img src={photo.url} alt={photo.date} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-[10px] font-bold text-slate-900">{photo.date}</p>
        <p className="text-[8px] text-slate-500 uppercase tracking-wider">{photo.type}</p>
      </div>
      
      {!showConfirm ? (
        <button 
          onClick={() => setShowConfirm(true)}
          className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-slate-900 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
        >
          <Trash2 size={12} />
        </button>
      ) : (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <p className="text-[10px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Supprimer ?</p>
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 bg-slate-800 text-slate-900 text-[9px] font-bold uppercase rounded-lg border border-slate-200"
            >
              Non
            </button>
            <button 
              onClick={onDelete}
              className="flex-1 py-2 bg-red-500 text-slate-900 text-[9px] font-bold uppercase rounded-lg shadow-lg shadow-red-500/20"
            >
              Oui
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const BadgeItem = ({ badge, earned }: { badge: any, earned: boolean }) => (
  <div className={`flex flex-col items-center p-4 rounded-3xl border transition-all duration-500 hover:scale-105 ${earned ? 'glass-panel !border-brand-teal/40 !bg-brand-teal/5' : 'bg-white/80 border-slate-100 grayscale opacity-40 hover:opacity-70'} relative overflow-hidden`}>
    {earned && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-teal/20 via-transparent to-transparent opacity-50" />}
    <span className="text-3xl mb-2 drop-shadow-md z-10">{badge.icon}</span>
    <p className="text-[10px] font-bold text-slate-900 text-center leading-tight z-10 tracking-wide">{badge.name}</p>
    {earned && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-teal shadow-[0_0_8px_rgba(124,6,32,1)] z-10" />}
  </div>
);

// --- Components ---

const Login = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError("Ce mode de connexion n'est pas encore activé dans la console Firebase.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError(`Ce domaine (${window.location.hostname}) n'est pas autorisé pour l'authentification. Veuillez l'ajouter dans la console Firebase (Authentication > Settings > Authorized domains).`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("La fenêtre de connexion a été fermée avant la fin de l'opération.");
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError("La fenêtre de connexion a été bloquée par votre navigateur. Veuillez autoriser les popups pour ce site, ou ouvrez l'application dans un nouvel onglet.");
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError("Erreur réseau. Si vous êtes sur Safari ou en mode navigation privée, le bloqueur de suivi peut bloquer Google Login. Ouvrez l'application dans un nouvel onglet pour vous connecter.");
      } else if (error.message && (error.message.includes('cross-origin') || error.message.includes('cookies'))) {
        setAuthError("Erreur de cookies tiers. Ouvrez l'application dans un nouvel onglet pour que la connexion fonctionne avec Google.");
      } else {
        setAuthError(error.message + " - Essayez d'ouvrir l'application dans un nouvel onglet.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email || !password) {
      setAuthError("Veuillez remplir tous les champs.");
      return;
    }
    
    setIsLoading(true);
    setAuthError(null);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("Cet email est déjà utilisé.");
      } else if (error.code === 'auth/invalid-email') {
        setAuthError("Format d'email invalide.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Le mot de passe doit contenir au moins 6 caractères.");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setAuthError("Email ou mot de passe incorrect.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError("L'authentification par email n'est pas activée. Veuillez l'activer dans la console Firebase (Authentication > Sign-in method).");
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError("Erreur réseau. Vérifiez votre connexion internet ou désactivez votre bloqueur de publicités (ou la protection stricte de votre navigateur) qui pourrait bloquer la requête Firebase.");
      } else {
        setAuthError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop" 
          alt="Fitness Background" 
          className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/90 to-brand-dark/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand-teal/20 via-transparent to-transparent opacity-60 mix-blend-screen"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center mt-[-10vh]">
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 scale-110"
        >
          <Logo className="h-16" />
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full glass-panel p-8 rounded-[2rem] space-y-6"
        >
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-display font-medium text-slate-900">{isSignUp ? "Créer un compte" : "Bon retour"}</h1>
            <p className="text-sm font-sans text-slate-500">Votre coach personnel intelligent.</p>
          </div>

        {authError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-left">
            {authError}
          </div>
        )}

        <div className="space-y-5">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-premium text-sm"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-premium text-sm"
              required
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full btn-premium mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isSignUp ? "Créer un compte" : "Se connecter"
              )}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">Ou</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
            className="w-full btn-premium-outline bg-white/5 backdrop-blur-md"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Continuer avec Google
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError(null);
            }}
            className="w-full text-slate-500 text-xs font-medium hover:text-slate-900 transition-colors mt-4"
          >
            {isSignUp ? "Vous avez déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
          </button>
        </div>
        </motion.div>
      </div>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick, badge, activeColor = "bg-brand-teal text-slate-900", id }: any) => (
  <button 
    id={id}
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${active ? `${activeColor} shadow-[0_4px_20px_rgba(124,6,32,0.4)] -translate-y-2` : 'text-slate-500 hover:text-slate-900 hover:bg-white/5'}`}
  >
    <Icon size={active ? 20 : 22} className={active ? "mb-1" : ""} strokeWidth={active ? 2.5 : 2} />
    {active && <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>}
    {badge > 0 && (
      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-slate-900 text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg border-2 border-slate-900">
        {badge}
      </span>
    )}
  </button>
);

const Card = ({ children, title, icon: Icon, className = "", id }: any) => (
  <div id={id} className={`glass-panel rounded-[2rem] p-7 ${className}`}>
    {title && (
      <div className="flex items-center gap-3 mb-6">
        {Icon && <div className="p-2.5 bg-brand-teal/10 rounded-xl border border-brand-teal/20"><Icon size={18} className="text-brand-teal" /></div>}
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const GeneratedImage = ({ name, className, size = "200/200" }: { name?: string, className?: string, size?: string }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) {
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    const fetchMedia = async () => {
      setLoading(true);
      
      // 1. Try to fetch an animated GIF from Giphy first for better visualization
      try {
        const giphyRes = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(name + " exercise fitness gym")}&limit=1`);
        const giphyData = await giphyRes.json();
        if (giphyData.data && giphyData.data.length > 0) {
          if (isMounted) {
            setImage(giphyData.data[0].images.fixed_height.url);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Giphy fetch failed, falling back to Gemini");
      }

      // 2. Fallback to Gemini static image generation if GIF is not found
      try {
        const imageUrl = await generateExerciseImage(name);
        if (!isMounted) return;
        if (imageUrl) {
          setImage(imageUrl);
          setLoading(false);
          return;
        }
      } catch (error: any) {
        // Handle rate limits (429) gracefully without spamming console
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
          console.warn(`Rate limit reached for image generation: ${name}. Using fallback.`);
        } else {
          console.error("Error generating image:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    // Add a small random delay to avoid hitting rate limits simultaneously for all images
    const timeout = setTimeout(fetchMedia, Math.random() * 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [name]);

  if (loading) {
    return (
      <div className={`bg-slate-800 flex items-center justify-center ${className}`}>
        <Activity className="animate-spin text-brand-teal/50" size={16} />
      </div>
    );
  }

  const safeName = name || 'exercise';

  return (
    <img 
      src={image || `https://loremflickr.com/${size}/gym,fitness?lock=${safeName.length}`} 
      alt={safeName} 
      className={`object-cover ${className}`}
      referrerPolicy="no-referrer"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=200&h=200";
      }}
    />
  );
};

// --- Predefined Programs Component ---

const PredefinedPrograms = ({ programs, onSelectProgram }: { programs: any[], onSelectProgram: (plan: any) => void }) => {
  const [filter, setFilter] = useState<'all' | 'home_workout' | 'gym_workout' | 'biceps' | 'abs' | 'glutes'>('all');
  
  const filteredPrograms = programs.filter(p => 
    filter === 'all' || p.category === filter || (filter === 'home_workout' && p.location === 'home' && !['biceps', 'abs', 'glutes'].includes(p.category)) || (filter === 'gym_workout' && p.location === 'gym' && !['biceps', 'abs', 'glutes'].includes(p.category))
  );

  const filterLabels: Record<string, string> = {
    'all': 'Tous',
    'home_workout': 'Maison',
    'gym_workout': 'Salle',
    'biceps': 'Biceps',
    'abs': 'Abdos',
    'glutes': 'Fessiers'
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
        <img 
          src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2940&auto=format&fit=crop" 
          alt="Programs Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Programmes Gratuits</h2>
            <p className="text-slate-600 text-sm font-medium">Sélectionnez un programme déjà conçu par nos experts.</p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 p-1 bg-white/80 backdrop-blur-md rounded-xl border border-slate-100 overflow-x-auto hide-scrollbar">
        {(Object.keys(filterLabels) as Array<keyof typeof filterLabels>).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-brand-teal text-slate-950' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {['home_workout', 'gym_workout', 'biceps', 'abs', 'glutes', 'weight_loss', 'muscle_gain', 'cardio'].map(cat => {
          const catPrograms = filteredPrograms.filter(p => p.category === cat);
          if (catPrograms.length === 0) return null;

          return (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] px-2">
                  {cat === 'home_workout' ? 'Maison' : 
                   cat === 'gym_workout' ? 'Salle de Sport' : 
                   cat === 'biceps' ? 'Biceps' : 
                   cat === 'abs' ? 'Abdominaux' : 
                   cat === 'glutes' ? 'Fessiers' : 
                   cat === 'weight_loss' ? 'Perte de Poids' : 
                   cat === 'muscle_gain' ? 'Prise de Masse' : 
                   cat === 'cardio' ? 'Cardio' : cat}
                </h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {catPrograms.map(program => (
                  <motion.button 
                    key={program.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      let content = program.content;
                      if (typeof content === 'string') {
                        try {
                          content = JSON.parse(content);
                        } catch (e) {}
                      }

                      if (content && content.weekly_plan) {
                        const isOldFormat = Array.isArray(content.weekly_plan[0]);
                        if (isOldFormat) {
                          const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                          const formattedPlan = {
                            weekly_plan: content.weekly_plan.map((exercises: any[], i: number) => ({
                              day: days[i],
                              is_rest_day: exercises.length === 0,
                              focus: exercises.length === 0 ? 'Repos' : (program.name || program.title),
                              workout: exercises.map(ex => ({
                                ...ex,
                                instructions: ex.instructions || program.description,
                                tips: ex.tips || ["Concentrez-vous sur la forme", "Respirez bien pendant l'effort"]
                              }))
                            }))
                          };
                          onSelectProgram({ ...program, content: formattedPlan });
                        } else {
                          onSelectProgram({ ...program, content });
                        }
                      } else if (program.exercises) {
                        onSelectProgram({ 
                          ...program,
                          content: {
                            focus: program.name || program.title,
                            workout: program.exercises
                          }
                        });
                      } else {
                        onSelectProgram({ 
                          ...program,
                          content: {
                            focus: program.name || program.title,
                            workout: [{ 
                              name: program.name || program.title, 
                              sets: 4, 
                              reps: '12-15', 
                              instructions: typeof content === 'string' ? content : program.description,
                              tips: ["Concentrez-vous sur la forme", "Respirez bien pendant l'effort"]
                            }] 
                          }
                        });
                      }
                      window.scrollTo(0, 0);
                    }}
                    className="group bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl text-left flex items-center justify-between hover:bg-slate-800/60 hover:border-brand-teal/30 transition-all shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        program.location === 'gym' 
                          ? 'bg-brand-teal/10 text-brand-teal group-hover:bg-brand-teal/20' 
                          : 'bg-brand-green/10 text-brand-green group-hover:bg-brand-green/20'
                      }`}>
                        {program.location === 'gym' ? <Dumbbell size={24} /> : <Heart size={24} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-brand-teal transition-colors">{program.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            {program.location === 'gym' ? 'Salle de Sport' : 'À la Maison'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="text-[10px] text-slate-600">Débutant / Intermédiaire</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-teal group-hover:text-slate-950 transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredPrograms.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-slate-500 text-sm">Aucun programme trouvé pour ce filtre.</p>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

// --- Modals ---

const ExerciseBankModal = ({ isOpen, onClose, onSave, exercise, exercises }: any) => {
  const [formData, setFormData] = useState(exercise || { name: '', category: '', instructions: '', image_search_query: '' });

  useEffect(() => {
    if (exercise) setFormData(exercise);
    else setFormData({ name: '', category: '', instructions: '', image_search_query: '' });
  }, [exercise]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">{exercise ? 'Modifier Exercice' : 'Ajouter Exercice'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nom de l'exercice</label>
            <input 
              type="text" 
              className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Catégorie</label>
            <select 
              className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Sélectionner...</option>
              <option value="Pectoraux">Pectoraux</option>
              <option value="Dos">Dos</option>
              <option value="Jambes">Jambes</option>
              <option value="Épaules">Épaules</option>
              <option value="Bras">Bras</option>
              <option value="Abdominaux">Abdominaux</option>
              <option value="Cardio">Cardio</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Instructions</label>
            <textarea 
              className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none h-32 resize-none"
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Recherche d'image (mots-clés)</label>
            <input 
              type="text" 
              className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
              value={formData.image_search_query}
              onChange={(e) => setFormData({...formData, image_search_query: e.target.value})}
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => onSave(formData)}
            className="w-full py-4 bg-brand-teal text-slate-950 font-bold rounded-2xl hover:bg-brand-teal/80 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PlanEditorModal = ({ isOpen, onClose, onSave, plan, exercises }: any) => {
  const [formData, setFormData] = useState(plan || { type: 'workout', content: '' });

  useEffect(() => {
    if (plan) setFormData(plan);
    else setFormData({ type: 'workout', content: '' });
  }, [plan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">{plan ? 'Modifier Programme' : 'Nouveau Programme'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex gap-4">
            <button 
              onClick={() => setFormData({...formData, type: 'workout'})}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.type === 'workout' ? 'bg-brand-teal text-slate-950' : 'bg-slate-800 text-slate-500'}`}
            >
              Entraînement
            </button>
            <button 
              onClick={() => setFormData({...formData, type: 'nutrition'})}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.type === 'nutrition' ? 'bg-brand-green text-slate-950' : 'bg-slate-800 text-slate-500'}`}
            >
              Nutrition
            </button>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Contenu du programme (JSON)</label>
            <p className="text-[10px] text-slate-600 mb-2">Utilisez le format JSON généré par l'IA pour assurer la compatibilité avec l'interface.</p>
            <textarea 
              className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-4 text-slate-900 font-mono text-xs focus:border-brand-teal outline-none h-96 resize-none"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => onSave(formData)}
            className="w-full py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
          >
            Sauvegarder les modifications
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const TECHNIQUE_EXPLANATIONS: Record<string, string> = {
  'Superset': "Enchaînez ces exercices sans temps de repos entre eux. Prenez votre repos uniquement après avoir terminé le dernier exercice du groupe.",
  'Circuit': "Enchaînez tous les exercices du circuit avec très peu ou pas de repos. Prenez un repos plus long à la fin du circuit avant de recommencer.",
  'Tabata': "Méthode d'entraînement par intervalles : 20 secondes d'effort maximal suivies de 10 secondes de repos, à répéter 8 fois (4 minutes au total).",
  'AMRAP': "As Many Rounds/Reps As Possible. Faites le maximum de tours ou de répétitions possibles dans le temps imparti.",
  'EMOM': "Every Minute On the Minute. Démarrez une série au début de chaque minute. Le temps restant dans la minute est votre temps de repos.",
  'Pyramide': "Modifiez le poids et les répétitions à chaque série. Par exemple : augmentez le poids et diminuez les répétitions (12, 10, 8, 6).",
  'Dropset': "Après avoir terminé une série jusqu'à l'échec, réduisez immédiatement le poids (de 10 à 20%) et continuez à faire des répétitions jusqu'à l'échec sans vous reposer.",
  'Rest-Pause': "Faites une série jusqu'à l'échec, reposez-vous brièvement (10-15 secondes), puis faites quelques répétitions supplémentaires avec le même poids.",
  'Hyperlent': "Exécutez le mouvement très lentement (ex: 4 secondes à la descente, 4 secondes à la montée) pour maximiser le temps sous tension du muscle.",
  'Plyométrie': "Exercices explosifs (sauts, bonds) conçus pour développer la puissance et la vitesse.",
  'HIIT': "Entraînement par intervalles à haute intensité. Alternance de courtes périodes d'effort très intense et de périodes de récupération."
};

const Timer = ({ durationSeconds, restSeconds, onComplete }: { durationSeconds: number, restSeconds?: number, onComplete?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isResting, setIsResting] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (!isResting && restSeconds) {
        setIsResting(true);
        setTimeLeft(restSeconds);
      } else {
        setIsActive(false);
        setIsResting(false);
        setTimeLeft(durationSeconds);
        if (onComplete) onComplete();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isResting, restSeconds, onComplete, durationSeconds]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setIsResting(false);
    setTimeLeft(durationSeconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/80 rounded-2xl border border-slate-200 shadow-lg">
      <div className={`text-6xl font-black tabular-nums mb-2 ${isResting ? 'text-brand-green' : 'text-brand-teal'}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
        {isResting ? 'Repos' : 'Travail'}
      </div>
      <div className="flex gap-4">
        <button onClick={toggleTimer} className={`px-8 py-3 rounded-xl font-bold text-slate-950 transition-colors ${isActive ? 'bg-red-500 hover:bg-red-400' : 'bg-brand-teal hover:bg-brand-teal/80'}`}>
          {isActive ? 'Pause' : 'Démarrer'}
        </button>
        <button onClick={resetTimer} className="px-8 py-3 rounded-xl font-bold text-slate-900 bg-slate-800 hover:bg-slate-700 transition-colors">
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

const CircuitTimer = ({ exercises, onClose }: { exercises: any[], onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exercises[0]?.duration_seconds || 0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playBeep = (type: 'short' | 'long' | 'end') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'short') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'long') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'end') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 4 && prev > 1) playBeep('short');
          if (prev === 1) playBeep('long');
          return prev - 1;
        });
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      const currentEx = exercises[currentIndex];
      if (!isResting && currentEx.rest_time_seconds > 0) {
        setIsResting(true);
        setTimeLeft(currentEx.rest_time_seconds);
      } else {
        // Move to next exercise or finish
        if (currentIndex < exercises.length - 1) {
          setIsResting(false);
          setCurrentIndex(prev => prev + 1);
          setTimeLeft(exercises[currentIndex + 1].duration_seconds || 0);
        } else {
          setIsActive(false);
          setIsResting(false);
          playBeep('end');
          // Circuit complete
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isResting, currentIndex, exercises, soundEnabled]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentEx = exercises[currentIndex];

  if (!currentEx) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 border border-slate-200 shadow-2xl flex flex-col items-center text-center">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-slate-900">
          <X size={24} />
        </button>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="absolute top-6 left-6 text-slate-500 hover:text-slate-900">
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
        
        <h3 className="text-2xl font-black text-slate-900 mb-2">Circuit Timer</h3>
        <p className="text-brand-teal font-bold mb-8">Exercice {currentIndex + 1} sur {exercises.length}</p>
        
        <div className="w-32 h-32 bg-slate-800 rounded-2xl overflow-hidden mb-6 border border-slate-100">
          <GeneratedImage name={currentEx.name} className="w-full h-full opacity-80" />
        </div>
        
        <h4 className="text-xl font-bold text-slate-900 mb-2">{currentEx.name}</h4>
        
        <div className={`text-7xl font-black tabular-nums my-6 ${isResting ? 'text-brand-green' : 'text-brand-teal'}`}>
          {formatTime(timeLeft)}
        </div>
        
        <div className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-8">
          {isResting ? 'Repos' : 'Travail'}
        </div>
        
        <button 
          onClick={toggleTimer} 
          className={`w-full py-4 rounded-2xl font-black text-xl transition-colors ${
            isActive ? 'bg-red-500 text-slate-900 hover:bg-red-400' : 'bg-brand-teal text-slate-950 hover:bg-brand-teal/80'
          }`}
        >
          {isActive ? 'Pause' : 'Démarrer'}
        </button>
      </div>
    </div>
  );
};


export default function App() {
  const [user, loadingAuth] = useAuthState(auth);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(() => {
        setIsAuthReady(true);
      }).catch((e) => {
        console.error("Error getting token:", e);
        setIsAuthReady(true);
      });
    } else if (!loadingAuth) {
      setIsAuthReady(true);
    }
  }, [user, loadingAuth]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [workoutPlan, setWorkoutPlan] = useState<Plan | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepInput, setSleepInput] = useState({ hours: 7, quality: 3 });
  const [isAppleHealthConnected, setIsAppleHealthConnected] = useState(false);
  
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [activityInput, setActivityInput] = useState({ name: 'Marche', duration: 30, intensity: 'Modérée' });
  const [showMedal, setShowMedal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [photoAngle, setPhotoAngle] = useState<'front' | 'side' | 'back'>('front');

  const downloadGroceryList = () => {
    if (!nutritionPlan?.content?.grocery_list) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(14, 165, 233); // sky-500
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("LISTE D'ÉPICERIE", 105, 20, { align: 'center' });
    
    let yPos = 40;
    
    (nutritionPlan.content.grocery_list as any[]).forEach((cat: any) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(14, 165, 233);
      doc.text(cat.category.toUpperCase(), 14, yPos);
      yPos += 8;
      
      const tableData = cat.items.map((item: string) => [item]);
      
      autoTable(doc, {
        startY: yPos,
        head: [],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 4, textColor: [50, 50, 50] },
        columnStyles: { 0: { cellWidth: 182 } },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    });
    
    doc.save("liste_epicerie.pdf");
  };

  const downloadWorkoutPlan = () => {
    if (!workoutPlan?.content?.weekly_plan) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(244, 63, 94); // rose-500
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PLAN D'ENTRAÎNEMENT", 105, 20, { align: 'center' });
    
    let yPos = 40;
    
    (workoutPlan.content.weekly_plan as any[]).forEach((day: any) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Day Header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, yPos, 182, 12, 'F');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      
      const dayText = `JOUR ${day.day} ${day.is_rest_day ? '(REPOS)' : ''}`;
      doc.text(dayText, 16, yPos + 8);
      
      if (day.focus) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Focus: ${day.focus}`, 100, yPos + 8);
      }
      
      yPos += 18;
      
      if (day.warmup && day.warmup.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(244, 63, 94);
        doc.text("Échauffement", 14, yPos);
        yPos += 5;
        
        const warmupData = day.warmup.map((w: any) => [w.name, w.duration, w.instructions || '-']);
        autoTable(doc, {
          startY: yPos,
          head: [['Exercice', 'Durée', 'Instructions']],
          body: warmupData,
          theme: 'grid',
          headStyles: { fillColor: [244, 63, 94] },
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30 } },
          margin: { left: 14, right: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
      
      if (day.workout && day.workout.length > 0) {
        if (yPos > 230) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(244, 63, 94);
        doc.text("Exercices", 14, yPos);
        yPos += 5;
        
        const exData = day.workout.map((ex: any) => {
          const restStr = ex.rest || (ex.rest_time_seconds ? `${ex.rest_time_seconds}s` : '60s');
          const details = [];
          if (ex.technique) details.push(`Technique: ${ex.technique}`);
          if (ex.rpe) details.push(`RPE: ${ex.rpe}/10`);
          if (ex.instructions) details.push(`Infos: ${ex.instructions}`);
          if (ex.tips && ex.tips.length > 0) details.push(`Conseils:\n- ${ex.tips.join('\n- ')}`);
          
          return [
            ex.name, 
            `${ex.sets} x ${ex.reps}`, 
            restStr,
            details.length > 0 ? details.join('\n') : '-'
          ];
        });
        autoTable(doc, {
          startY: yPos,
          head: [['Exercice', 'Séries x Reps', 'Repos', 'Détails & Conseils']],
          body: exData,
          theme: 'grid',
          headStyles: { fillColor: [244, 63, 94] },
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 } },
          margin: { left: 14, right: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
      
      if (day.cardio) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(244, 63, 94);
        doc.text("Cardio", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Type', 'Durée', 'Intensité', 'Instructions']],
          body: [[day.cardio.type, day.cardio.duration, day.cardio.intensity, day.cardio.instructions || '-']],
          theme: 'grid',
          headStyles: { fillColor: [244, 63, 94] },
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } },
          margin: { left: 14, right: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
      
      if (day.cooldown && day.cooldown.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(244, 63, 94);
        doc.text("Retour au calme", 14, yPos);
        yPos += 5;
        
        const cdData = day.cooldown.map((c: any) => [c.name, c.duration, c.instructions || '-']);
        autoTable(doc, {
          startY: yPos,
          head: [['Exercice', 'Durée', 'Instructions']],
          body: cdData,
          theme: 'grid',
          headStyles: { fillColor: [244, 63, 94] },
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30 } },
          margin: { left: 14, right: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        yPos += 5;
      }
    });
    
    doc.save("plan_entrainement.pdf");
  };

  const downloadNutritionPlan = () => {
    if (!nutritionPlan?.content?.weekly_nutrition) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PLAN DE NUTRITION", 105, 20, { align: 'center' });
    
    let yPos = 40;
    
    (nutritionPlan.content.weekly_nutrition as any[]).forEach((day: any) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Day Header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, yPos, 182, 12, 'F');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      
      doc.text(day.day.toUpperCase(), 16, yPos + 8);
      
      // Macros & Calories
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`${day.calories} kcal | P: ${day.macros?.p || 0}g | G: ${day.macros?.c || 0}g | L: ${day.macros?.l || 0}g`, 90, yPos + 8);
      
      yPos += 18;
      
      if (day.menu && day.menu.length > 0) {
        const menuData = day.menu.map((m: any) => [
          m.meal,
          m.description || '-',
          m.foods ? m.foods.join('\n') : '-'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Repas', 'Description', 'Aliments']],
          body: menuData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 80 }, 2: { cellWidth: 67 } },
          margin: { left: 14, right: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        yPos += 5;
      }
    });
    
    doc.save("plan_nutrition.pdf");
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const grantBadge = async (badgeId: string) => {
    if (!user || profile.badges?.includes(badgeId)) return;
    try {
      const updatedBadges = [...(profile.badges || []), badgeId];
      await setDoc(doc(db, 'users', user.uid), { badges: updatedBadges }, { merge: true });
      setProfile(prev => ({ ...prev, badges: updatedBadges }));
      showSuccessMsg(`Nouveau badge débloqué : ${BADGES.find(b => b.id === badgeId)?.name} !`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const showSuccessMsg = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const calculateMetabolism = () => {
    if (!profile.weight || !profile.height || !profile.age || !profile.gender) return null;
    
    const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + (profile.gender === 'male' ? 5 : -161);
    
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'very_active': 1.725
    };
    
    const multiplier = activityMultipliers[profile.activity_level_non_gym || 'sedentary'] || 1.2;
    const tdee = bmr * multiplier;
    
    let target = tdee;
    if (profile.primary_goal === 'fat_loss') target -= 500;
    if (profile.primary_goal === 'hypertrophy') target += 300;
    
    // If we have a nutrition plan, use its average calories as the target to stay coordinated
    if (nutritionPlan?.content?.weekly_nutrition && nutritionPlan.content.weekly_nutrition.length > 0) {
      const weeklyNutrition = nutritionPlan.content.weekly_nutrition;
      const avgDailyCalories = weeklyNutrition.reduce((acc: number, day: any) => acc + (day.calories || 0), 0) / weeklyNutrition.length;
      if (avgDailyCalories > 0) {
        target = avgDailyCalories;
      }
    }
    
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target) };
  };

  const getWeeklyExerciseGoal = () => {
    const baseGoal = 3500; // Total weekly deficit target for 1lb/week loss (500 kcal/day * 7)
    const metabolism = calculateMetabolism();
    if (!metabolism) return baseGoal;

    // If the goal is fat loss, calculate the remaining deficit needed from exercise
    if (profile.primary_goal === 'fat_loss') {
      let dietaryDailyDeficit = 0;

      // If we have a nutrition plan, calculate the actual dietary deficit it provides
      if (nutritionPlan?.content?.weekly_nutrition && nutritionPlan.content.weekly_nutrition.length > 0) {
        const weeklyNutrition = nutritionPlan.content.weekly_nutrition;
        const avgDailyCalories = weeklyNutrition.reduce((acc: number, day: any) => acc + (day.calories || 0), 0) / weeklyNutrition.length;
        dietaryDailyDeficit = Math.max(0, metabolism.tdee - avgDailyCalories);
      } else if (profile.daily_calorie_goal) {
        dietaryDailyDeficit = Math.max(0, metabolism.tdee - profile.daily_calorie_goal);
      } else {
        // Default 500 deficit if no plan/goal set
        dietaryDailyDeficit = 500;
      }
      
      // The exercise goal is the remaining deficit needed to reach the 500 kcal/day (3500 kcal/week) target
      const dailyExerciseDeficitNeeded = Math.max(0, 500 - dietaryDailyDeficit);
      const weeklyExerciseGoal = dailyExerciseDeficitNeeded * 7;
      
      return Math.round(weeklyExerciseGoal);
    }

    // For other goals, return the base goal
    return baseGoal;
  };

  const logBurnedCalories = async (amount: number, activityName: string) => {
    if (!user) return;
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      
      const currentLog = profile.burned_calories_log?.[dateStr] || 0;
      const updatedLog = {
        ...profile.burned_calories_log,
        [dateStr]: currentLog + amount
      };
      
      const newActivity = {
        id: Date.now().toString(),
        name: activityName,
        calories: amount
      };
      
      const currentActivities = profile.extra_activities?.[dateStr] || [];
      const updatedActivities = {
        ...profile.extra_activities,
        [dateStr]: [...currentActivities, newActivity]
      };
      
      const updateData = {
        burned_calories_log: updatedLog,
        extra_activities: updatedActivities,
        updated_at: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      setProfile(prev => ({ ...prev, ...updateData }));
      
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < 8) grantBadge('early_bird');
      if (hour >= 21) grantBadge('night_owl');

      // Check for first activity badge
      if (!profile.badges?.includes('first_workout')) {
        grantBadge('first_workout');
      }

      // Check weekly goal
      const currentWeekStart = profile.current_week_start || new Date().toISOString().split('T')[0];
      let weeklyTotal = 0;
      Object.entries(updatedLog).forEach(([date, cals]) => {
        if (date >= currentWeekStart) {
          weeklyTotal += (cals as number);
        }
      });
      
      const weeklyGoal = getWeeklyExerciseGoal();
      if (weeklyTotal >= weeklyGoal && (weeklyTotal - amount) < weeklyGoal) {
        setShowMedal(true);
        grantBadge('weekly_goal');
      }
      
      showSuccessMsg(`${amount} kcal ajoutées (${activityName}) !`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveSleep = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { 
        sleep_hours: sleepInput.hours,
        sleep_quality: sleepInput.quality
      }, { merge: true });
      setProfile({ ...profile, sleep_hours: sleepInput.hours, sleep_quality: sleepInput.quality });
      setShowSleepModal(false);
      showSuccessMsg("Nuit enregistrée avec succès !");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      setError("Erreur lors de l'enregistrement du sommeil.");
    }
  };

  const connectAppleHealth = () => {
    // Mock connection
    setTimeout(() => {
      setIsAppleHealthConnected(true);
      showSuccessMsg("Connecté à Apple Santé avec succès !");
    }, 1500);
  };

  const logWeight = async (exerciseName: string, weight: number) => {
    if (!user) return;
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const currentHistory = profile.weight_tracking?.[exerciseName] || [];
      
      // Check if entry for today already exists
      const existingEntryIndex = currentHistory.findIndex(entry => entry.date === dateStr);
      let newHistory = [...currentHistory];
      
      if (existingEntryIndex >= 0) {
        newHistory[existingEntryIndex] = { date: dateStr, weight };
      } else {
        newHistory.push({ date: dateStr, weight });
      }
      
      const updatedTracking = {
        ...profile.weight_tracking,
        [exerciseName]: newHistory
      };
      
      await setDoc(doc(db, 'users', user.uid), { weight_tracking: updatedTracking }, { merge: true });
      setProfile(prev => {
        const newProfile = { ...prev, weight_tracking: updatedTracking };
        
        // Check for weight loss badge
        if (exerciseName === 'Poids' && newHistory.length >= 2) {
          const initialWeight = newHistory[0].weight;
          const currentWeight = weight;
          const loss = initialWeight - currentWeight;
          if (loss >= 5 && !newProfile.badges?.includes('weight_loss_5')) {
            grantBadge('weight_loss_5');
          }
        }
        
        return newProfile;
      });
      showSuccessMsg(exerciseName === 'Poids' ? "Poids enregistré !" : "Charge enregistrée !");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [exerciseWeightInput, setExerciseWeightInput] = useState<string>('');

  useEffect(() => {
    if (selectedExercise && profile.weight_tracking?.[selectedExercise.name]) {
      const history = profile.weight_tracking[selectedExercise.name];
      if (history.length > 0) {
        setExerciseWeightInput(history[history.length - 1].weight.toString());
      } else {
        setExerciseWeightInput('');
      }
    } else {
      setExerciseWeightInput('');
    }
  }, [selectedExercise, profile.weight_tracking]);
  const [activeCircuit, setActiveCircuit] = useState<any[] | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<Record<number, Record<string, boolean[]>>>({});

  const saveExerciseProgress = async (newProgress: Record<number, Record<string, boolean[]>>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { exercise_progress: newProgress }, { merge: true });
      setProfile(prev => ({ ...prev, exercise_progress: newProgress }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const toggleSet = async (exercise: any, setIndex: number) => {
    if (!user || !profile) return;
    
    const exerciseName = exercise.name;
    const totalSets = exercise.sets;
    
    // 1. Calculate new exercise progress
    const currentDayProgress = exerciseProgress[selectedDayIndex] || {};
    const currentExerciseSets = currentDayProgress[exerciseName] || new Array(totalSets).fill(false);
    const nextExerciseSets = [...currentExerciseSets];
    nextExerciseSets[setIndex] = !nextExerciseSets[setIndex];
    
    const isDoneNow = nextExerciseSets[setIndex];
    const newExerciseProgress = {
      ...exerciseProgress,
      [selectedDayIndex]: {
        ...currentDayProgress,
        [exerciseName]: nextExerciseSets
      }
    };

    // 2. Calculate calories for this set
    let caloriesForSet = 10; // default 10 calories per set
    if (exercise.duration_seconds && exercise.duration_seconds > 0) {
      caloriesForSet = Math.max(1, Math.round((exercise.duration_seconds / 60) * 10));
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    const currentBurned = profile.burned_calories_log?.[dateStr] || 0;
    let newBurned = currentBurned;
    
    if (isDoneNow) {
      newBurned += caloriesForSet;
    } else {
      newBurned = Math.max(0, newBurned - caloriesForSet);
    }
    
    const updatedBurnedLog = {
      ...(profile.burned_calories_log || {}),
      [dateStr]: newBurned
    };

    // 3. Update states and persist
    setExerciseProgress(newExerciseProgress);
    
    try {
      const updateData = {
        exercise_progress: newExerciseProgress,
        burned_calories_log: updatedBurnedLog,
        updated_at: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      setProfile(prev => ({
        ...prev,
        ...updateData
      }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const markExerciseAsDone = async (exercise: any) => {
    if (!user || !profile) return;
    
    const exerciseName = exercise.name;
    const totalSets = exercise.sets;
    
    const currentDayProgress = exerciseProgress[selectedDayIndex] || {};
    const currentExerciseSets = currentDayProgress[exerciseName] || new Array(totalSets).fill(false);
    
    // Calculate how many sets were NOT done yet
    const setsToMark = currentExerciseSets.filter(s => !s).length;
    
    const newProgress = {
      ...exerciseProgress,
      [selectedDayIndex]: {
        ...currentDayProgress,
        [exerciseName]: new Array(totalSets).fill(true)
      }
    };

    // Calculate calories for the newly completed sets
    let caloriesForSet = 10;
    if (exercise.duration_seconds && exercise.duration_seconds > 0) {
      caloriesForSet = Math.max(1, Math.round((exercise.duration_seconds / 60) * 10));
    }
    
    const caloriesToAdd = setsToMark * caloriesForSet;
    const dateStr = new Date().toISOString().split('T')[0];
    const currentBurned = profile.burned_calories_log?.[dateStr] || 0;
    
    const updatedBurnedLog = {
      ...(profile.burned_calories_log || {}),
      [dateStr]: currentBurned + caloriesToAdd
    };

    setExerciseProgress(newProgress);
    setSelectedExercise(null);

    try {
      const updateData = {
        exercise_progress: newProgress,
        burned_calories_log: updatedBurnedLog,
        updated_at: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      setProfile(prev => ({
        ...prev,
        ...updateData
      }));
      
      // Check for first workout badge
      if (!profile.badges?.includes('first_workout')) {
        grantBadge('first_workout');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const toggleCardioDone = (dayIndex: number) => {
    setExerciseProgress(prev => {
      const dayProgress = prev[dayIndex] || {};
      const isDone = dayProgress['cardio_done']?.[0] || false;
      const newProgress = {
        ...prev,
        [dayIndex]: {
          ...dayProgress,
          'cardio_done': [!isDone]
        }
      };
      saveExerciseProgress(newProgress);
      return newProgress;
    });
  };
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState((new Date().getDay() + 6) % 7);
  const [selectedCycleWeek, setSelectedCycleWeek] = useState<number>(1);
  const [selectedNutritionDayIndex, setSelectedNutritionDayIndex] = useState((new Date().getDay() + 6) % 7);
  const [predefinedPrograms, setPredefinedPrograms] = useState<any[]>([]);
  const [selectedLibraryProgram, setSelectedLibraryProgram] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [foodInput, setFoodInput] = useState('');

  // Fasting State
  const [fastingProgress, setFastingProgress] = useState(0);
  const [fastingTimeLeft, setFastingTimeLeft] = useState('');

  // Meal Scan State
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [mealAnalysis, setMealAnalysis] = useState<string | null>(null);
  const [isScanningMeal, setIsScanningMeal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCalculatingCalories, setIsCalculatingCalories] = useState(false);
  
  // Promo code & Subscription state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  
  // Admin state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [newPromoCode, setNewPromoCode] = useState({ code: '', discount: 10, duration: 0, tierId: 'all', max_uses: 0 });
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<any | null>(null);
  const [userPlansForAdmin, setUserPlansForAdmin] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [newExercise, setNewExercise] = useState({ name: '', category: '', instructions: '', image_search_query: '' });
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any | null>(null);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [adminTab, setAdminTab] = useState<'users' | 'exercises' | 'promos' | 'packages' | 'pharmacies' | 'group_message'>('users');
  const [groupMessage, setGroupMessage] = useState('');
  const [isCorrectingGroupMessage, setIsCorrectingGroupMessage] = useState(false);
  const [isSendingGroupMessage, setIsSendingGroupMessage] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [newPackage, setNewPackage] = useState({ name: '', price: '', features: '', tierLevel: 0 });
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '' });
  const [unreadMessagesCounts, setUnreadMessagesCounts] = useState<Record<string, number>>({});
  const isAdmin = user?.uid === 'v3tg7cntzDUFceZtq4ZUbazeOnz2' || (user?.email === 'charlesjeanbourget@gmail.com' && user?.emailVerified);

  const getUserTierLevel = (tierId: string | undefined, status?: string) => {
    if (!tierId) return 0;
    if (status !== undefined && status !== 'active' && tierId !== 'free') return 0;
    if (tierId === 'free') return 0;
    if (tierId === 'premium') return 1;
    if (tierId === 'elite') return 2;
    if (tierId === 'coach') return 3;
    const customPkg = packages.find(p => p.id === tierId);
    return customPkg ? customPkg.tierLevel : 0;
  };

  const fetchExercises = async () => {
    try {
      const q = query(collection(db, 'exercises'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      setExercises(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'exercises');
    }
  };

  const addExercise = async () => {
    if (!newExercise.name || !newExercise.category) return;
    try {
      const exerciseRef = doc(collection(db, 'exercises'));
      await setDoc(exerciseRef, {
        ...newExercise,
        created_at: new Date().toISOString()
      });
      setNewExercise({ name: '', category: '', instructions: '', image_search_query: '' });
      fetchExercises();
      showSuccessMsg("Exercice ajouté avec succès.");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'exercises');
      } catch (e: any) {
        setError("Erreur lors de l'ajout de l'exercice.");
      }
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'exercises', id));
      fetchExercises();
      showSuccessMsg("Exercice supprimé avec succès.");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `exercises/${id}`);
      } catch (e: any) {
        setError("Erreur lors de la suppression de l'exercice.");
      }
    }
  };

  const fetchPackages = async () => {
    try {
      const q = query(collection(db, 'packages'), orderBy('created_at', 'asc'));
      const snapshot = await getDocs(q);
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'packages');
    }
  };

  const addPackage = async () => {
    if (!newPackage.name || !newPackage.price) return;
    try {
      const packageRef = doc(collection(db, 'packages'));
      await setDoc(packageRef, {
        name: newPackage.name,
        price: newPackage.price,
        features: newPackage.features.split(',').map(f => f.trim()).filter(f => f),
        tierLevel: newPackage.tierLevel,
        created_at: new Date().toISOString()
      });
      setNewPackage({ name: '', price: '', features: '', tierLevel: 0 });
      fetchPackages();
      showSuccessMsg("Forfait ajouté avec succès.");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'packages');
      } catch (e: any) {
        setError("Erreur lors de l'ajout du forfait.");
      }
    }
  };

  const deletePackage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'packages', id));
      fetchPackages();
      showSuccessMsg("Forfait supprimé avec succès.");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `packages/${id}`);
      } catch (e: any) {
        setError("Erreur lors de la suppression du forfait.");
      }
    }
  };

  const createUserByAdmin = async () => {
    if (!newUser.email || !newUser.password) return;
    try {
      // Use secondaryAuth to avoid logging out the admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newUser.name || 'Nouveau Client',
        subscription_tier: 'free',
        updated_at: new Date().toISOString()
      });
      
      setNewUser({ email: '', password: '', name: '' });
      showSuccessMsg("Client créé avec succès !");
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `users/${newUser.email}`);
      setError("Erreur lors de la création du client: " + error.message);
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 3000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError("Erreur lors de l'envoi de l'email de réinitialisation.");
    }
  };

  const updateUserTierForAdmin = async (userId: string, newTier: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        subscription_tier: newTier,
        subscription_status: newTier === 'free' ? 'inactive' : 'active',
        updated_at: new Date().toISOString()
      }, { merge: true });
      
      // Update local state
      setAllUsers(allUsers.map(u => u.id === userId ? { ...u, subscription_tier: newTier, subscription_status: newTier === 'free' ? 'inactive' : 'active' } : u));
      if (selectedUserForAdmin && selectedUserForAdmin.id === userId) {
        setSelectedUserForAdmin({ ...selectedUserForAdmin, subscription_tier: newTier, subscription_status: newTier === 'free' ? 'inactive' : 'active' });
      }
      showSuccessMsg("Forfait mis à jour avec succès.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      setError("Erreur lors de la mise à jour du forfait.");
    }
  };

  const updatePlanContent = async (userId: string, planId: string, newContent: any) => {
    try {
      await setDoc(doc(db, 'users', userId, 'plans', planId), {
        content: JSON.stringify(newContent)
      }, { merge: true });
      fetchUserPlansForAdmin(userId);
      setEditingPlan(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/plans/${planId}`);
    }
  };

  useEffect(() => {
    if (user && isAuthReady) {
      const docRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          
          // Check for new week to reset exercise progress
          const getMonday = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            return monday.toISOString().split('T')[0];
          };
          
          const currentMonday = getMonday(new Date());
          
          if (data.current_week_start !== currentMonday) {
            try {
              await setDoc(docRef, { 
                current_week_start: currentMonday,
                exercise_progress: deleteField()
              }, { merge: true });
              // The next snapshot will have the updated data
              return;
            } catch (e) {
              console.error("Failed to update current_week_start", e);
              // Fallback: update local state so the app can load
              data.current_week_start = currentMonday;
              delete data.exercise_progress;
            }
          }
          
          setProfile(data);
          if (data.exercise_progress) {
            setExerciseProgress(data.exercise_progress);
          } else {
            setExerciseProgress({});
          }

          // Check for streak badges
          if (data.consecutive_days) {
            if (data.consecutive_days >= 3) grantBadge('streak_3');
            if (data.consecutive_days >= 7) grantBadge('streak_7');
          }

          if (data.promo_code_used) {
            const promoRef = doc(db, 'promo_codes', data.promo_code_used);
            const promoSnap = await getDoc(promoRef);
            if (promoSnap.exists()) {
              setAppliedPromo(promoSnap.data());
            }
          }
        } else {
          // Initialize profile if it doesn't exist
          const initialProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            subscription_tier: 'free',
            subscription_status: 'inactive',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            points: 0,
            level: 1,
            badges: []
          };
          try {
            await setDoc(docRef, initialProfile);
          } catch (e) {
            console.error("Failed to initialize profile", e);
            setProfile(initialProfile);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
      
      fetchPlans();
      fetchAllPlans();
      fetchPredefinedPrograms();
      fetchPackages();
      if (isAdmin) {
        fetchUsersForAdmin();
        fetchPromoCodes();
        fetchExercises();
      }
      
      return () => unsubscribe();
    }
  }, [user, isAuthReady, isAdmin]);

  useEffect(() => {
    if (user && isAuthReady) {
      // Handle Stripe success
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const tier = urlParams.get('tier');
      const promo = urlParams.get('promo');
      const promoDuration = urlParams.get('promo_duration');
      
      if (sessionId) {
        // In a real app, we'd verify this with the backend
        // For now, we'll assume success if the session_id is present
        updateSubscriptionStatus('active', tier || undefined, promo || undefined, promoDuration ? parseInt(promoDuration) : undefined);
        setShowPricing(false);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user, isAuthReady, isAdmin]);

  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'chats'),
        where('receiver_id', '==', isAdmin ? 'coach' : user.uid),
        where('read', '==', false)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          counts[data.sender_id] = (counts[data.sender_id] || 0) + 1;
        });
        setUnreadMessagesCounts(counts);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'chats');
      });
      return () => unsubscribe();
    }
  }, [user, isAuthReady, isAdmin]);

  useEffect(() => {
    if (user && isAuthReady && (getUserTierLevel(profile.subscription_tier, profile.subscription_status) >= 3 || isAdmin)) {
      const q = isAdmin 
        ? query(
            collection(db, 'chats'),
            or(
              where('sender_id', '==', selectedUserForAdmin?.id || 'coach'),
              where('receiver_id', '==', selectedUserForAdmin?.id || 'coach')
            )
          )
        : query(
            collection(db, 'chats'),
            or(
              where('sender_id', '==', user.uid),
              where('receiver_id', '==', user.uid)
            )
          );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Sort messages in memory to avoid requiring a composite index in Firestore
        msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setChatMessages(msgs);
        
        // Mark as read
        if (activeTab === 'chat' && (!isAdmin || selectedUserForAdmin)) {
          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (!data.read && data.receiver_id === (isAdmin ? 'coach' : user.uid)) {
              setDoc(doc(db, 'chats', docSnap.id), { read: true }, { merge: true });
            }
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'chats');
      });
      return () => unsubscribe();
    }
  }, [user, isAuthReady, profile.subscription_tier, isAdmin, selectedUserForAdmin]);

  useEffect(() => {
    if (activeTab !== 'library') {
      setSelectedLibraryProgram(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user && isAuthReady && activeTab === 'chat' && chatMessages.length > 0 && (!isAdmin || selectedUserForAdmin)) {
      chatMessages.forEach(msg => {
        if (!msg.read && msg.receiver_id === (isAdmin ? 'coach' : user?.uid)) {
          setDoc(doc(db, 'chats', msg.id), { read: true }, { merge: true });
        }
      });
    }
  }, [activeTab, chatMessages, isAdmin, user, isAuthReady, selectedUserForAdmin]);

  useEffect(() => {
    let interval: any = null;
    if (profile.is_fasting && profile.fasting_start_time && profile.fasting_duration) {
      interval = setInterval(() => {
        const startTime = new Date(profile.fasting_start_time!).getTime();
        const durationMs = profile.fasting_duration! * 60 * 60 * 1000;
        const endTime = startTime + durationMs;
        const now = new Date().getTime();
        
        if (now >= endTime) {
          setFastingProgress(100);
          setFastingTimeLeft('Terminé');
          
          // Only trigger end if it just finished to avoid spamming
          if (fastingProgress < 100) {
            handleFastingEnd();
          }
        } else {
          const elapsed = now - startTime;
          const progress = Math.min((elapsed / durationMs) * 100, 100);
          setFastingProgress(progress);
          
          const remainingMs = endTime - now;
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setFastingTimeLeft(`${hours}h ${minutes}m`);
        }
      }, 1000);
    } else {
      setFastingProgress(0);
      setFastingTimeLeft('');
    }
    return () => clearInterval(interval);
  }, [profile.is_fasting, profile.fasting_start_time, profile.fasting_duration]);

  const handleFastingStart = async () => {
    if (!user) return;
    const startTime = new Date().toISOString();
    try {
      await setDoc(doc(db, 'users', user.uid), {
        is_fasting: true,
        fasting_start_time: startTime
      }, { merge: true });
      
      setProfile(prev => ({ ...prev, is_fasting: true, fasting_start_time: startTime }));
      
      // Notify backend
      fetch('/api/notify-fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userName: profile.name || 'Utilisateur',
          action: 'start',
          duration: profile.fasting_duration || 16
        })
      }).catch(err => console.error("Error notifying backend:", err));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleFastingEnd = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        is_fasting: false,
        fasting_start_time: null
      }, { merge: true });
      
      setProfile(prev => ({ ...prev, is_fasting: false, fasting_start_time: undefined }));
      
      // Notify backend
      fetch('/api/notify-fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userName: profile.name || 'Utilisateur',
          action: 'end',
          duration: profile.fasting_duration || 16
        })
      }).catch(err => console.error("Error notifying backend:", err));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealImage(reader.result as string);
        setMealAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMealScan = async () => {
    if (!mealImage || !user) return;
    setIsScanningMeal(true);
    setMealAnalysis(null);
    try {
      const result = await analyzeMeal(mealImage);
      
      if (result.name && result.calories) {
        setMealAnalysis(`${result.name} : ${result.calories} kcal\n${result.details}`);
        
        const dateStr = new Date().toISOString().split('T')[0];
        const newEntry = {
          id: Date.now().toString(),
          name: result.name,
          calories: result.calories
        };
        
        const currentEntries = profile.daily_food_entries?.[dateStr] || [];
        const updatedEntries = {
          ...profile.daily_food_entries,
          [dateStr]: [...currentEntries, newEntry]
        };
        
        const currentLog = profile.daily_calories_log?.[dateStr] || 0;
        const updatedLog = {
          ...profile.daily_calories_log,
          [dateStr]: currentLog + result.calories
        };
        
        const updateData = {
          daily_food_entries: updatedEntries,
          daily_calories_log: updatedLog,
          updated_at: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
        setProfile({ ...profile, ...updateData });
        showSuccessMsg("Repas ajouté avec succès !");
      } else {
        setMealAnalysis("Impossible d'analyser le repas avec précision.");
      }
    } catch (error) {
      console.error("Error scanning meal:", error);
      setMealAnalysis("Une erreur est survenue lors de l'analyse du repas.");
    } finally {
      setIsScanningMeal(false);
    }
  };

  const fetchPredefinedPrograms = async () => {
    try {
      const qSnap = await getDocs(collection(db, 'predefined_programs'));
      setPredefinedPrograms(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error("Error fetching predefined programs:", e);
    }
  };

  const updateSubscriptionStatus = async (status: string, tier?: string, promo?: string | null, promoDuration?: number | null) => {
    if (!user) return;
    try {
      const updateData: any = {
        name: profile.name || user.displayName || user.email || '',
        subscription_status: status,
        updated_at: new Date().toISOString()
      };
      if (tier) {
        updateData.subscription_tier = tier;
      }
      
      const appliedPromoCode = promo !== undefined ? promo : (appliedPromo ? appliedPromo.code : null);
      const appliedPromoDuration = promoDuration !== undefined ? promoDuration : (appliedPromo ? appliedPromo.duration : null);

      if (appliedPromoCode) {
        updateData.promo_code_used = appliedPromoCode;
        updateData.promo_code_applied_at = new Date().toISOString();
        if (appliedPromoDuration !== null && appliedPromoDuration !== undefined) {
          updateData.promo_code_duration = appliedPromoDuration;
        }
      }
      
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      
      if (appliedPromoCode) {
        await setDoc(doc(db, 'promo_codes', appliedPromoCode), { current_uses: increment(1) }, { merge: true });
      }
    } catch (e) {
      console.error("Error updating subscription status:", e);
    }
  };

  const handleCorrectGroupMessage = async () => {
    if (!groupMessage.trim()) return;
    setIsCorrectingGroupMessage(true);
    try {
      const corrected = await correctMessage(groupMessage);
      setGroupMessage(corrected);
      showSuccessMsg("Message corrigé par l'IA !");
    } catch (e) {
      console.error("Error correcting group message:", e);
      setError("Erreur lors de la correction du message.");
    } finally {
      setIsCorrectingGroupMessage(false);
    }
  };

  const handleSendGroupMessage = async () => {
    if (!user || !groupMessage.trim() || !isAdmin) return;
    setIsSendingGroupMessage(true);
    try {
      // Create chunks of 500 for Firestore batch limits
      const chunkSize = 500;
      const clients = allUsers.filter(client => client.id !== user.uid);
      
      for (let i = 0; i < clients.length; i += chunkSize) {
        const chunk = clients.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        
        chunk.forEach(client => {
          const msgData = {
            sender_id: 'coach',
            receiver_id: client.id,
            participants: ['coach', client.id],
            text: groupMessage,
            created_at: new Date().toISOString(),
            read: false
          };
          const newDocRef = doc(collection(db, 'chats'));
          batch.set(newDocRef, msgData);
        });
        
        await batch.commit();
      }

      setGroupMessage('');
      showSuccessMsg(`Message envoyé à ${clients.length} clients !`);
      setAdminTab('users');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'chats');
      console.error("Error sending group message:", e);
      setError("Erreur lors de l'envoi du message groupé.");
    } finally {
      setIsSendingGroupMessage(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    try {
      const receiverId = isAdmin ? (selectedUserForAdmin?.id || 'client') : 'coach';
      const msgData = {
        sender_id: user.uid,
        receiver_id: receiverId,
        participants: [user.uid, receiverId],
        text: newMessage,
        created_at: new Date().toISOString(),
        read: false
      };
      await setDoc(doc(collection(db, 'chats')), msgData);
      setNewMessage('');
      
      // Notify coach if client sent it
      if (!isAdmin) {
        await fetch('/api/notify-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: profile.name || user.email,
            message: newMessage
          })
        });
      }
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  const handleCheckout = async (tierId: string, priceId: string) => {
    if (!user) return;
    setError(null);
    
    const isPromoApplicable = !appliedPromo || !appliedPromo.tierId || appliedPromo.tierId === 'all' || appliedPromo.tierId === tierId;
    const discountNum = appliedPromo && !isNaN(Number(appliedPromo.discount)) ? Number(appliedPromo.discount) : 0;
    
    // If 100% discount and applicable, bypass Stripe
    if (appliedPromo && isPromoApplicable && discountNum === 100) {
      try {
        setLoading(true);
        const updateData: any = {
          name: profile.name || user.displayName || user.email || '',
          subscription_status: 'active',
          subscription_tier: tierId,
          promo_code_used: appliedPromo.code,
          promo_code_applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (appliedPromo.duration !== undefined) {
          updateData.promo_code_duration = appliedPromo.duration;
        }
        await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
        await setDoc(doc(db, 'promo_codes', appliedPromo.code), { current_uses: increment(1) }, { merge: true });
        setShowPricing(false);
        setActiveTab('dashboard');
      } catch (e: any) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
        setError(e.message || "Erreur lors de l'activation du forfait.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (getUserTierLevel(tierId) === 0) {
      try {
        setLoading(true);
        const updateData: any = {
          name: profile.name || user.displayName || user.email || '',
          subscription_status: 'active',
          subscription_tier: tierId,
          updated_at: new Date().toISOString()
        };
        if (appliedPromo && isPromoApplicable) {
          updateData.promo_code_used = appliedPromo.code;
          updateData.promo_code_applied_at = new Date().toISOString();
          if (appliedPromo.duration !== undefined) {
            updateData.promo_code_duration = appliedPromo.duration;
          }
        }
        await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
        if (appliedPromo && isPromoApplicable) {
          await setDoc(doc(db, 'promo_codes', appliedPromo.code), { current_uses: increment(1) }, { merge: true });
        }
        setShowPricing(false);
        setActiveTab('dashboard');
      } catch (e: any) {
        console.error("Checkout error:", e);
        setError(e.message || "Erreur lors de l'activation du forfait.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          userEmail: user.email,
          tierId,
          promoCode: isPromoApplicable ? appliedPromo?.code : undefined,
          discount: isPromoApplicable ? discountNum : undefined,
          duration: isPromoApplicable ? appliedPromo?.duration : undefined
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === "Stripe is not configured") {
          throw new Error("Paiements non configurés. Veuillez ajouter vos clés Stripe dans les paramètres.");
        }
        throw new Error(data.error || "Erreur lors de l'initialisation du paiement.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Mock success for demo if no stripe key or url
        updateSubscriptionStatus('active', tierId, isPromoApplicable ? (appliedPromo?.code || null) : null, isPromoApplicable ? (appliedPromo?.duration || null) : null);
        setProfile({ ...profile, subscription_tier: tierId as any });
        setShowPricing(false);
        setActiveTab('dashboard');
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
      setError(e.message || "Erreur lors de l'initialisation du paiement.");
    } finally {
      setLoading(false);
    }
  };

  const renderPricing = () => (
    <div className="space-y-8 pb-32">
      {getUserTierLevel(profile.subscription_tier, profile.subscription_status) > 0 && (
        <button 
          onClick={() => setShowPricing(false)}
          className="flex items-center gap-2 text-brand-teal font-bold text-sm uppercase tracking-wider mb-4"
        >
          <ChevronLeft size={18} />
          Retour au profil
        </button>
      )}
      <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop" 
          alt="Pricing Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Forfaits</h2>
            <p className="text-slate-600 text-sm font-medium">Paiement récurrent, annulable en tout temps.</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-2xl space-y-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Ticket size={18} className="text-brand-teal" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Code Promotionnel</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none uppercase text-sm min-w-0"
            placeholder="ENTREZ VOTRE CODE"
            value={promoCodeInput}
            onChange={(e) => setPromoCodeInput(e.target.value)}
          />
          <button 
            onClick={applyPromoCode}
            className="w-full sm:w-auto px-4 py-3 bg-brand-teal text-slate-950 font-bold rounded-xl hover:bg-brand-teal/80 transition-all text-sm whitespace-nowrap shrink-0"
          >
            Appliquer
          </button>
        </div>
        {appliedPromo && (
          <div className="flex items-center justify-between bg-brand-teal/10 border border-brand-teal/20 p-3 rounded-xl">
            <p className="text-xs text-brand-teal font-bold flex items-center gap-2">
              <Tag size={14} />
              Code {appliedPromo.code} : -{appliedPromo.discount}% {appliedPromo.duration === 0 ? 'à vie' : `pendant ${appliedPromo.duration} mois`}
              {appliedPromo.tierId && appliedPromo.tierId !== 'all' && ` (Valable uniquement sur le forfait ${appliedPromo.tierId})`}
            </p>
            <button 
              onClick={async () => {
                setAppliedPromo(null);
                setProfile({ ...profile, promo_code_used: undefined, promo_code_applied_at: undefined, promo_code_duration: undefined });
                if (user) {
                  try {
                    const updateData: any = {
                      name: profile.name || user.displayName || user.email || '',
                      promo_code_used: deleteField(),
                      promo_code_applied_at: deleteField(),
                      promo_code_duration: deleteField(),
                      updated_at: new Date().toISOString()
                    };
                    await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
                  } catch (e) {
                    console.error("Error removing promo code:", e);
                  }
                }
              }}
              className="p-1.5 hover:bg-brand-teal/20 rounded-lg text-brand-teal transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {(packages.length > 0 ? packages.sort((a, b) => a.tierLevel - b.tierLevel) : [
          { id: 'free', name: 'Gratuit', price: 0, features: ['10 programmes Perte de Poids', '10 programmes Prise de Masse', '10 programmes Cardio', '6 programmes Abdominaux', 'Options Gym & Maison'], tierLevel: 0, priceId: '' },
          { id: 'premium', name: 'Entraînement', price: 9.99, features: ['Plans sur mesure illimités', 'Tout le contenu Gratuit', 'IA Générative'], tierLevel: 1, priceId: (import.meta as any).env.VITE_STRIPE_PRICE_ID_PREMIUM || 'price_123' },
          { id: 'elite', name: 'Nutrition & Sport', price: 19.99, features: ['Plans Nutrition illimités', 'Plans Sport sur mesure', 'Tout le contenu Gratuit'], tierLevel: 2, priceId: (import.meta as any).env.VITE_STRIPE_PRICE_ID_ELITE || 'price_456' },
          { id: 'coach', name: 'Coaching VIP', price: 29.99, features: ['Chat direct avec le coach', 'Notifications prioritaires', 'Tout le contenu Elite'], tierLevel: 3, priceId: (import.meta as any).env.VITE_STRIPE_PRICE_ID_COACH || 'price_789' }
        ]).map((tier) => {
          const isPromoApplicable = !appliedPromo || !appliedPromo.tierId || appliedPromo.tierId === 'all' || appliedPromo.tierId === tier.id;
          const discount = isPromoApplicable && appliedPromo && !isNaN(Number(appliedPromo.discount)) ? Number(appliedPromo.discount) : 0;
          const priceNum = typeof tier.price === 'string' ? parseFloat(tier.price) : tier.price;
          const finalPrice = Math.max(0, priceNum * (1 - discount / 100)).toFixed(2);
          
          // Ensure we have a dummy priceId for simulation if one is missing from the DB
          const effectivePriceId = tier.priceId || (tier.tierLevel === 1 ? 'price_123' : tier.tierLevel === 2 ? 'price_456' : tier.tierLevel === 3 ? 'price_789' : '');

          const isDisabled = loading || (profile.subscription_tier === tier.id && profile.subscription_status === 'active');

          return (
            <Card key={tier.id} className={`relative overflow-hidden transition-all ${isDisabled ? 'opacity-50 grayscale' : 'group hover:border-rose-500/50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    {discount > 0 && priceNum > 0 && (
                      <span className="text-sm text-slate-500 line-through">{priceNum}$</span>
                    )}
                    <span className="text-2xl font-black text-rose-500">{finalPrice}$</span>
                    <span className="text-xs text-slate-500">/mois</span>
                  </div>
                </div>
                <div className={`p-2 rounded-xl ${tier.tierLevel >= 3 ? 'bg-rose-500 text-slate-950' : 'bg-white/5 text-slate-500'}`}>
                  {tier.tierLevel === 0 ? <Library size={20} /> : <Zap size={20} />}
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f: string) => (
                  <li key={f} className="text-xs text-slate-500 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-rose-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleCheckout(tier.id, effectivePriceId)}
                disabled={isDisabled}
                className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  (profile.subscription_tier === tier.id && profile.subscription_status === 'active')
                    ? 'bg-green-500/20 text-green-500 cursor-not-allowed border border-green-500/50'
                    : isDisabled ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : tier.tierLevel >= 3 ? 'bg-rose-500 text-slate-950 hover:bg-rose-400' : 'bg-white/10 text-slate-900 hover:bg-white/20'
                }`}
              >
                {loading ? <Activity className="animate-spin" size={18} /> : 
                 (profile.subscription_tier === tier.id && profile.subscription_status === 'active') ? 'Forfait Actuel' :
                 (tier.tierLevel === 0 ? 'Commencer' : (discount === 100 ? 'Activer Gratuitement' : 'S\'abonner'))}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderCoachChat = () => {
    if (isAdmin && !selectedUserForAdmin) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] text-center px-4">
          <MessageSquare size={64} className="text-slate-700 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Messagerie Coach</h2>
          <p className="text-slate-500 mb-8 max-w-md">
            Pour discuter avec un client, veuillez le sélectionner depuis le panneau d'administration.
          </p>
          <button 
            onClick={() => {
              setActiveTab('admin');
              setAdminTab('users');
            }}
            className="px-6 py-3 bg-brand-teal text-slate-950 font-bold rounded-xl hover:bg-brand-teal/80 transition-all"
          >
            Aller au panneau d'administration
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[calc(100vh-180px)] pb-20">
        <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200 shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop" 
            alt="Chat Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">
                {isAdmin ? `Chat avec ${selectedUserForAdmin.name || 'Client'}` : 'Coach'}
              </h2>
              <p className="text-slate-600 text-sm font-medium">
                {isAdmin ? 'Répondez aux questions de votre client.' : 'Posez vos questions en direct.'}
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => {
                  setActiveTab('admin');
                  setAdminTab('users');
                }}
                className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-slate-900 hover:bg-white/20 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-hide">
          {chatMessages.map((msg, i) => {
            const isMe = msg.sender_id === user?.uid;
            return (
              <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                  isMe ? 'bg-brand-teal text-slate-950 rounded-tr-none' : 'bg-slate-800 text-slate-900 rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-slate-950' : 'text-slate-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
              <MessageSquare size={48} className="mb-4" />
              <p className="text-sm italic">
                {isAdmin ? 'Aucun message avec ce client.' : 'Commencez la conversation avec votre coach.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-4 text-slate-900 focus:border-brand-teal outline-none"
            placeholder="Votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            onClick={sendMessage}
            className="p-4 bg-brand-teal text-slate-950 rounded-xl hover:bg-brand-teal/80 transition-all active:scale-95"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  };
  const fetchPromoCodes = async () => {
    try {
      const q = query(collection(db, 'promo_codes'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const codes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromoCodes(codes);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'promo_codes');
    }
  };

  const addPromoCode = async () => {
    if (!newPromoCode.code) return;
    try {
      const code = newPromoCode.code.toUpperCase();
      await setDoc(doc(db, 'promo_codes', code), {
        code,
        discount: newPromoCode.discount,
        duration: newPromoCode.duration,
        tierId: newPromoCode.tierId,
        max_uses: newPromoCode.max_uses,
        current_uses: 0,
        active: true,
        created_at: new Date().toISOString()
      });
      setNewPromoCode({ code: '', discount: 10, duration: 0, tierId: 'all', max_uses: 0 });
      fetchPromoCodes();
      showSuccessMsg("Code promo ajouté avec succès.");
    } catch (error: any) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'promo_codes');
      } catch (e: any) {
        console.error("Error adding promo code:", e);
        setError(`Erreur lors de l'ajout du code promo: ${e.message || e}`);
      }
    }
  };

  const deletePromoCode = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promo_codes', id));
      fetchPromoCodes();
      showSuccessMsg("Code promo supprimé avec succès.");
    } catch (error: any) {
      try {
        handleFirestoreError(error, OperationType.DELETE, 'promo_codes');
      } catch (e: any) {
        console.error("Error deleting promo code:", e);
        setError(`Erreur lors de la suppression du code promo: ${e.message || e}`);
      }
    }
  };

  const applyPromoCode = async () => {
    if (!promoCodeInput) return;
    try {
      const code = promoCodeInput.toUpperCase();
      const docRef = doc(db, 'promo_codes', code);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().active) {
        const promoData = docSnap.data();
        
        // Check if max uses limit is reached
        if (promoData.max_uses && promoData.max_uses > 0) {
          const currentUses = promoData.current_uses || 0;
          if (currentUses >= promoData.max_uses) {
            setError("Ce code promotionnel a atteint sa limite d'utilisation.");
            setAppliedPromo(null);
            return;
          }
        }

        setAppliedPromo(promoData);
        setProfile({ 
          ...profile, 
          promo_code_used: code,
          promo_code_applied_at: new Date().toISOString(),
          promo_code_duration: promoData.duration || 0
        });
        setError(null);
      } else {
        setError("Code promo invalide ou expiré.");
        setAppliedPromo(null);
      }
    } catch (e: any) {
      console.error("Error applying promo code:", e);
      if (e.message && e.message.includes("permission")) {
        setError("Code promo invalide ou expiré.");
      } else {
        setError("Erreur lors de la vérification du code promo.");
      }
      setAppliedPromo(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccessMsg(`Un e-mail de réinitialisation du mot de passe a été envoyé à ${email}.`);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setError(`Erreur lors de l'envoi de l'e-mail: ${error.message}`);
    }
  };

  const savePlanForAdmin = async (userId: string, planData: any) => {
    try {
      const docRef = planData.id ? doc(db, 'users', userId, 'plans', planData.id) : doc(collection(db, 'users', userId, 'plans'));
      await setDoc(docRef, {
        ...planData,
        created_at: planData.created_at || new Date().toISOString()
      }, { merge: true });
      fetchUserPlansForAdmin(userId);
      setIsPlanEditorOpen(false);
      setEditingPlan(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/plans`);
    }
  };

  const fetchUsersForAdmin = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('updated_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(users);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    }
  };

  const fetchUserPlansForAdmin = async (userId: string) => {
    try {
      const q = query(collection(db, 'users', userId, 'plans'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserPlansForAdmin(plans);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users/${userId}/plans`);
    }
  };

  const deleteUserForAdmin = (userId: string) => {
    setConfirmDialog({
      message: "Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses données ?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));
          setAllUsers(allUsers.filter(u => u.id !== userId));
          if (selectedUserForAdmin?.id === userId) setSelectedUserForAdmin(null);
          showSuccessMsg("Utilisateur supprimé avec succès.");
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `users/${userId}`);
          setError("Erreur lors de la suppression de l'utilisateur.");
        }
      }
    });
  };

  const deletePlanForAdmin = (userId: string, planId: string) => {
    setConfirmDialog({
      message: "Supprimer ce programme ?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId, 'plans', planId));
          setUserPlansForAdmin(userPlansForAdmin.filter(p => p.id !== planId));
          showSuccessMsg("Programme supprimé avec succès.");
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `users/${userId}/plans/${planId}`);
          setError("Erreur lors de la suppression du programme.");
        }
      }
    });
  };

  const fetchPlans = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'plans'), orderBy('created_at', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          created_at: data.created_at,
          content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content
        } as any;
      });
      
      const workout = plans.find((p: any) => p.type === 'workout');
      const nutrition = plans.find((p: any) => p.type === 'nutrition');
      
      if (workout) setWorkoutPlan(workout);
      if (nutrition) setNutritionPlan(nutrition);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users/${user.uid}/plans`);
    }
  };

  const fetchAllPlans = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'plans'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content
        };
      });
      setAllPlans(plans);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users/${user.uid}/plans`);
    }
  };

  const removeFoodEntry = async (dateStr: string, entryId: string, caloriesToRemove: number) => {
    if (!user) return;
    try {
      const currentLog = profile.daily_calories_log || {};
      const currentTotal = currentLog[dateStr] || 0;
      const updatedLog = {
        ...currentLog,
        [dateStr]: Math.max(0, currentTotal - caloriesToRemove)
      };

      const currentEntries = profile.daily_food_entries || {};
      const todayEntries = currentEntries[dateStr] || [];
      const updatedEntries = {
        ...currentEntries,
        [dateStr]: todayEntries.filter(e => e.id !== entryId)
      };

      await setDoc(doc(db, 'users', user.uid), {
        daily_calories_log: updatedLog,
        daily_food_entries: updatedEntries,
        updated_at: new Date().toISOString()
      }, { merge: true });

      setProfile({ ...profile, daily_calories_log: updatedLog, daily_food_entries: updatedEntries });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const calculateAndLogFood = async () => {
    if (!user || !foodInput) return;
    setIsCalculatingCalories(true);
    setError(null);

    try {
      const addedCalories = await estimateCalories(foodInput);

      // We allow 0 calories for water/tea but ensure it's a valid estimation
      if (addedCalories < 0) {
        throw new Error("Estimation de calories négative");
      }

      const today = new Date().toISOString().split('T')[0];
      const currentLog = profile.daily_calories_log || {};
      const currentTotal = currentLog[today] || 0;
      
      const updatedLog = {
        ...currentLog,
        [today]: currentTotal + addedCalories
      };

      const currentEntries = profile.daily_food_entries || {};
      const todayEntries = currentEntries[today] || [];
      const newEntry = {
        id: Date.now().toString(),
        name: foodInput,
        calories: addedCalories
      };
      
      const updatedEntries = {
        ...currentEntries,
        [today]: [...todayEntries, newEntry]
      };

      await setDoc(doc(db, 'users', user.uid), {
        daily_calories_log: updatedLog,
        daily_food_entries: updatedEntries,
        updated_at: new Date().toISOString()
      }, { merge: true });
      
      setProfile(prev => ({ ...prev, daily_calories_log: updatedLog, daily_food_entries: updatedEntries }));
      setFoodInput('');
      showSuccessMsg("Calories ajoutées avec succès !");
    } catch (e: any) {
      console.error("Error calculating calories:", e);
      setError("Erreur lors du calcul des calories. Veuillez réessayer.");
    } finally {
      setIsCalculatingCalories(false);
    }
  };

  const handleGenerate = async (type: 'workout' | 'nutrition') => {
    if (!user) return;
    
    // Check subscription tier
    if (getUserTierLevel(profile.subscription_tier, profile.subscription_status) === 0) {
      setError("Veuillez choisir un forfait payant pour générer des plans personnalisés.");
      setShowPricing(true);
      setActiveTab('profile');
      return;
    }

    if (type === 'nutrition' && getUserTierLevel(profile.subscription_tier, profile.subscription_status) < 2) {
      setError("Le plan nutrition est réservé aux forfaits Elite et Coaching VIP.");
      setShowPricing(true);
      setActiveTab('profile');
      return;
    }

    if (!profile || Object.keys(profile).length === 0) {
      setError("Veuillez d'abord remplir et enregistrer votre profil.");
      return;
    }

    // Check for essential fields for calculation
    const requiredFields = ['name', 'age', 'height', 'weight', 'gender', 'activity_level_non_gym', 'primary_goal', 'pharmacy_banner', 'pharmacy_owner'];
    const missingFields = requiredFields.filter(f => !profile[f]);
    
    if (missingFields.length > 0) {
      setError(`Veuillez compléter toutes les informations de votre profil (y compris la bannière de pharmacie et le nom du propriétaire) avant de générer un plan.`);
      setShowPricing(false);
      setActiveTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Call Gemini directly from frontend
      const plan = await generatePlan(profile, type);
      
      if (!plan) {
        throw new Error("L'IA n'a pas pu générer de plan. Veuillez réessayer.");
      }

      // Save to Firestore
      const planRef = doc(collection(db, 'users', user.uid, 'plans'));
      const createdAt = new Date().toISOString();
      await setDoc(planRef, {
        type,
        content: JSON.stringify(plan),
        created_at: createdAt
      });

      if (type === 'workout') setWorkoutPlan({ content: plan, created_at: createdAt });
      else setNutritionPlan({ content: plan, created_at: createdAt });
      fetchAllPlans();
    } catch (e: any) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/plans`);
      setError("Erreur : " + (e.message || "Impossible de générer le plan."));
    } finally {
      setLoading(false);
    }
  };

  const insertRestWeek = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const restWeekPlan = {
        weekly_plan: Array(7).fill({
          is_rest_day: true,
          focus: "Repos",
          workout: []
        })
      };

      const createdAt = new Date().toISOString();
      const planRef = doc(collection(db, 'users', user.uid, 'plans'));
      await setDoc(planRef, {
        type: 'workout',
        content: JSON.stringify(restWeekPlan),
        created_at: createdAt
      });

      setWorkoutPlan({ content: restWeekPlan, created_at: createdAt });
      fetchAllPlans();
      showSuccessMsg("Semaine de repos insérée avec succès.");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/plans`);
      setError("Erreur lors de l'insertion de la semaine de repos.");
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
    
    let currentDayWorkout = null;
    if (workoutPlan) {
      const content = workoutPlan.content;
      currentDayWorkout = content?.weekly_plan ? content.weekly_plan[dayOfWeek] : null;
    }

    let currentDayNutrition = null;
    if (nutritionPlan) {
      const content = nutritionPlan.content;
      currentDayNutrition = content?.weekly_nutrition ? content.weekly_nutrition[dayOfWeek] : null;
    }
    
    const bmi = profile.weight && profile.height 
      ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) 
      : null;

    const metabolism = calculateMetabolism();

    const getBmiCategory = (val: number) => {
      if (val < 18.5) return { label: "Insuffisance", color: "text-amber-400" };
      if (val < 25) return { label: "Normal", color: "text-rose-400" };
      if (val < 30) return { label: "Surpoids", color: "text-amber-400" };
      return { label: "Obésité", color: "text-red-400" };
    };

    const healthStatus = () => {
      if (profile.current_injuries || profile.medical_conditions) {
        return { label: "À surveiller", color: "text-amber-400", icon: AlertTriangle };
      }
      return { label: "Optimale", color: "text-rose-400", icon: CheckCircle2 };
    };

    const status = healthStatus();
    
    const workoutExercises = currentDayWorkout?.workout || [];
    const hasCardio = !!currentDayWorkout?.cardio;
    const totalSets = workoutExercises.reduce((acc: number, ex: any) => acc + (Number(ex.sets) || 0), 0);
    const totalItems = totalSets + (hasCardio ? 1 : 0);
    
    const dayProgress = exerciseProgress[dayOfWeek] || {};
    const completedSets = workoutExercises.reduce((acc: number, ex: any) => {
      const progress = dayProgress[ex.name] || [];
      return acc + progress.filter(Boolean).length;
    }, 0);
    
    const cardioDone = dayProgress['cardio_done']?.[0] ? 1 : 0;
    const completedItems = completedSets + cardioDone;
    
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      let dayTarget = profile.daily_calorie_goal || metabolism?.target || 2000;
      if (nutritionPlan?.content?.weekly_nutrition) {
        // Find the day of week (0 = Monday, 6 = Sunday)
        const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
        const dayNutrition = nutritionPlan.content.weekly_nutrition[dayOfWeek];
        if (dayNutrition?.calories) {
          dayTarget = dayNutrition.calories;
        }
      }
      
      return {
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        consomme: profile.daily_calories_log?.[dateStr] || 0,
        depense: profile.burned_calories_log?.[dateStr] || 0,
        cible: dayTarget
      };
    });

    return (
      <div className="space-y-8">
        <header className="relative w-full rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-100 group bg-white/90">
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2940&auto=format&fit=crop" 
            alt="Dashboard Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-teal/20 via-transparent to-transparent opacity-60 mix-blend-screen"></div>
          
          <div className="absolute top-6 left-6">
            <Logo className="h-8" />
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-2">
            {profile.consecutive_days && profile.consecutive_days > 0 ? (
              <div className="bg-orange-500/20 backdrop-blur-md border border-orange-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <Flame size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-400">{profile.consecutive_days} jours</span>
              </div>
            ) : null}
            <button 
              onClick={() => signOut(auth)}
              className="p-2 bg-white/90 backdrop-blur-xl rounded-full border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-slate-800/80 transition-all shadow-xl"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>

          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const burnedToday = profile.burned_calories_log?.[todayStr] || 0;
            if (burnedToday === 0) {
              return (
                <div className="absolute top-16 right-6 bg-brand-teal/20 backdrop-blur-md border border-brand-teal/30 px-3 py-1.5 rounded-xl flex items-center gap-2 max-w-[200px] shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                  <Activity size={14} className="text-brand-teal shrink-0" />
                  <span className="text-[10px] font-bold text-brand-teal leading-tight">N'oubliez pas de bouger aujourd'hui !</span>
                </div>
              );
            }
            return null;
          })()}

          <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col justify-end">
            <p className="micro-label text-brand-teal/80 mb-2 drop-shadow-md">VOTRE ESPACE PERSONNEL</p>
            <h1 className="text-4xl md:text-5xl font-display font-medium text-slate-900 mb-2 drop-shadow-md">
              Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{profile.name || 'Athlète'}</span>
            </h1>
            <p className="text-slate-500 text-sm font-sans max-w-sm font-medium">
              {currentDayWorkout?.is_rest_day 
                ? "C'est votre jour de repos aujourd'hui. Récupérez bien !" 
                : "Prêt pour votre séance d'aujourd'hui ?"}
            </p>
          </div>
        </header>

        <button 
          onClick={() => setActiveTab('profile')}
          className="w-full relative overflow-hidden p-6 glass-panel rounded-3xl flex items-center justify-between group hover:border-brand-teal/30 hover:bg-white/[0.05] transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(124,6,32,0.2)]">
              <UserCircle size={26} strokeWidth={1.5} />
            </div>
            <div className="text-left flex flex-col">
              <span className="text-base font-display font-medium text-slate-900 group-hover:text-brand-teal transition-colors">Mon Profil & Questionnaire</span>
              <span className="micro-label mt-1">Gérer mon forfait et mes données</span>
            </div>
          </div>
          <ChevronRight size={24} className="text-slate-600 group-hover:text-brand-teal group-hover:translate-x-1 transition-all relative z-10" />
        </button>

        {currentDayWorkout && currentDayWorkout.cardio && !currentDayWorkout.is_rest_day && (
          <button 
            onClick={() => setActiveTab('workout')}
            className="w-full p-7 glass-panel !border-rose-500/20 !bg-rose-500/5 rounded-3xl flex flex-col gap-5 group hover:!border-rose-500/50 hover:!bg-rose-500/10 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent opacity-80 mix-blend-screen transition-opacity group-hover:opacity-100"></div>
            <div className="absolute -right-4 -top-4 w-40 h-40 opacity-5 transition-transform group-hover:scale-110 duration-700">
              <Zap size={160} className="text-rose-400" strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-5 relative z-10 w-full">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-400/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(56,189,248,0.2)] group-hover:scale-110 transition-transform duration-500">
                <Activity size={32} strokeWidth={1.5} />
              </div>
              <div className="text-left flex-1">
                <p className="micro-label text-rose-400/80 mb-1">Session Cardio Aujourd'hui</p>
                <h3 className="text-2xl font-display font-medium text-slate-900 tracking-tight">{currentDayWorkout.cardio.type}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-6 relative z-10 bg-white/80 p-4 rounded-2xl border border-slate-100 w-full">
              <div className="flex flex-col">
                <span className="micro-label text-slate-500 mb-1">Durée</span>
                <span className="text-sm font-sans font-medium text-slate-900">{currentDayWorkout.cardio.duration}</span>
              </div>
              <div className="flex flex-col border-l border-slate-200 pl-6">
                <span className="micro-label text-slate-500 mb-1">Intensité</span>
                <span className="text-sm font-sans font-medium text-rose-400">{currentDayWorkout.cardio.intensity}</span>
              </div>
              <div className="ml-auto">
                <div className="px-5 py-2.5 bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-rose-500 group-hover:text-slate-900 transition-colors duration-300">
                  Détails
                </div>
              </div>
            </div>
          </button>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveTab('workout')}
            className="relative p-6 rounded-3xl flex flex-col items-start justify-end gap-3 group overflow-hidden border border-slate-200 h-48 shadow-2xl hover:border-brand-teal/40 transition-all duration-500 bg-white/80"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent z-10 pointer-events-none"></div>
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop" 
              alt="Entraînement" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity group-hover:opacity-40 transition-opacity group-hover:scale-110 duration-700 ease-in-out"
              referrerPolicy="no-referrer"
            />
            
            <div className="relative z-20 w-12 h-12 bg-white/5 border border-slate-200 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 mb-2 group-hover:scale-110 group-hover:bg-brand-teal/20 group-hover:text-brand-teal transition-all duration-500 shadow-xl">
              <Dumbbell size={24} strokeWidth={1.5} />
            </div>
            
            <div className="relative z-20 text-left">
              <p className="micro-label text-brand-teal/80 mb-1">Ma séance</p>
              <p className="text-lg font-display font-medium text-slate-900 drop-shadow-md group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-teal transition-all">Entraînement</p>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('nutrition')}
            className="relative p-6 rounded-3xl flex flex-col items-start justify-end gap-3 group overflow-hidden border border-slate-200 h-48 shadow-2xl hover:border-brand-green/40 transition-all duration-500 bg-white/80"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent z-10 pointer-events-none"></div>
            <img 
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400&auto=format&fit=crop" 
              alt="Nutrition" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity group-hover:opacity-40 transition-opacity group-hover:scale-110 duration-700 ease-in-out"
              referrerPolicy="no-referrer"
            />
            
            <div className="relative z-20 w-12 h-12 bg-white/5 border border-slate-200 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 mb-2 group-hover:scale-110 group-hover:bg-brand-green/20 group-hover:text-brand-green transition-all duration-500 shadow-xl">
              <Utensils size={24} strokeWidth={1.5} />
            </div>
            
            <div className="relative z-20 text-left">
              <p className="micro-label text-brand-green/80 mb-1">Mon plan</p>
              <p className="text-lg font-display font-medium text-slate-900 drop-shadow-md group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-green transition-all">Nutrition</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card title="Calories Dépensées" icon={Flame} className="col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-4xl font-display font-medium text-slate-900 drop-shadow-md">
                  {(() => {
                    const currentWeekStart = profile.current_week_start || new Date().toISOString().split('T')[0];
                    let weeklyTotal = 0;
                    if (profile.burned_calories_log) {
                      Object.entries(profile.burned_calories_log).forEach(([date, cals]) => {
                        if (date >= currentWeekStart) {
                          weeklyTotal += cals as number;
                        }
                      });
                    }
                    return Math.max(0, getWeeklyExerciseGoal() - weeklyTotal);
                  })()}
                </span>
                <span className="micro-label mt-1 text-slate-500">Kcal restantes à brûler</span>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-sm font-sans font-bold text-slate-900">{getWeeklyExerciseGoal()}</p>
                  <p className="micro-label mt-0.5">Objectif</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <p className="text-sm font-sans font-bold text-brand-teal">{profile.burned_calories_log?.[new Date().toISOString().split('T')[0]] || 0}</p>
                  <p className="micro-label mt-0.5">Aujourd'hui</p>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-teal transition-all duration-1000 shadow-[0_0_10px_rgba(124,6,32,0.8)]"
                    style={{ width: `${Math.min(100, (((() => {
                      const currentWeekStart = profile.current_week_start || new Date().toISOString().split('T')[0];
                      let weeklyTotal = 0;
                      if (profile.burned_calories_log) {
                        Object.entries(profile.burned_calories_log).forEach(([date, cals]) => {
                          if (date >= currentWeekStart) {
                            weeklyTotal += cals;
                          }
                        });
                      }
                      return weeklyTotal;
                    })() / getWeeklyExerciseGoal()) * 100))}%` }}
                  />
                </div>
              </div>
              <button 
                onClick={() => setShowActivityModal(true)}
                className="text-[10px] font-bold text-brand-teal uppercase hover:text-brand-teal/80 transition-colors flex items-center gap-1 bg-brand-teal/10 px-3 py-1.5 rounded-lg border border-brand-teal/20"
              >
                + Activité
              </button>
            </div>
          </Card>

          <Card title="Métabolisme" icon={Utensils} className="col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-4xl font-display font-medium text-slate-900 drop-shadow-md">
                  {(() => {
                    const target = currentDayNutrition?.calories || profile.daily_calorie_goal || metabolism?.target;
                    if (!target) return '---';
                    const consumed = profile.daily_calories_log?.[new Date().toISOString().split('T')[0]] || 0;
                    return Math.max(0, target - consumed);
                  })()}
                </span>
                <span className="micro-label mt-1 text-slate-500">Kcal restantes</span>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-sm font-sans font-bold text-slate-900">{currentDayNutrition?.calories || profile.daily_calorie_goal || metabolism?.target || '---'}</p>
                  <p className="micro-label mt-0.5">Cible</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <p className="text-sm font-sans font-bold text-brand-green">{profile.daily_calories_log?.[new Date().toISOString().split('T')[0]] || 0}</p>
                  <p className="micro-label mt-0.5">Consommé</p>
                </div>
              </div>
            </div>
            {metabolism ? (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="micro-label text-slate-500">
                  Calculé via Mifflin-St Jeor ({profile.primary_goal === 'fat_loss' ? 'Déficit' : profile.primary_goal === 'hypertrophy' ? 'Surplus' : 'Maintenance'}).
                </p>
                <button 
                  onClick={() => setActiveTab('nutrition')}
                  className="text-[10px] font-bold text-brand-green uppercase hover:text-brand-green/80 transition-colors flex items-center gap-1"
                >
                  Plan <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="micro-label text-amber-500">
                  Complétez votre profil pour voir votre métabolisme.
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Récompenses & Badges" icon={Zap}>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map(badge => (
                <BadgeItem 
                  key={badge.id} 
                  badge={badge} 
                  earned={profile.badges?.includes(badge.id) || false} 
                />
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-sans font-bold text-slate-900">Niveau {profile.level || 1}</span>
                <div className="w-24 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-brand-teal shadow-[0_0_10px_rgba(124,6,32,0.8)]" 
                    style={{ width: `${(profile.points || 0) % 100}%` }}
                  />
                </div>
              </div>
              <span className="micro-label">
                {profile.points || 0} Points Total
              </span>
            </div>
          </Card>

          <Card title="Suivi de Progression" icon={LineChart}>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={profile.weight_tracking?.['Poids'] || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    hide 
                  />
                  <YAxis 
                    hide 
                    domain={['dataMin - 2', 'dataMax + 2']} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#00B5B5', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#00B5B5" 
                    strokeWidth={3} 
                    dot={{ fill: '#00B5B5', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="micro-label mb-0.5">Dernière pesée</span>
                <span className="text-xl font-display font-medium text-brand-teal drop-shadow-md">
                  {profile.weight_tracking?.['Poids']?.length 
                    ? `${profile.weight_tracking['Poids'][profile.weight_tracking['Poids'].length - 1].weight} kg`
                    : `${profile.weight || '--'} kg`}
                </span>
              </div>
              <button 
                onClick={() => setActiveTab('progress')}
                className="text-[10px] font-bold text-brand-teal uppercase hover:text-brand-teal/80 transition-colors flex items-center gap-1 bg-brand-teal/10 px-3 py-2 rounded-xl border border-brand-teal/20"
              >
                Courbes <ChevronRight size={14} />
              </button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-white/[0.03] transition-colors">
            <Clock size={24} className="text-brand-teal mb-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-display font-medium text-slate-900">{profile.sleep_hours || '---'}</span>
              <span className="text-xs font-sans text-slate-500">h</span>
            </div>
            <span className="micro-label">Sommeil</span>
          </div>
          
          <div className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-white/[0.03] transition-colors">
            <Activity size={24} className="text-rose-400 mb-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-display font-medium text-slate-900">{bmi || '---'}</span>
            </div>
            {bmi ? (
              <span className={`micro-label ${getBmiCategory(parseFloat(bmi)).color}`}>
                {getBmiCategory(parseFloat(bmi)).label}
              </span>
            ) : (
              <span className="micro-label">IMC</span>
            )}
          </div>
          
          <div className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-white/[0.03] transition-colors">
            <status.icon size={24} className={`${status.color} mb-3 group-hover:scale-110 transition-transform`} strokeWidth={1.5} />
            <div className="flex items-baseline gap-1 mb-1">
              <span className={`text-xl font-display font-medium ${status.color}`}>{status.label}</span>
            </div>
            <span className="micro-label">Santé</span>
          </div>
          
          <div className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-white/[0.03] transition-colors">
            <Zap size={24} className="text-amber-400 mb-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-display font-medium text-slate-900">{profile.days_per_week || '---'}</span>
              <span className="text-xs font-sans text-slate-500">/sem</span>
            </div>
            <span className="micro-label">Jours Cibles</span>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-medium text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-brand-teal/10 rounded-xl border border-brand-teal/20"><LineChart size={20} className="text-brand-teal" /></div>
              Historique des charges
            </h3>
          </div>
          
          {profile.weight_tracking && Object.keys(profile.weight_tracking).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(profile.weight_tracking).slice(0, 3).map(([exerciseName, history]) => {
                if (history.length < 2) return null; // Need at least 2 points to show a trend
                
                // Format data for Recharts
                const chartData = history.map(entry => ({
                  date: new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                  weight: entry.weight
                }));
                
                return (
                  <div key={exerciseName} className="space-y-3">
                    <h4 className="text-sm font-sans font-medium text-slate-600">{exerciseName}</h4>
                    <div className="h-32 w-full bg-white/30 rounded-2xl p-2 border border-slate-100">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ color: '#00B5B5', fontWeight: 'bold' }}
                          />
                          <Line type="monotone" dataKey="weight" stroke="#00B5B5" strokeWidth={3} dot={{ r: 4, fill: '#00B5B5', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
              {Object.values(profile.weight_tracking).every(h => h.length < 2) && (
                <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-slate-100">
                  <Dumbbell size={32} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500">Continuez à enregistrer vos charges pour voir votre progression !</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-slate-100">
              <Dumbbell size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">Enregistrez vos charges pendant vos séances pour voir votre évolution ici.</p>
            </div>
          )}
        </div>

        {currentDayNutrition && (
          <Card title="Nutrition du jour" icon={Utensils}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display font-medium text-slate-900 mb-2">{currentDayNutrition.calories || '---'} kcal</p>
                <div className="flex gap-2 text-[10px] font-sans font-bold">
                  <span className="text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2 py-1 rounded-md">P: {currentDayNutrition.macros?.p || 0}g</span>
                  <span className="text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1 rounded-md">G: {currentDayNutrition.macros?.c || 0}g</span>
                  <span className="text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-1 rounded-md">L: {currentDayNutrition.macros?.l || 0}g</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('nutrition')}
                className="px-5 py-2.5 bg-brand-green/10 text-brand-green rounded-xl hover:bg-brand-green/20 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-brand-green/20"
              >
                Voir Menu <ChevronRight size={14} />
              </button>
            </div>
          </Card>
        )}

        <Card title="Plan Actuel" icon={Target} className="mt-8">
          {(workoutPlan || nutritionPlan) ? (
            <div className="space-y-4">
              {workoutPlan && (
                <div 
                  onClick={() => setActiveTab('workout')}
                  className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                      <Dumbbell size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-base font-display font-medium text-slate-900">
                        {currentDayWorkout?.focus || "Séance du jour"}
                      </p>
                      <p className="micro-label mt-1 text-slate-500">
                        {currentDayWorkout?.is_rest_day 
                          ? "Repos & Récupération" 
                          : `${workoutExercises.length} exercices • ${progressPercentage}% complété`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                </div>
              )}

              {nutritionPlan && (
                <div 
                  onClick={() => setActiveTab('nutrition')}
                  className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                      <Utensils size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-base font-display font-medium text-slate-900">
                        Nutrition du jour
                      </p>
                      <p className="micro-label mt-1 text-slate-500">
                        {currentDayNutrition?.calories || metabolism?.target || '---'} kcal • {currentDayNutrition?.menu?.length || 0} repas
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </div>
              )}
              
              {workoutPlan && !currentDayWorkout?.is_rest_day && progressPercentage > 0 && (
                <div className="mt-4 px-2">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      className="h-full bg-brand-teal shadow-[0_0_10px_rgba(124,6,32,0.8)]"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="micro-label text-slate-500 mb-5">Aucun plan généré pour le moment.</p>
              <button 
                onClick={() => setActiveTab('profile')}
                className="btn-premium px-8 py-3 w-auto mx-auto text-sm"
              >
                Compléter mon profil
              </button>
            </div>
          )}
        </Card>

        {(currentDayWorkout?.safety_alerts?.length || 0) > 0 || profile.current_injuries ? (
          <Card title="Alertes Santé" icon={AlertTriangle} className="border-amber-500/20 bg-amber-500/5">
            <div className="space-y-2">
              {currentDayWorkout?.safety_alerts?.map((alert: string, i: number) => (
                <p key={i} className="text-xs text-amber-200/70 leading-relaxed flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {alert}
                </p>
              ))}
              {profile.current_injuries && !currentDayWorkout?.safety_alerts?.length && (
                <p className="text-xs text-amber-200/70 leading-relaxed">
                  Rappel : {profile.current_injuries}
                </p>
              )}
            </div>
          </Card>
        ) : null}

        <div className="mt-8 mb-4">
          <h3 className="text-2xl font-display font-medium text-slate-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-brand-teal/10 rounded-xl border border-brand-teal/20"><Activity size={24} className="text-brand-teal" /></div>
            Bilan de la Semaine
          </h3>
          <div className="glass-panel p-6 rounded-3xl h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="consomme" name="Nutrition (kcal)" fill="var(--color-brand-green)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="depense" name="Entraînement (kcal)" fill="var(--color-brand-teal)" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    );
  };

  const renderProgress = () => {
    const weightData = profile.weight_tracking?.['Poids'] || [];
    
    return (
      <div className="space-y-6 pb-32">
        <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=2940&auto=format&fit=crop" 
            alt="Progress Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Ma Progression</h2>
              <p className="text-slate-600 text-sm font-medium">Visualisez vos efforts et vos résultats.</p>
            </div>
            <button 
              onClick={() => setShowWeightModal(true)}
              className="p-4 bg-brand-teal/20 backdrop-blur-md border border-brand-teal/30 rounded-2xl text-brand-teal hover:bg-brand-teal/30 transition-all shadow-[0_0_20px_rgba(0,181,181,0.2)]"
            >
              <Scale size={24} />
            </button>
          </div>
        </header>

        {showWeightModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">Ajuster mon poids</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 uppercase font-bold">Nouveau poids (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 text-2xl font-bold focus:border-brand-teal outline-none"
                    placeholder={profile.weight?.toString() || "75.0"}
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowWeightModal(false)}
                    className="flex-1 py-3 bg-slate-800 text-slate-900 rounded-xl font-bold hover:bg-slate-700 transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={() => {
                      const w = parseFloat(weightInput);
                      if (!isNaN(w)) {
                        logWeight('Poids', w);
                        setShowWeightModal(false);
                        setWeightInput('');
                      }
                    }}
                    className="flex-1 py-3 bg-brand-teal text-slate-950 rounded-xl font-bold hover:bg-brand-teal/80 transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Évolution du Poids" icon={LineChart}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    domain={['dataMin - 5', 'dataMax + 5']} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#00B5B5', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#00B5B5" 
                    strokeWidth={4} 
                    dot={{ fill: '#00B5B5', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex gap-4">
              <div className="flex-1 p-4 bg-slate-800/50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Départ</p>
                <p className="text-xl font-black text-slate-900">{weightData[0]?.weight || profile.weight || '--'} kg</p>
              </div>
              <div className="flex-1 p-4 bg-brand-teal/10 rounded-2xl border border-brand-teal/20">
                <p className="text-[10px] text-brand-teal uppercase font-bold mb-1">Actuel</p>
                <p className="text-xl font-black text-brand-teal">{weightData[weightData.length - 1]?.weight || profile.weight || '--'} kg</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setWeightInput((weightData[weightData.length - 1]?.weight || profile.weight || '').toString());
                setShowWeightModal(true);
              }}
              className="mt-4 w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-brand-teal font-bold rounded-xl border border-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <Scale size={18} />
              Ajuster le poids
            </button>
          </Card>

          <Card title="Photos de Progression" icon={Camera}>
            <div className="mb-4 flex gap-2">
              {(['front', 'side', 'back'] as const).map(angle => (
                <button
                  key={angle}
                  onClick={() => setPhotoAngle(angle)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                    photoAngle === angle 
                      ? 'bg-brand-teal border-brand-teal text-slate-950' 
                      : 'bg-white/80 border-slate-200 text-slate-500'
                  }`}
                >
                  {angle === 'front' ? 'Devant' : angle === 'side' ? 'Profil' : 'Dos'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {profile.progress_photos?.map((photo, i) => (
                <ProgressPhotoCard 
                  key={i} 
                  photo={photo} 
                  onDelete={async () => {
                    const updatedPhotos = profile.progress_photos?.filter((_, idx) => idx !== i);
                    await setDoc(doc(db, 'users', user!.uid), { progress_photos: updatedPhotos }, { merge: true });
                    setProfile(prev => ({ ...prev, progress_photos: updatedPhotos }));
                  }} 
                />
              ))}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-teal/30 hover:bg-brand-teal/5 transition-all aspect-[3/4]"
              >
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Ajouter {photoAngle === 'front' ? 'Devant' : photoAngle === 'side' ? 'Profil' : 'Dos'}</span>
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && user) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    try {
                      const base64 = reader.result as string;
                      const compressed = await compressImage(base64);
                      const newPhoto = {
                        date: new Date().toLocaleDateString('fr-FR'),
                        url: compressed,
                        type: photoAngle
                      };
                      const updatedPhotos = [...(profile.progress_photos || []), newPhoto];
                      await setDoc(doc(db, 'users', user.uid), { progress_photos: updatedPhotos }, { merge: true });
                      setProfile(prev => ({ ...prev, progress_photos: updatedPhotos }));
                      showSuccessMsg("Photo ajoutée !");
                    } catch (err) {
                      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
                      setError("Erreur lors du traitement de la photo. Elle est peut-être trop volumineuse.");
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </Card>
        </div>
      </div>
    );
  };

  const renderQuestionnaire = () => {
    return (
      <div className="space-y-8 pb-32">
        <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2940&auto=format&fit=crop" 
            alt="Profile Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Profil & Forfaits</h2>
              <p className="text-slate-600 text-sm font-medium">Gérez votre abonnement et vos données.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-slate-900 hover:bg-white/20 transition-all"
                title="Exporter en PDF"
              >
                <FileText size={20} />
              </button>
              <button 
                onClick={() => {
                  // Simple theme toggle logic (could be expanded)
                  document.documentElement.classList.toggle('dark');
                  showSuccessMsg("Mode sombre activé !");
                }}
                className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-slate-900 hover:bg-white/20 transition-all"
                title="Changer le thème"
              >
                <Moon size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Mon Forfait</h3>
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-sm font-bold text-slate-900 capitalize">
                  {packages.find(p => p.id === profile.subscription_tier)?.name || profile.subscription_tier || 'Gratuit'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Statut : <span className={profile.subscription_status === 'active' ? 'text-green-500' : 'text-slate-500'}>
                    {profile.subscription_status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => setShowPricing(true)}
                className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold rounded-xl text-xs hover:bg-rose-500 hover:text-slate-950 transition-colors"
              >
                Gérer
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Profil détaillé</h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 uppercase">Nom complet <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                      placeholder="Ex: Jean Dupont"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 uppercase">Sexe</label>
                    <div className="flex gap-2">
                      {['male', 'female'].map((g) => (
                        <button
                          key={g}
                          onClick={() => setProfile({...profile, gender: g as 'male' | 'female'})}
                          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                            profile.gender === g 
                              ? 'bg-rose-500 border-rose-500 text-slate-950 shadow-lg shadow-rose-500/20' 
                              : 'bg-white/80 backdrop-blur-md border-slate-200 text-slate-500 hover:border-white/20 hover:bg-slate-800/50'
                          }`}
                        >
                          {g === 'male' ? 'Homme' : 'Femme'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Âge</label>
                      <input 
                        type="number" 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        placeholder="25"
                        value={profile.age || ''}
                        onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Taille (cm)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        placeholder="175"
                        value={profile.height || ''}
                        onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Poids (kg)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        placeholder="75"
                        value={profile.weight || ''}
                        onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <section>
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Nutrition & Alimentation</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Type de programme alimentaire</label>
                      <select 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        value={profile.dietary_preference || 'standard'}
                        onChange={(e) => setProfile({...profile, dietary_preference: e.target.value})}
                      >
                        <option value="standard">Standard (Équilibré)</option>
                        <option value="keto">Keto (Cétogène)</option>
                        <option value="vegetarien">Végétarien</option>
                        <option value="vegan">Vegan</option>
                        <option value="paleo">Paléo</option>
                        <option value="sans_gluten">Sans Gluten</option>
                        <option value="jeune_intermittent">Jeûne Intermittent</option>
                      </select>
                    </div>
                    {profile.dietary_preference === 'jeune_intermittent' && (
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase">Période de jeûne (heures)</label>
                        <select 
                          className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                          value={profile.fasting_duration || 16}
                          onChange={(e) => setProfile({...profile, fasting_duration: parseInt(e.target.value)})}
                        >
                          <option value={8}>8 heures</option>
                          <option value={10}>10 heures</option>
                          <option value={12}>12 heures</option>
                          <option value={14}>14 heures</option>
                          <option value={16}>16 heures</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Allergies ou intolérances alimentaires</label>
                      <textarea 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none min-h-[80px]"
                        placeholder="Ex: Arachides, lactose, gluten..."
                        value={profile.food_allergies || ''}
                        onChange={(e) => setProfile({...profile, food_allergies: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Aliments que vous aimez particulièrement</label>
                      <textarea 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none min-h-[80px]"
                        placeholder="Ex: Poulet, saumon, avocat, riz..."
                        value={profile.liked_foods || ''}
                        onChange={(e) => setProfile({...profile, liked_foods: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Aliments que vous détestez</label>
                      <textarea 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none min-h-[80px]"
                        placeholder="Ex: Brocoli, poisson, champignons..."
                        value={profile.disliked_foods || ''}
                        onChange={(e) => setProfile({...profile, disliked_foods: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase">Nombre de repas par jour</label>
                        <select 
                          className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                          value={profile.meals_per_day || ''}
                          onChange={(e) => setProfile({...profile, meals_per_day: parseInt(e.target.value)})}
                        >
                          <option value="">Sélectionner...</option>
                          <option value={2}>2 repas</option>
                          <option value={3}>3 repas</option>
                          <option value={4}>4 repas</option>
                          <option value={5}>5 repas</option>
                          <option value={6}>6 repas</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase">Temps dispo. pour cuisiner/jour</label>
                        <select 
                          className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                          value={profile.cooking_time_available || ''}
                          onChange={(e) => setProfile({...profile, cooking_time_available: e.target.value})}
                        >
                          <option value="">Sélectionner...</option>
                          <option value="minimal">Moins de 30 min (repas rapides)</option>
                          <option value="moderate">30 à 60 min</option>
                          <option value="high">Plus de 60 min</option>
                          <option value="meal_prep">Je fais du meal prep (le week-end)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Informations Professionnelles</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Bannière de pharmacie <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        placeholder="Ex: Jean Coutu, Pharmaprix, Familiprix..."
                        value={profile.pharmacy_banner || ''}
                        onChange={(e) => setProfile({...profile, pharmacy_banner: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Nom du propriétaire <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        placeholder="Ex: Pharmacie Tremblay & Côté"
                        value={profile.pharmacy_owner || ''}
                        onChange={(e) => setProfile({...profile, pharmacy_owner: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Expertise & Mode de vie</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Niveau d'expertise</label>
                      <select 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        value={profile.experience_level || ''}
                        onChange={(e) => setProfile({...profile, experience_level: e.target.value})}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="never">Jamais rien fait</option>
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                        <option value="professional">Professionnel</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Niveau d'activité (hors sport)</label>
                      <select 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        value={profile.activity_level_non_gym || ''}
                        onChange={(e) => setProfile({...profile, activity_level_non_gym: e.target.value})}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="sedentary">Sédentaire (Travail de bureau, peu de marche)</option>
                        <option value="light">Légèrement actif (Debout occasionnellement, marche légère)</option>
                        <option value="moderate">Modérément actif (Travail physique léger, marche régulière)</option>
                        <option value="very_active">Très actif (Travail très physique, construction, etc.)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Exercices favoris</label>
                      <textarea 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none h-20"
                        placeholder="Ex: Squat, développé couché, course à pied..."
                        value={profile.favorite_exercises || ''}
                        onChange={(e) => setProfile({...profile, favorite_exercises: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Exercices détestés</label>
                      <textarea 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none h-20"
                        placeholder="Ex: Burpees, fentes, tractions..."
                        value={profile.disliked_exercises || ''}
                        onChange={(e) => setProfile({...profile, disliked_exercises: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Santé & Biomécanique</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Blessures actuelles ou passées</label>
                      <textarea 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none h-24"
                        placeholder="Ex: Déchirure LCA genou gauche (2022), Tendinite épaule..."
                        value={profile.current_injuries || ''}
                        onChange={(e) => setProfile({...profile, current_injuries: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Conditions médicales / Médicaments</label>
                      <textarea 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none h-24"
                        placeholder="Ex: Asthme, Anticoagulants..."
                        value={profile.medical_conditions || ''}
                        onChange={(e) => setProfile({...profile, medical_conditions: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Objectifs & Durée</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Objectif Principal (Corporel)</label>
                      <select 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        value={profile.primary_goal || ''}
                        onChange={(e) => setProfile({...profile, primary_goal: e.target.value})}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="rehab">Réhabilitation</option>
                        <option value="hyrox">Hyrox</option>
                        <option value="crossfit">CrossFit</option>
                        <option value="powerlifting">Powerlifting / Force Athlétique</option>
                        <option value="weightlifting">Haltérophilie</option>
                        <option value="hypertrophy">Hypertrophie (Prise de Masse)</option>
                        <option value="fat_loss">Perte de gras</option>
                        <option value="strength">Force pure</option>
                        <option value="endurance">Endurance (Général)</option>
                        <option value="marathon">Marathon</option>
                        <option value="semi_marathon">Semi-Marathon</option>
                        <option value="10k">10 km</option>
                        <option value="triathlon">Triathlon</option>
                        <option value="ironman">Ironman / Demi-Ironman</option>
                        <option value="fitness_bodybuilding">Fitness (Compétition Culturisme)</option>
                        <option value="mobility">Amélioration de la mobilité / Souplesse</option>
                        <option value="longevity">Longévité et Santé Générale</option>
                      </select>
                    </div>
                    {['marathon', 'semi_marathon', 'triathlon', '10k', 'ironman', 'hyrox'].includes(profile.primary_goal || '') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-slate-500 uppercase">Date de l'événement</label>
                          <input 
                            type="date" 
                            className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                            value={profile.event_date || ''}
                            onChange={(e) => setProfile({...profile, event_date: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-slate-500 uppercase">Objectif de temps</label>
                          <input 
                            type="text" 
                            className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                            placeholder="Ex: - de 1h40"
                            value={profile.target_time || ''}
                            onChange={(e) => setProfile({...profile, target_time: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Durée du plan</label>
                      <select 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        value={profile.timeline || ''}
                        onChange={(e) => setProfile({...profile, timeline: e.target.value})}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="1_month">1 mois</option>
                        <option value="2_months">2 mois</option>
                        <option value="3_months">3 mois</option>
                        <option value="4_months">4 mois</option>
                        <option value="5_months">5 mois</option>
                        <option value="6_months">6 mois</option>
                        <option value="7_months">7 mois</option>
                        <option value="8_months">8 mois</option>
                        <option value="9_months">9 mois</option>
                        <option value="10_months">10 mois</option>
                        <option value="11_months">11 mois</option>
                        <option value="12_months">12 mois</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Logistique & Équipement</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Lieu d'entraînement</label>
                      <select 
                        className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                        value={profile.training_location || ''}
                        onChange={(e) => setProfile({...profile, training_location: e.target.value})}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Gym">Gym Commercial</option>
                        <option value="Home">Domicile</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase">Jours / semaine</label>
                        <input 
                          type="number" 
                          className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                          placeholder="3"
                          value={profile.days_per_week || ''}
                          onChange={(e) => setProfile({...profile, days_per_week: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase">Durée max (min)</label>
                        <input 
                          type="number" 
                          className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none"
                          placeholder="60"
                          value={profile.max_duration_minutes || ''}
                          onChange={(e) => setProfile({...profile, max_duration_minutes: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <button 
                  onClick={async () => {
                    try {
                      if (!profile.name?.trim()) {
                        setError("Veuillez renseigner votre nom complet.");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }

                      if (!profile.pharmacy_banner?.trim() || !profile.pharmacy_owner?.trim()) {
                        setError("Veuillez renseigner la bannière de pharmacie et le nom du propriétaire.");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }

                      setSaving(true);
                      
                      // Sanitize profile data to remove undefined and NaN values
                      const sanitizedProfile: any = {};
                      Object.entries(profile).forEach(([key, value]) => {
                        if (value !== undefined && !(typeof value === 'number' && isNaN(value))) {
                          sanitizedProfile[key] = value;
                        }
                      });

                      await setDoc(doc(db, 'users', user.uid), {
                        ...sanitizedProfile,
                        updated_at: new Date().toISOString()
                      }, { merge: true });
                      
                      setShowSuccess(true);
                      setTimeout(() => setShowSuccess(false), 3000);
                    } catch (e) {
                      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
                      setError("Erreur lors de l'enregistrement du profil.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="w-full py-4 bg-rose-500 text-slate-950 font-bold rounded-2xl hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Activity className="animate-spin" size={20} /> : 'Enregistrer mon profil'}
                </button>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => resetPassword(user.email!)}
                    className="py-3 bg-white/80 backdrop-blur-md text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-800/60 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Zap size={14} />
                    Réinitialiser MDP
                  </button>
                  <button 
                    onClick={() => signOut(auth)}
                    className="py-3 bg-red-500/10 backdrop-blur-md text-red-500 rounded-xl font-bold text-xs uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              </div>
          </section>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-6 right-6 bg-rose-500 text-slate-950 p-4 rounded-xl font-bold text-center shadow-xl z-50"
            >
              Profil mis à jour avec succès !
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= numDays; i++) {
      days.push(i);
    }

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const getPlansForDay = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return allPlans.filter(p => p.created_at.startsWith(dateStr));
    };

    const getWeeklyPlanForDay = (day: number) => {
      if (workoutPlan && workoutPlan.content && workoutPlan.content.weekly_plan) {
        const date = new Date(year, month, day);
        const dayOfWeek = (date.getDay() + 6) % 7;
        return { plan: workoutPlan, dayPlan: workoutPlan.content.weekly_plan[dayOfWeek], index: dayOfWeek };
      }
      return null;
    };

    const getWeeklyNutritionForDay = (day: number) => {
      if (nutritionPlan && nutritionPlan.content && nutritionPlan.content.weekly_nutrition) {
        const date = new Date(year, month, day);
        const dayOfWeek = (date.getDay() + 6) % 7;
        return { plan: nutritionPlan, dayPlan: nutritionPlan.content.weekly_nutrition[dayOfWeek], index: dayOfWeek };
      }
      return null;
    };

    return (
      <div className="space-y-6 pb-20">
        <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1506784951209-243a100186cb?q=80&w=2940&auto=format&fit=crop" 
            alt="Calendar Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Calendrier</h2>
              <p className="text-slate-600 text-sm font-medium">Historique de vos plans.</p>
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <button 
                onClick={() => setCurrentMonth(new Date(year, month - 1))}
                className="p-3 bg-white/10 backdrop-blur-md border border-slate-200 rounded-xl text-slate-900 hover:bg-white/20 transition-all shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date(year, month + 1))}
                className="p-3 bg-white/10 backdrop-blur-md border border-slate-200 rounded-xl text-slate-900 hover:bg-white/20 transition-all shadow-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">{monthNames[month]} {year}</h3>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['D', 'L', 'M1', 'M2', 'J', 'V', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-center text-[10px] font-bold text-slate-600 uppercase">
                {d.replace(/\d/g, '')}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
              
              const dayPlans = getPlansForDay(day);
              const weeklyData = getWeeklyPlanForDay(day);
              const weeklyNutriData = getWeeklyNutritionForDay(day);
              
              const weeklyDay = weeklyData?.dayPlan;
              const weeklyNutri = weeklyNutriData?.dayPlan;
              
              const hasWorkout = dayPlans.some(p => p.type === 'workout') || weeklyDay;
              const hasNutrition = dayPlans.some(p => p.type === 'nutrition') || weeklyNutri;
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

              return (
                <div 
                  key={day} 
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 relative transition-all
                    ${isToday ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-slate-200 bg-white/80 backdrop-blur-md'}
                    ${(dayPlans.length > 0 || weeklyDay || weeklyNutri) ? 'cursor-pointer hover:bg-slate-800' : ''}
                  `}
                  onClick={() => {
                    if (dayPlans.length > 0 || weeklyDay || weeklyNutri) {
                      const workout = dayPlans.find(p => p.type === 'workout');
                      const nutrition = dayPlans.find(p => p.type === 'nutrition');
                      
                      if (workout) {
                        setWorkoutPlan(workout);
                        if (workout.content.weekly_plan) {
                          const date = new Date(year, month, day);
                          const dayOfWeek = (date.getDay() + 6) % 7;
                          setSelectedDayIndex(dayOfWeek);
                        }
                        setActiveTab('workout');
                      } else if (weeklyData) {
                        setWorkoutPlan(weeklyData.plan);
                        setSelectedDayIndex(weeklyData.index);
                        setActiveTab('workout');
                      } else if (nutrition) {
                        const content = nutrition.content;
                        setNutritionPlan({ content });
                        if (content.weekly_nutrition) {
                          const date = new Date(year, month, day);
                          const dayOfWeek = (date.getDay() + 6) % 7;
                          setSelectedNutritionDayIndex(dayOfWeek);
                        }
                        setActiveTab('nutrition');
                      } else if (weeklyNutriData) {
                        const content = weeklyNutriData.plan.content;
                        setNutritionPlan({ content });
                        setSelectedNutritionDayIndex(weeklyNutriData.index);
                        setActiveTab('nutrition');
                      }
                    }
                  }}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-rose-500' : 'text-slate-500'}`}>{day}</span>
                  {weeklyDay && !weeklyDay.is_rest_day && (
                    <div className="text-[8px] text-rose-500/60 font-bold truncate w-full text-center px-1">
                      {weeklyDay.focus}
                    </div>
                  )}
                  <div className="flex gap-0.5">
                    {hasWorkout && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                    {hasNutrition && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Légende</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs text-slate-500">Entraînement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-500">Nutrition</span>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cette Semaine</h3>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4, 5, 6].map(offset => {
              const today = new Date();
              const dayOfWeek = (today.getDay() + 6) % 7;
              const date = new Date(today);
              date.setDate(today.getDate() - dayOfWeek + offset);
              
              const d = date.getDate();
              const m = date.getMonth();
              const y = date.getFullYear();
              
              const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dayPlans = allPlans.filter(p => p.created_at.startsWith(dateStr));
              
              // Find global weekly plans
              const workoutPlanRaw = [...allPlans]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .find(p => p.type === 'workout' && p.content.weekly_plan);
              
              const nutritionPlanGlobalRaw = [...allPlans]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .find(p => p.type === 'nutrition' && p.content.weekly_nutrition);

              const workoutPlanContent = workoutPlanRaw ? workoutPlanRaw.content : null;
              const nutritionPlanGlobalContent = nutritionPlanGlobalRaw ? nutritionPlanGlobalRaw.content : null;

              const weeklyDay = workoutPlanContent?.weekly_plan ? workoutPlanContent.weekly_plan[offset] : null;
              const weeklyNutri = nutritionPlanGlobalContent?.weekly_nutrition ? nutritionPlanGlobalContent.weekly_nutrition[offset] : null;
              
              const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

              return (
                <motion.div 
                  key={offset} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (workoutPlanRaw) {
                      setWorkoutPlan(workoutPlanRaw);
                      setSelectedDayIndex(offset);
                      setActiveTab('workout');
                    } else if (nutritionPlanGlobalRaw) {
                      setNutritionPlan(nutritionPlanGlobalRaw);
                      setSelectedNutritionDayIndex(offset);
                      setActiveTab('nutrition');
                    }
                  }}
                  className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center w-8">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{dayNames[offset]}</p>
                      <p className="text-sm font-bold text-slate-900">{d}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {weeklyDay ? (weeklyDay.is_rest_day ? "Repos" : weeklyDay.focus) : "Pas de plan"}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {(dayPlans.some(p => p.type === 'workout') || weeklyDay) && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        {(dayPlans.some(p => p.type === 'nutrition') || weeklyNutri) && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-700" />
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

  const renderNutrition = () => {
    let currentDayNutri = null;
    let weeklyNutrition = null;
    
    if (nutritionPlan) {
      const content = nutritionPlan.content;
      weeklyNutrition = content?.weekly_nutrition;
      currentDayNutri = weeklyNutrition ? weeklyNutrition[selectedNutritionDayIndex] : null;
    }

    return (
      <div className="space-y-6 pb-20">
        <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2940&auto=format&fit=crop" 
            alt="Nutrition Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-white mb-2">Nutrition</h2>
              <p className="text-slate-200 text-sm font-medium">Votre plan alimentaire hebdomadaire.</p>
            </div>
            <div className="flex gap-3">
              {nutritionPlan?.content?.weekly_nutrition && (
                <button 
                  onClick={downloadNutritionPlan}
                  className="relative z-10 p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                  title="Télécharger le plan de nutrition (PDF)"
                >
                  <Download size={24} />
                </button>
              )}
              {nutritionPlan?.content?.grocery_list && (
                <>
                  <button 
                    onClick={downloadGroceryList}
                    className="relative z-10 p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                    title="Télécharger la liste d'épicerie (PDF)"
                  >
                    <Download size={24} />
                  </button>
                  <button 
                    onClick={() => setShowGroceryModal(true)}
                    className="relative z-10 p-4 bg-brand-green/20 backdrop-blur-md border border-brand-green/30 rounded-2xl text-white hover:bg-brand-green/30 transition-all shadow-[0_0_20px_rgba(225,29,72,0.2)]"
                    title="Voir la liste d'épicerie"
                  >
                    <ShoppingCart size={24} />
                  </button>
                </>
              )}
              <button 
                onClick={() => handleGenerate('nutrition')}
                disabled={loading}
                className="relative z-10 p-4 bg-orange-500/20 backdrop-blur-md border border-orange-500/30 rounded-2xl text-orange-400 hover:bg-orange-500/30 hover:text-orange-300 transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] disabled:opacity-50"
              >
                {loading ? <Activity className="animate-spin" /> : <Utensils size={24} />}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Fasting Tracker */}
        {profile.dietary_preference === 'jeune_intermittent' && (
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-rose-500" size={18} />
                Suivi du Jeûne ({profile.fasting_duration}h)
              </h3>
              {profile.is_fasting ? (
                <button 
                  onClick={handleFastingEnd}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-2"
                >
                  <Square size={14} />
                  Terminer
                </button>
              ) : (
                <button 
                  onClick={handleFastingStart}
                  className="px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-all flex items-center gap-2"
                >
                  <Play size={14} />
                  Commencer
                </button>
              )}
            </div>
            
            {profile.is_fasting && (
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Progression</span>
                  <span className="text-rose-400">{fastingTimeLeft} restants</span>
                </div>
                <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${fastingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meal Scan */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="text-purple-500" size={18} />
              Scanner un repas
            </h3>
          </div>
          
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500/50 transition-all bg-slate-50/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              {mealImage ? (
                <img src={mealImage} alt="Meal" className="max-h-48 rounded-lg object-cover mb-4" />
              ) : (
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                  <Camera size={24} className="text-purple-400" />
                </div>
              )}
              <p className="text-sm font-medium text-slate-600">
                {mealImage ? 'Changer la photo' : 'Prenez une photo de votre repas'}
              </p>
              <p className="text-xs text-slate-500 mt-2">L'IA analysera les calories et macros</p>
            </div>
            
            {mealImage && (
              <button 
                onClick={handleMealScan}
                disabled={isScanningMeal}
                className="w-full py-3 bg-purple-500 text-slate-900 rounded-xl font-bold hover:bg-purple-600 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
              >
                {isScanningMeal ? <Activity className="animate-spin" size={18} /> : <Utensils size={18} />}
                {isScanningMeal ? 'Analyse en cours...' : 'Analyser le repas'}
              </button>
            )}

            {mealAnalysis && (
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Résultat de l'analyse</h4>
                <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {mealAnalysis}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="text-orange-500" size={18} />
              Suivi des calories
            </h3>
            <span className="text-xs font-bold text-slate-500 capitalize">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Qu'avez-vous mangé ?</label>
              <input 
                type="text" 
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-orange-500 outline-none text-sm"
                placeholder="Ex: Une pomme et un sandwich au poulet"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && calculateAndLogFood()}
              />
            </div>
            <button 
              onClick={calculateAndLogFood}
              disabled={!foodInput || isCalculatingCalories}
              className="h-[46px] px-6 bg-orange-500 text-slate-950 rounded-xl font-bold text-sm hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
              {isCalculatingCalories ? <Activity className="animate-spin" size={20} /> : 'Calculer'}
            </button>
          </div>
          
          {profile.daily_calories_log?.[new Date().toISOString().split('T')[0]] !== undefined && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-400 font-medium">Total consommé</span>
                  <span className="text-sm font-bold text-orange-500">{profile.daily_calories_log[new Date().toISOString().split('T')[0]]} kcal</span>
                </div>
                {(() => {
                  const metabolism = calculateMetabolism();
                  const target = currentDayNutri?.calories || profile.daily_calorie_goal || metabolism?.target;
                  if (!target) return null;
                  const consumed = profile.daily_calories_log[new Date().toISOString().split('T')[0]];
                  return (
                    <>
                      <div className="w-full bg-white rounded-full h-2 mt-1">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, (consumed / target) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-500">Objectif: {target} kcal</span>
                        <span className="text-[10px] font-bold text-slate-900">
                          Reste: {Math.max(0, target - consumed)} kcal
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {profile.daily_food_entries?.[new Date().toISOString().split('T')[0]]?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-500 uppercase font-bold">Aliments ajoutés aujourd'hui</h4>
                  <div className="space-y-2">
                    {profile.daily_food_entries[new Date().toISOString().split('T')[0]].map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <span className="text-sm text-slate-900">{entry.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-orange-400">{entry.calories} kcal</span>
                          <button 
                            onClick={() => removeFoodEntry(new Date().toISOString().split('T')[0], entry.id, entry.calories)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {weeklyNutrition && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {weeklyNutrition.map((day: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedNutritionDayIndex(i)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border
                  ${selectedNutritionDayIndex === i 
                    ? 'bg-orange-500 text-slate-950 border-orange-500' 
                    : 'bg-white/80 backdrop-blur-md text-slate-500 border-slate-100 hover:border-slate-200'}
                `}
              >
                {day.day}
              </button>
            ))}
          </div>
        )}

        {currentDayNutri ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-3 sm:p-4 rounded-2xl text-center shadow-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Calories</p>
                <p className="text-base sm:text-lg font-bold text-slate-900">{currentDayNutri.calories || '---'}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-3 sm:p-4 rounded-2xl text-center shadow-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Macros</p>
                <div className="flex flex-wrap sm:flex-nowrap justify-center gap-1 sm:gap-2 text-[10px] font-bold">
                  <span className="text-rose-500">P:{currentDayNutri.macros?.p || 0}</span>
                  <span className="text-orange-500">G:{currentDayNutri.macros?.c || 0}</span>
                  <span className="text-brand-green">L:{currentDayNutri.macros?.l || 0}</span>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/80 backdrop-blur-md border border-slate-200 p-3 sm:p-4 rounded-2xl text-center shadow-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Jour</p>
                <p className="text-sm sm:text-lg font-bold text-slate-900 truncate" title={currentDayNutri.day || '---'}>{currentDayNutri.day || '---'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Menu du jour</h3>
              {currentDayNutri.menu?.map((m: any, i: number) => {
                let imageUrl = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400&auto=format&fit=crop";
                const mealName = m.meal?.toLowerCase() || '';
                if (mealName.includes('petit-déjeuner') || mealName.includes('matin')) {
                  imageUrl = "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=80&w=400&auto=format&fit=crop";
                } else if (mealName.includes('déjeuner') || mealName.includes('midi')) {
                  imageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop";
                } else if (mealName.includes('dîner') || mealName.includes('soir')) {
                  imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
                } else if (mealName.includes('collation') || mealName.includes('snack')) {
                  imageUrl = "https://images.unsplash.com/photo-1559561853-08451507cbe7?q=80&w=400&auto=format&fit=crop";
                }

                return (
                <div key={i} className="glass-panel rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
                  <div className="h-32 w-full relative">
                    <img src={imageUrl} alt={m.meal} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    <h4 className="absolute bottom-3 left-4 text-base font-bold text-white flex items-center gap-2 drop-shadow-md">
                      <CheckCircle2 size={16} className="text-orange-400" />
                      {m.meal}
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {m.description && (
                      <p className="text-[10px] text-slate-500 italic leading-relaxed">
                        {m.description}
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {m.foods?.map((food: string, j: number) => (
                        <li key={j} className="text-xs text-slate-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )})}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Utensils size={32} className="text-slate-700" />
            </div>
            <p className="text-slate-500 text-sm max-w-[200px]">Cliquez sur l'icône de couverts pour générer votre plan nutritionnel hebdomadaire.</p>
          </div>
        )}
      </div>
    );
  };



  useEffect(() => {
    if (workoutPlan?.created_at) {
      const createdDate = new Date(workoutPlan.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      setSelectedCycleWeek((diffWeeks % 4) + 1);
    }
  }, [workoutPlan?.created_at]);

  const adjustWorkoutDayForCycle = (dayPlan: any, cycleWeek: number) => {
    if (!dayPlan || !dayPlan.workout) return dayPlan;
    const adjustedPlan = JSON.parse(JSON.stringify(dayPlan));
    
    adjustedPlan.workout = adjustedPlan.workout.map((ex: any) => {
      let sets = Number(ex.sets) || 0;
      
      if (cycleWeek === 1) {
        // Préparation : Base
      } else if (cycleWeek === 2) {
        // Croissance : +1 set
        sets += 1;
      } else if (cycleWeek === 3) {
        // Peak : +2 sets
        sets += 2;
      } else if (cycleWeek === 4) {
        // Relax : -1 set (min 1)
        sets = Math.max(1, sets - 1);
      }
      
      ex.sets = sets;
      return ex;
    });
    
    return adjustedPlan;
  };

  const renderFutureCalendar = () => {
    if (!workoutPlan || !workoutPlan.created_at) return null;
    
    const startDate = new Date(workoutPlan.created_at);
    startDate.setHours(0,0,0,0);
    
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const diffTimeTotal = now.getTime() - startDate.getTime();
    const diffDaysTotal = Math.floor(diffTimeTotal / (1000 * 60 * 60 * 24));
    const currentCycle = Math.max(0, Math.floor(diffDaysTotal / 28));
    
    const cycleStartDate = new Date(startDate);
    cycleStartDate.setDate(startDate.getDate() + (currentCycle * 28));
    
    // Generate 28 days for the current 4-week cycle
    const days = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(cycleStartDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const getCycleWeek = (diffDays: number) => {
      const diffWeeks = Math.floor(diffDays / 7);
      return (diffWeeks % 4) + 1;
    };

    const getDayIndex = (date: Date) => {
      // Assuming weekly_plan[0] is Monday
      return (date.getDay() + 6) % 7;
    };

    return (
      <div className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} className="text-brand-teal" />
            Calendrier de Périodisation
          </h3>
          <span className="px-3 py-1 bg-brand-teal/20 text-brand-teal text-xs font-bold rounded-full border border-brand-teal/30">
            Cycle {currentCycle + 1}
          </span>
        </div>
        <p className="text-slate-500 text-sm mb-6">
          Sélectionnez une date future pour voir comment votre programme évolue (volume, séries).
        </p>
        
        <div className="bg-white/80 border border-slate-200 rounded-2xl p-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-8 min-w-max">
            {[1, 2, 3, 4].map(weekNum => {
              const weekDays = days.slice((weekNum - 1) * 7, weekNum * 7);
              return (
                <div key={weekNum} className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center flex flex-col gap-1">
                    <span className="text-slate-900">Semaine {weekNum}</span>
                    <span className="text-[10px] opacity-70">
                      {weekNum === 1 && "Préparation"}
                      {weekNum === 2 && "Croissance"}
                      {weekNum === 3 && "Peak"}
                      {weekNum === 4 && "Récupération"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {weekDays.map((date, i) => {
                      const diffTime = date.getTime() - startDate.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      const cycleWeek = getCycleWeek(diffDays);
                      const dayIndex = getDayIndex(date);
                      const isSelected = selectedCycleWeek === cycleWeek && selectedDayIndex === dayIndex;
                      
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedCycleWeek(cycleWeek);
                            setSelectedDayIndex(dayIndex);
                          }}
                          className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-brand-teal text-slate-950 font-bold shadow-[0_0_15px_rgba(45,212,191,0.4)]' 
                              : 'bg-slate-800/50 text-slate-600 hover:bg-slate-700 border border-slate-100'
                          }`}
                        >
                          <span className="text-[10px] uppercase opacity-70">
                            {date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <span className="text-lg">
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWorkout = (planToRender?: any, onBack?: () => void) => {
    let currentDayPlan = null;
    const activePlan = planToRender || workoutPlan;
    if (activePlan) {
      const content = activePlan.content;
      const baseDayPlan = content?.weekly_plan ? content.weekly_plan[selectedDayIndex] : content;
      currentDayPlan = adjustWorkoutDayForCycle(baseDayPlan, selectedCycleWeek);
    }
    
    const workoutExercises = currentDayPlan?.workout || [];
    const hasCardio = !!currentDayPlan?.cardio;
    const isEnduranceGoal = ['marathon', 'semi_marathon', 'triathlon'].includes(profile.primary_goal || '');
    
    const totalSetsInWorkout = workoutExercises.reduce((acc: number, ex: any) => acc + (Number(ex.sets) || 0), 0);
    const totalItems = totalSetsInWorkout + (hasCardio ? 1 : 0);
    
    const dayProgress = exerciseProgress[selectedDayIndex] || {};
    const completedSetsInWorkout = workoutExercises.reduce((acc: number, ex: any) => {
      const progress = dayProgress[ex.name] || [];
      return acc + progress.filter(Boolean).length;
    }, 0);
    
    const cardioDone = dayProgress['cardio_done']?.[0] ? 1 : 0;
    const completedItems = completedSetsInWorkout + cardioDone;
    
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
      <div className="space-y-6 pb-32">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ChevronRight size={20} className="rotate-180" />
            <span>Retour à la bibliothèque</span>
          </button>
        )}
        <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop" 
            alt="Workout Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Entraînement</h2>
              <p className="text-slate-600 text-sm font-medium">{planToRender ? 'Programme de la bibliothèque.' : 'Votre plan hebdomadaire.'}</p>
            </div>
            <div className="flex gap-3">
              {(planToRender || workoutPlan)?.content?.weekly_plan && (
                <button 
                  onClick={downloadWorkoutPlan}
                  className="relative z-10 p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                  title="Télécharger le plan"
                >
                  <Download size={24} />
                </button>
              )}
              {!planToRender && (
                <button 
                  onClick={() => handleGenerate('workout')}
                  disabled={loading}
                  className="relative z-10 p-4 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-2xl text-rose-400 hover:bg-rose-500/30 hover:text-rose-300 transition-all shadow-[0_0_20px_rgba(244,63,94,0.2)] disabled:opacity-50"
                >
                  {loading ? <Activity className="animate-spin" /> : <Flame size={24} />}
                </button>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {(() => {
          let weeklyPlan = null;
          if (activePlan) {
            const content = activePlan.content;
            weeklyPlan = content?.weekly_plan;
          }
          return weeklyPlan ? (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {weeklyPlan.map((day: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedDayIndex(i)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2
                    ${selectedDayIndex === i 
                      ? 'bg-rose-500 text-slate-950 border-rose-500' 
                      : 'bg-white/80 backdrop-blur-md text-slate-500 border-slate-100 hover:border-slate-200'}
                  `}
                >
                  {day.day}
                  {day.cardio && <Zap size={10} className={selectedDayIndex === i ? 'text-slate-950' : 'text-rose-500'} />}
                </button>
              ))}
            </div>
          ) : null;
        })()}

        {currentDayPlan ? (
          <div className="space-y-6">
            {currentDayPlan.is_rest_day ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-[32px] text-center shadow-lg">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Heart size={24} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Jour de Repos</h3>
                <p className="text-slate-500 text-sm max-w-[240px] mb-6">
                  Profitez de cette journée pour récupérer. Focus : {currentDayPlan.focus}
                </p>
                <button
                  onClick={insertRestWeek}
                  disabled={loading}
                  className="px-6 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Calendar size={18} />
                  Insérer une semaine de repos
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                    <Target size={20} className="text-rose-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{currentDayPlan.focus}</h4>
                    <p className="text-xs text-slate-500">Séance du jour</p>
                  </div>
                </div>

                {currentDayPlan.warmup && currentDayPlan.warmup.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Échauffement</h3>
                    <div className="grid gap-3">
                      {currentDayPlan.warmup.map((w: any, i: number) => (
                        <div key={i} className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-lg">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-slate-900">{w.name}</h4>
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">{w.duration}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{w.instructions}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentDayPlan.safety_alerts && currentDayPlan.safety_alerts.length > 0 && (
                  <Card title="Alertes de Sécurité" icon={AlertTriangle} className="border-red-500/30 bg-red-500/5">
                    <ul className="list-disc list-inside space-y-1">
                      {currentDayPlan.safety_alerts.map((alert: string, i: number) => (
                        <li key={i} className="text-xs text-red-200/80">{alert}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {isEnduranceGoal && currentDayPlan.cardio && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} />
                      Session de Course / Cardio (Principal)
                    </h3>
                    <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/20 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                        <GeneratedImage name={currentDayPlan.cardio.type} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">{currentDayPlan.cardio.type}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {currentDayPlan.cardio.intensity}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {currentDayPlan.cardio.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50/40 rounded-2xl p-4 border border-slate-100 mb-6">
                          <p className="text-sm text-slate-600 leading-relaxed italic">
                            "{currentDayPlan.cardio.instructions}"
                          </p>
                        </div>
                        {(() => {
                          const isDone = dayProgress['cardio_done']?.[0] || false;
                          return (
                            <button 
                              onClick={() => {
                                if (!isDone) {
                                  let durationMins = 20;
                                  const match = currentDayPlan.cardio.duration.match(/(\d+)/);
                                  if (match) durationMins = parseInt(match[1]);
                                  let multiplier = 5;
                                  if (currentDayPlan.cardio.intensity.toLowerCase().includes('haute') || currentDayPlan.cardio.intensity.toLowerCase().includes('hiit')) multiplier = 8;
                                  if (currentDayPlan.cardio.intensity.toLowerCase().includes('basse') || currentDayPlan.cardio.intensity.toLowerCase().includes('liss')) multiplier = 4;
                                  const estimatedCals = durationMins * multiplier;
                                  logBurnedCalories(estimatedCals, `Cardio: ${currentDayPlan.cardio.type}`);
                                }
                                toggleCardioDone(selectedDayIndex);
                              }}
                              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg ${
                                isDone 
                                  ? 'bg-rose-500 text-slate-950 shadow-rose-500/20' 
                                  : 'bg-white text-slate-950 hover:bg-rose-400 transition-colors'
                              }`}
                            >
                              {isDone ? <CheckCircle2 size={20} /> : <Play size={20} className="fill-current" />}
                              {isDone ? 'SESSION TERMINÉE' : 'DÉMARRER LA SESSION'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {workoutExercises.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {isEnduranceGoal ? 'Renforcement Musculaire' : 'Corps de séance'}
                    </h3>
                    {(() => {
                      const groupedWorkout: any[] = [];
                      let currentGroup: any = null;
                  
                      currentDayPlan.workout?.forEach((ex: any, index: number) => {
                        const groupId = ex.group_id;
                        
                        if (groupId) {
                          if (currentGroup && currentGroup.groupId === groupId) {
                            currentGroup.exercises.push({ ...ex, originalIndex: index });
                          } else {
                            if (currentGroup) groupedWorkout.push(currentGroup);
                            currentGroup = { type: 'group', groupId: groupId, technique: ex.technique, exercises: [{ ...ex, originalIndex: index }] };
                          }
                        } else if (ex.technique && (ex.technique.toLowerCase().includes('superset') || ex.technique.toLowerCase().includes('circuit') || ex.technique.toLowerCase().includes('tabata') || ex.technique.toLowerCase().includes('hiit') || ex.technique.toLowerCase().includes('drop set'))) {
                           // Fallback for older plans without group_id but with superset/circuit technique
                           if (currentGroup && currentGroup.technique === ex.technique) {
                             currentGroup.exercises.push({ ...ex, originalIndex: index });
                           } else {
                             if (currentGroup) groupedWorkout.push(currentGroup);
                             currentGroup = { type: 'group', groupId: ex.technique, technique: ex.technique, exercises: [{ ...ex, originalIndex: index }] };
                           }
                        } else {
                          if (currentGroup) {
                            groupedWorkout.push(currentGroup);
                            currentGroup = null;
                          }
                          groupedWorkout.push({ type: 'single', exercise: { ...ex, originalIndex: index } });
                        }
                      });
                      if (currentGroup) groupedWorkout.push(currentGroup);

                      const renderExerciseCard = (ex: any, i: number) => {
                        const dayProgress = exerciseProgress[selectedDayIndex] || {};
                        const progress = dayProgress[ex.name] || [];
                        const completedSets = progress.filter(Boolean).length;
                        const isFullyDone = completedSets === Number(ex.sets);
                        
                        return (
                          <motion.div 
                            key={i} 
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedExercise(ex)}
                            className={`border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                              isFullyDone 
                                ? 'bg-rose-500/10 border-rose-500/30 backdrop-blur-md' 
                                : 'bg-white/80 backdrop-blur-md border-slate-200 hover:bg-slate-800/60 shadow-lg'
                            }`}
                          >
                            <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden relative group shrink-0">
                              <GeneratedImage 
                                name={ex.name} 
                                className={`w-full h-full transition-opacity ${isFullyDone ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`} 
                              />
                              {isFullyDone && (
                                <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                                  <CheckCircle2 size={24} className="text-rose-500" />
                                </div>
                              )}
                              {!isFullyDone && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlayCircle className="text-slate-900" size={24} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-bold truncate transition-colors ${isFullyDone ? 'text-rose-500' : 'text-slate-900'}`}>{ex.name}</h4>
                                {isFullyDone && <CheckCircle2 size={14} className="text-rose-500 shrink-0" />}
                              </div>
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                    {isFullyDone ? 'Terminé' : `${completedSets}/${ex.sets} séries • ${ex.duration_seconds > 0 ? `${ex.duration_seconds} sec` : `${ex.reps} reps`}`}
                                  </p>
                                  {ex.technique && (
                                    <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                      {ex.technique}
                                    </span>
                                  )}
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-24">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedSets / Number(ex.sets)) * 100}%` }}
                                    className="h-full bg-rose-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise form demo')}`, '_blank');
                                    }}
                                    className="text-[8px] font-black text-brand-teal uppercase tracking-widest flex items-center gap-1 hover:text-slate-900 transition-colors"
                                  >
                                    <Play size={8} className="fill-brand-teal" />
                                    Regarder Démo
                                  </button>
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={18} className={isFullyDone ? 'text-rose-500/50' : 'text-slate-700 shrink-0'} />
                          </motion.div>
                        );
                      };

                      return groupedWorkout.map((item, groupIndex) => {
                        if (item.type === 'single') {
                          return renderExerciseCard(item.exercise, item.exercise.originalIndex);
                        } else {
                          return (
                            <div key={`group-${groupIndex}`} className="relative border border-orange-500/30 bg-orange-500/5 rounded-3xl p-4 space-y-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <Zap size={16} className="text-orange-500" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-orange-500 uppercase tracking-wider">{item.technique}</h4>
                                    <p className="text-xs text-orange-200/70 leading-relaxed mt-1">
                                      {TECHNIQUE_EXPLANATIONS[item.technique] || "Technique d'entraînement avancée."}
                                    </p>
                                  </div>
                                </div>
                                {item.exercises.some((ex: any) => ex.duration_seconds > 0) && (
                                  <button 
                                    onClick={() => setActiveCircuit(item.exercises)}
                                    className="p-2 bg-orange-500/20 text-orange-500 rounded-xl hover:bg-orange-500/30 transition-colors"
                                    title="Démarrer le chronomètre du circuit"
                                  >
                                    <Clock size={20} />
                                  </button>
                                )}
                              </div>
                              
                              <div className="space-y-3 relative">
                                {item.exercises.length > 1 && (
                                  <div className="absolute left-12 top-8 bottom-8 w-0.5 bg-orange-500/30 z-0 hidden sm:block"></div>
                                )}
                                
                                {item.exercises.map((ex: any, idx: number) => (
                                  <div key={ex.originalIndex} className="relative z-10">
                                    {idx > 0 && (
                                      <div className="absolute -top-4 left-[2.6rem] text-orange-500/70 hidden sm:block bg-white rounded-full p-0.5 z-20">
                                        <ArrowDown size={16} />
                                      </div>
                                    )}
                                    {renderExerciseCard(ex, ex.originalIndex)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                )}

                  {currentDayPlan.cooldown && currentDayPlan.cooldown.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Retour au calme & Étirements</h3>
                      <div className="grid gap-3">
                        {currentDayPlan.cooldown.map((c: any, i: number) => (
                          <div key={i} className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-lg">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">{c.duration}</span>
                            </div>
                            {c.instructions && <p className="text-xs text-slate-500 leading-relaxed">{c.instructions}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isEnduranceGoal && currentDayPlan.cardio && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cardio (Fin de séance)</h3>
                      <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{currentDayPlan.cardio.type}</h4>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">{currentDayPlan.cardio.intensity}</p>
                          </div>
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">{currentDayPlan.cardio.duration}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">{currentDayPlan.cardio.instructions}</p>
                        {(() => {
                          const isDone = dayProgress['cardio_done']?.[0] || false;
                          
                          return (
                            <button 
                              onClick={() => {
                                if (!isDone) {
                                  // Estimate calories based on duration and intensity
                                  let durationMins = 20; // default
                                  const match = currentDayPlan.cardio.duration.match(/(\d+)/);
                                  if (match) durationMins = parseInt(match[1]);
                                  
                                  let multiplier = 5; // moderate
                                  if (currentDayPlan.cardio.intensity.toLowerCase().includes('haute') || currentDayPlan.cardio.intensity.toLowerCase().includes('hiit')) multiplier = 8;
                                  if (currentDayPlan.cardio.intensity.toLowerCase().includes('basse') || currentDayPlan.cardio.intensity.toLowerCase().includes('liss')) multiplier = 4;
                                  
                                  const estimatedCals = durationMins * multiplier;
                                  logBurnedCalories(estimatedCals, `Cardio: ${currentDayPlan.cardio.type}`);
                                }
                                toggleCardioDone(selectedDayIndex);
                              }}
                              className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                                isDone 
                                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                                  : 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/30'
                              }`}
                            >
                              {isDone ? <CheckCircle2 size={14} /> : <Zap size={14} />}
                              {isDone ? 'Cardio Terminé' : 'Marquer Cardio comme fait'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar & Finish Button */}
                  <div className="mt-8 flex flex-col gap-2">
                    {progressPercentage === 100 && (
                      <button
                        onClick={() => {
                          // Handle workout completion
                          if (!user) return;
                          const dateStr = new Date().toISOString().split('T')[0];
                          const currentStreak = profile.consecutive_days || 0;
                          const lastWorkout = profile.last_workout_date;
                          
                          let newStreak = currentStreak;
                          if (lastWorkout !== dateStr) {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            const yesterdayStr = yesterday.toISOString().split('T')[0];
                            
                            if (lastWorkout === yesterdayStr) {
                              newStreak += 1;
                            } else {
                              newStreak = 1;
                            }
                          }

                          const updateData = {
                            consecutive_days: newStreak,
                            last_workout_date: dateStr,
                            updated_at: new Date().toISOString()
                          };

                          setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
                          setProfile({ ...profile, ...updateData });
                          
                          // Log burned calories for the workout only if not already logged today
                          if (lastWorkout !== dateStr) {
                            const estimatedCals = totalSetsInWorkout * 15; // Rough estimate: 15 kcal per set (including rest)
                            logBurnedCalories(estimatedCals, "Entraînement du jour");
                          }

                          showSuccessMsg("Séance terminée ! Bravo !");
                          setActiveTab('dashboard');
                        }}
                        className="w-full py-4 bg-brand-teal text-slate-950 font-bold rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:bg-teal-400 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={20} />
                        Terminer la séance
                      </button>
                    )}
                    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progression du jour</span>
                        <span className="text-xs font-bold text-rose-500">{progressPercentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Dumbbell size={32} className="text-slate-700" />
            </div>
            <p className="text-slate-500 text-sm max-w-[200px]">Cliquez sur l'icône de flamme pour générer votre plan hebdomadaire.</p>
          </div>
        )}
        
        {!planToRender && renderFutureCalendar()}
      </div>
    );
  };

  const renderAdmin = () => {
    return (
      <div className="space-y-6">
        <header className="relative rounded-[2.5rem] overflow-hidden mb-8 aspect-[4/3] sm:aspect-[21/9] shadow-2xl border border-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop" 
            alt="Admin Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="text-purple-500" size={36} />
                Admin Panel
              </h2>
              <p className="text-slate-600 text-sm font-medium">Gestion des clients et programmes.</p>
            </div>
          </div>
        </header>

        <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-lg">
          <button 
            onClick={() => setAdminTab('users')}
            className={`relative whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${adminTab === 'users' ? 'bg-rose-500 text-slate-950' : 'text-slate-500 hover:text-slate-600'}`}
          >
            Clients
            {(Object.values(unreadMessagesCounts) as number[]).reduce((a, b) => a + b, 0) > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button 
            onClick={() => setAdminTab('exercises')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${adminTab === 'exercises' ? 'bg-rose-500 text-slate-950' : 'text-slate-500 hover:text-slate-600'}`}
          >
            Exercices
          </button>
          <button 
            onClick={() => setAdminTab('promos')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${adminTab === 'promos' ? 'bg-rose-500 text-slate-950' : 'text-slate-500 hover:text-slate-600'}`}
          >
            Promos
          </button>
          <button 
            onClick={() => setAdminTab('packages')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${adminTab === 'packages' ? 'bg-rose-500 text-slate-950' : 'text-slate-500 hover:text-slate-600'}`}
          >
            Forfaits
          </button>
          <button 
            onClick={() => setAdminTab('pharmacies')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${adminTab === 'pharmacies' ? 'bg-rose-500 text-slate-950' : 'text-slate-500 hover:text-slate-600'}`}
          >
            Pharmacies
          </button>
          <button 
            onClick={() => setAdminTab('group_message')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${adminTab === 'group_message' ? 'bg-rose-500 text-slate-950' : 'text-slate-500 hover:text-slate-600'}`}
          >
            Message Groupé
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {adminTab === 'pharmacies' && (
            <div className="space-y-6">
              <Card title="Statistiques Avancées" icon={BarChart2}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-rose-500 mb-1">{allUsers.length}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Clients Totaux</div>
                  </div>
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-orange-500 mb-1">
                      {allUsers.filter(u => u.tier_level && u.tier_level > 0).length}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Clients Actifs</div>
                  </div>
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-emerald-500 mb-1">
                      {Math.round(
                        allUsers.reduce((acc, u) => acc + (u.daily_calorie_goal || 0), 0) / 
                        (allUsers.filter(u => u.daily_calorie_goal).length || 1)
                      )}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Moyenne Calories/Jour</div>
                  </div>
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-purple-500 mb-1">
                      {new Set(allUsers.map(u => u.pharmacy_banner?.trim()).filter(Boolean)).size}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Bannières</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Top Bannières</h4>
                    <div className="space-y-3">
                      {Object.entries(
                        allUsers.reduce((acc, user) => {
                          const banner = user.pharmacy_banner?.trim() || 'Non spécifié';
                          acc[banner] = (acc[banner] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([banner, count]) => (
                        <div key={banner} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{banner}</span>
                          <span className="text-sm font-bold text-rose-500">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Top Propriétaires</h4>
                    <div className="space-y-3">
                      {Object.entries(
                        allUsers.reduce((acc, user) => {
                          const owner = user.pharmacy_owner?.trim() || 'Non spécifié';
                          acc[owner] = (acc[owner] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([owner, count]) => (
                        <div key={owner} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{owner}</span>
                          <span className="text-sm font-bold text-rose-500">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Groupes par Pharmacies" icon={Users}>
                <div className="space-y-6">
                  {Object.entries(
                    allUsers.reduce((acc, user) => {
                      const banner = user.pharmacy_banner?.trim() || 'Non spécifié';
                      if (!acc[banner]) acc[banner] = { total: 0, owners: {} };
                      acc[banner].total++;
                      
                      const owner = user.pharmacy_owner?.trim() || 'Non spécifié';
                      if (!acc[banner].owners[owner]) acc[banner].owners[owner] = [];
                      acc[banner].owners[owner].push(user);
                      
                      return acc;
                    }, {} as Record<string, { total: number, owners: Record<string, any[]> }>)
                  ).map(([banner, data]: [string, any]) => (
                    <div key={banner} className="bg-white/90 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                        <h3 className="text-lg font-bold text-rose-500 uppercase">{banner}</h3>
                        <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-bold">
                          {data.total} client{data.total > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {Object.entries(data.owners).map(([owner, users]: [string, any]) => (
                          <div key={owner} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-slate-900">{owner}</h4>
                              <span className="text-xs text-slate-500">{users.length} client{users.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {users.map((u: any) => (
                                <button 
                                  key={u.id}
                                  onClick={() => {
                                    setSelectedUserForAdmin(u);
                                    setAdminTab('users');
                                  }}
                                  className="text-[10px] bg-slate-800 hover:bg-rose-500 hover:text-slate-950 text-slate-600 px-2 py-1 rounded transition-colors"
                                >
                                  {u.name || u.id}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {allUsers.length === 0 && (
                    <p className="text-center text-slate-500 text-sm">Aucun utilisateur trouvé.</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {adminTab === 'packages' && (
            <Card title="Gestion des Forfaits" icon={Ticket}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                    placeholder="Nom du forfait (ex: Coaching VIP)"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                    placeholder="Prix (ex: 29.99$)"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({...newPackage, price: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                    placeholder="Fonctionnalités (séparées par des virgules)"
                    value={newPackage.features}
                    onChange={(e) => setNewPackage({...newPackage, features: e.target.value})}
                  />
                  <select
                    className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                    value={newPackage.tierLevel}
                    onChange={(e) => setNewPackage({...newPackage, tierLevel: parseInt(e.target.value)})}
                  >
                    <option value={0}>Niveau 0 (Gratuit)</option>
                    <option value={1}>Niveau 1 (Premium - Sport)</option>
                    <option value={2}>Niveau 2 (Elite - Sport + Nutri)</option>
                    <option value={3}>Niveau 3 (Coach - VIP)</option>
                  </select>
                  <button 
                    onClick={addPackage}
                    className="col-span-2 py-3 bg-rose-500 text-slate-950 rounded-xl font-bold hover:bg-rose-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Ajouter le Forfait
                  </button>
                </div>

                <div className="space-y-2 mt-6">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{pkg.name}</span>
                          <span className="text-rose-500 font-bold text-sm">{pkg.price}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{pkg.features?.join(', ')}</p>
                      </div>
                      <button 
                        onClick={() => deletePackage(pkg.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {packages.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-4">Aucun forfait configuré.</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {adminTab === 'promos' && (
            <Card title="Codes Promotionnels" icon={Tag}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none uppercase text-sm"
                    placeholder="CODE (ex: SUMMER20)"
                    value={newPromoCode.code}
                    onChange={(e) => setNewPromoCode({...newPromoCode, code: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Rabais %</span>
                      <input 
                        type="number" 
                        className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                        placeholder="%"
                        value={newPromoCode.discount || ''}
                        onChange={(e) => setNewPromoCode({...newPromoCode, discount: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Mois (0=∞)</span>
                      <input 
                        type="number" 
                        className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                        placeholder="Mois"
                        value={newPromoCode.duration === 0 ? 0 : (newPromoCode.duration || '')}
                        onChange={(e) => setNewPromoCode({...newPromoCode, duration: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Forfait</span>
                      <select 
                        className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                        value={newPromoCode.tierId}
                        onChange={(e) => setNewPromoCode({...newPromoCode, tierId: e.target.value})}
                      >
                        <option value="all">Tous</option>
                        <option value="premium">Entraînement</option>
                        <option value="elite">Nutrition & Sport</option>
                        <option value="coach">Coaching VIP</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Utilisations</span>
                      <select 
                        className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                        value={newPromoCode.max_uses || 0}
                        onChange={(e) => setNewPromoCode({...newPromoCode, max_uses: parseInt(e.target.value) || 0})}
                      >
                        <option value={0}>Illimité</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={4}>4x</option>
                        <option value={5}>5x</option>
                        <option value={10}>10x</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={addPromoCode}
                    className="w-full sm:w-auto self-end p-3 bg-rose-500 text-slate-950 rounded-xl hover:bg-rose-400 transition-all flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  {promoCodes.map((pc) => (
                    <div key={pc.id} className="flex items-center justify-between bg-slate-50/20 p-3 rounded-xl border border-slate-100">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 uppercase">{pc.code}</span>
                          <span className="text-xs text-rose-500">-{pc.discount}%</span>
                          {pc.max_uses > 0 && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                              {pc.current_uses || 0}/{pc.max_uses} utilisations
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">
                          {pc.duration === 0 ? 'Illimité' : `${pc.duration} mois`} • {pc.tierId === 'all' || !pc.tierId ? 'Tous les forfaits' : `Forfait ${pc.tierId}`}
                        </span>
                      </div>
                      <button 
                        onClick={() => deletePromoCode(pc.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {promoCodes.length === 0 && <p className="text-center text-xs text-slate-600 italic">Aucun code promo actif.</p>}
                </div>
              </div>
            </Card>
          )}

          {adminTab === 'exercises' && (
            <Card title="Banque d'Exercices" icon={Library}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    className="col-span-2 bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                    placeholder="Nom de l'exercice"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                    placeholder="Catégorie (ex: Pectoraux)"
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                    placeholder="Recherche d'image"
                    value={newExercise.image_search_query}
                    onChange={(e) => setNewExercise({...newExercise, image_search_query: e.target.value})}
                  />
                  <textarea 
                    className="col-span-2 bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm h-20"
                    placeholder="Instructions"
                    value={newExercise.instructions}
                    onChange={(e) => setNewExercise({...newExercise, instructions: e.target.value})}
                  />
                  <button 
                    onClick={addExercise}
                    className="col-span-2 py-3 bg-rose-500 text-slate-950 rounded-xl font-bold hover:bg-rose-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Ajouter à la banque
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {exercises.map((ex) => (
                    <div key={ex.id} className="bg-slate-50/20 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{ex.name}</p>
                        <p className="text-[10px] text-rose-500 uppercase font-bold">{ex.category}</p>
                      </div>
                      <button 
                        onClick={() => deleteExercise(ex.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {exercises.length === 0 && <p className="text-center text-xs text-slate-600 italic">Aucun exercice dans la banque.</p>}
                </div>
              </div>
            </Card>
          )}

          {adminTab === 'group_message' && (
            <Card title="Envoyer un message à tous les clients" icon={MessageSquare}>
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Ce message sera envoyé individuellement à tous vos clients ({allUsers.length}) dans leur chat respectif.
                </p>
                <div className="relative">
                  <textarea
                    value={groupMessage}
                    onChange={(e) => setGroupMessage(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    className="w-full bg-white/90 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm focus:border-rose-500 outline-none min-h-[150px] resize-none"
                  />
                  {isCorrectingGroupMessage && (
                    <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <div className="flex items-center gap-2 text-rose-500 font-bold">
                        <Loader2 className="animate-spin" size={20} />
                        Correction en cours...
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCorrectGroupMessage}
                    disabled={!groupMessage.trim() || isCorrectingGroupMessage || isSendingGroupMessage}
                    className="flex-1 py-3 bg-slate-800 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap size={18} className="text-yellow-500" />
                    Corriger avec l'IA
                  </button>
                  <button
                    onClick={handleSendGroupMessage}
                    disabled={!groupMessage.trim() || isCorrectingGroupMessage || isSendingGroupMessage}
                    className="flex-[2] py-3 bg-rose-500 text-slate-950 rounded-xl font-bold text-sm hover:bg-rose-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingGroupMessage ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    Envoyer à tous
                  </button>
                </div>
              </div>
            </Card>
          )}

          {adminTab === 'users' && (
            <>
              {selectedUserForAdmin ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedUserForAdmin(null)}
                    className="flex items-center gap-2 text-rose-500 font-bold text-sm uppercase tracking-wider"
                  >
                    <ChevronLeft size={18} />
                    Retour à la liste
                  </button>

                  <Card title={`Profil de ${selectedUserForAdmin.name || 'Athlète'}`} icon={UserCircle}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 uppercase text-[10px] font-bold">Email</p>
                        <p className="text-slate-900">{selectedUserForAdmin.id}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-[10px] font-bold">Objectif</p>
                        <p className="text-slate-900">{selectedUserForAdmin.primary_goal || 'Non défini'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500 uppercase text-[10px] font-bold mb-1">Forfait Actuel</p>
                        <select 
                          className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                          value={selectedUserForAdmin.subscription_tier || 'free'}
                          onChange={(e) => updateUserTierForAdmin(selectedUserForAdmin.id, e.target.value)}
                        >
                          <option value="free">Gratuit</option>
                          <option value="premium">Entraînement</option>
                          <option value="elite">Nutrition & Sport</option>
                          <option value="coach">Coaching VIP</option>
                        </select>
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-2 mt-4">
                        <button 
                          onClick={() => {
                            setActiveTab('chat');
                          }}
                          className="col-span-2 py-3 bg-rose-500 text-slate-950 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-400 transition-all"
                        >
                          <MessageSquare size={18} />
                          Ouvrir la messagerie
                        </button>
                        <button 
                          onClick={() => resetUserPassword(selectedUserForAdmin.id)}
                          className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${resetEmailSent ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-900 border border-slate-100 hover:bg-slate-700'}`}
                        >
                          <Zap size={18} />
                          {resetEmailSent ? 'Email envoyé !' : 'Réinitialiser MDP'}
                        </button>
                        <button 
                          onClick={() => deleteUserForAdmin(selectedUserForAdmin.id)}
                          className="py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-slate-900 transition-all"
                        >
                          <Trash2 size={18} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </Card>

                  {editingPlan && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-md" onClick={() => setEditingPlan(null)} />
                      <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4">
                        <h3 className="text-xl font-bold text-slate-900">Modifier le programme</h3>
                        <p className="text-xs text-slate-500 uppercase font-bold">Format JSON</p>
                        <textarea 
                          className="w-full h-[400px] bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-xl p-4 text-slate-600 font-mono text-xs outline-none focus:border-rose-500 transition-all"
                          value={typeof editingPlan.content === 'string' ? editingPlan.content : JSON.stringify(editingPlan.content, null, 2)}
                          onChange={(e) => setEditingPlan({...editingPlan, content: e.target.value})}
                        />
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setEditingPlan(null)}
                            className="flex-1 py-3 bg-slate-800/50 backdrop-blur-md text-slate-900 border border-slate-200 rounded-xl font-bold hover:bg-slate-700 transition-all"
                          >
                            Annuler
                          </button>
                          <button 
                            onClick={() => {
                              try {
                                const content = typeof editingPlan.content === 'string' ? JSON.parse(editingPlan.content) : editingPlan.content;
                                updatePlanContent(selectedUserForAdmin.id, editingPlan.id, content);
                              } catch (e) {
                                setError("Erreur de format JSON invalide.");
                              }
                            }}
                            className="flex-1 py-3 bg-rose-500 text-slate-950 rounded-xl font-bold hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest">Programmes Générés</h3>
                  <div className="space-y-3">
                    {userPlansForAdmin.length > 0 ? (
                      userPlansForAdmin.map((plan) => (
                        <div key={plan.id} className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${plan.type === 'workout' ? 'bg-rose-500/10 text-rose-500' : 'bg-orange-500/10 text-orange-500'}`}>
                              {plan.type === 'workout' ? <Dumbbell size={20} /> : <Utensils size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 capitalize">{plan.type === 'workout' ? 'Entraînement' : 'Nutrition'}</p>
                              <p className="text-[10px] text-slate-500">{new Date(plan.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setEditingPlan({ id: plan.id, content: JSON.parse(plan.content) })}
                              className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                              title="Modifier"
                            >
                              <Plus size={18} />
                            </button>
                            <button 
                              onClick={() => deletePlanForAdmin(selectedUserForAdmin.id, plan.id)}
                              className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-10 text-slate-500 text-sm italic">Aucun programme généré pour ce client.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card title="Créer un Client" icon={UserCircle}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                          placeholder="Nom complet"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        />
                        <input 
                          type="email" 
                          className="bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                          placeholder="Email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                        <input 
                          type="password" 
                          className="col-span-2 bg-slate-800/50 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-rose-500 outline-none text-sm"
                          placeholder="Mot de passe provisoire"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        />
                        <button 
                          onClick={createUserByAdmin}
                          className="col-span-2 py-3 bg-rose-500 text-slate-950 rounded-xl font-bold hover:bg-rose-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={18} /> Créer le Client
                        </button>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest">Liste des Clients ({allUsers.length})</h3>
                    <div className="space-y-3">
                    {allUsers.map((u) => (
                      <div key={u.id} className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-rose-500/30 transition-colors shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500">
                            {u.name ? u.name[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.name || 'Athlète Inconnu'}</p>
                            <p className="text-[10px] text-slate-500">{u.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedUserForAdmin(u);
                              setActiveTab('chat');
                            }}
                            className="relative p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-slate-900 transition-all"
                            title="Chat avec ce client"
                          >
                            <MessageSquare size={18} />
                            {unreadMessagesCounts[u.id] > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-slate-900 text-[10px] font-bold flex items-center justify-center rounded-full">
                                {unreadMessagesCounts[u.id]}
                              </span>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUserForAdmin(u);
                              fetchUserPlansForAdmin(u.id);
                            }}
                            className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-slate-950 transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => deleteUserForAdmin(u.id)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-slate-900 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {allUsers.length === 0 && (
                      <p className="text-center py-20 text-slate-500 text-sm italic">Aucun client trouvé dans la base de données.</p>
                    )}
                  </div>
                </div>
              </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Activity className="animate-spin text-rose-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Activity className="animate-spin text-rose-500" size={40} />
      </div>
    );
  }

  const handleUpdateProfileFromCoach = async (updates: any) => {
    if (!user) return;
    try {
      const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      showSuccessMsg("Profil mis à jour par le coach !");
    } catch (error) {
      console.error("Error updating profile from coach:", error);
      throw error;
    }
  };

  const handleUpdateWorkoutPlanFromCoach = async (plan: any) => {
    if (!user) return;
    try {
      const newPlanData = {
        type: 'workout' as const,
        content: JSON.stringify(plan),
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'plans'), newPlanData);
      setWorkoutPlan({ ...newPlanData, content: plan, id: docRef.id });
      showSuccessMsg("Nouveau plan d'entraînement intégré !");
    } catch (error) {
      console.error("Error updating workout plan from coach:", error);
      throw error;
    }
  };

  const handleUpdateNutritionPlanFromCoach = async (plan: any) => {
    if (!user) return;
    try {
      const newPlanData = {
        type: 'nutrition' as const,
        content: JSON.stringify(plan),
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'plans'), newPlanData);
      setNutritionPlan({ ...newPlanData, content: plan, id: docRef.id });
      showSuccessMsg("Nouveau plan de nutrition intégré !");
    } catch (error) {
      console.error("Error updating nutrition plan from coach:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 font-sans selection:bg-rose-500/30 relative overflow-hidden">
      {/* Global subtle background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[100px] opacity-30"></div>
      </div>
      
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'profile' && (showPricing ? renderPricing() : renderQuestionnaire())}
            {activeTab === 'workout' && (!workoutPlan && getUserTierLevel(profile.subscription_tier, profile.subscription_status) === 0 ? <PredefinedPrograms programs={[...defaultPredefinedPrograms, ...predefinedPrograms]} onSelectProgram={(plan) => { setWorkoutPlan({ ...plan, created_at: plan.created_at || new Date().toISOString() }); setActiveTab('workout'); }} /> : renderWorkout())}
            {activeTab === 'calendar' && renderCalendar()}
            {activeTab === 'nutrition' && renderNutrition()}
            {activeTab === 'library' && (selectedLibraryProgram ? renderWorkout(selectedLibraryProgram, () => setSelectedLibraryProgram(null)) : <PredefinedPrograms programs={[...defaultPredefinedPrograms, ...predefinedPrograms]} onSelectProgram={setSelectedLibraryProgram} />)}
            {activeTab === 'chat' && renderCoachChat()}
            {activeTab === 'admin' && isAdmin && renderAdmin()}
            {activeTab === 'progress' && renderProgress()}
          </motion.div>
        </AnimatePresence>
      </main>

      {activeTab === 'workout' && <WorkoutTimerWidget />}
      <MusicWidget />
      <AICoachWidget 
        userContext={JSON.stringify({
          profile,
          currentWorkoutPlan: workoutPlan?.content,
          currentNutritionPlan: nutritionPlan?.content,
          exercise_progress: profile.exercise_progress,
          burned_calories_log: profile.burned_calories_log,
          weight_tracking: profile.weight_tracking
        })} 
        onUpdateProfile={handleUpdateProfileFromCoach}
        onUpdateWorkoutPlan={handleUpdateWorkoutPlanFromCoach}
        onUpdateNutritionPlan={handleUpdateNutritionPlanFromCoach}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-[var(--color-glass-surface)] backdrop-blur-3xl border border-[var(--color-glass-border)] rounded-[2rem] px-2 sm:px-4 py-2 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50">
        <NavItem icon={LayoutDashboard} label="Dash" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} activeColor="bg-brand-teal" />
        <NavItem icon={LineChart} label="Progrès" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} activeColor="bg-brand-teal" />
        <NavItem icon={Library} label="Biblio" active={activeTab === 'library'} onClick={() => setActiveTab('library')} activeColor="bg-brand-teal" />
        <NavItem icon={Dumbbell} label="Sport" active={activeTab === 'workout'} onClick={() => setActiveTab('workout')} activeColor="bg-brand-teal" />
        <NavItem icon={Utensils} label="Nutrition" active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} activeColor="bg-brand-teal" />
        {getUserTierLevel(profile.subscription_tier, profile.subscription_status) >= 3 && (
          <NavItem icon={MessageSquare} label="Questions" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} badge={(Object.values(unreadMessagesCounts) as number[]).reduce((a, b) => a + b, 0)} activeColor="bg-brand-teal" />
        )}
        <NavItem icon={UserCircle} label="Profil" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} activeColor="bg-brand-teal" />
        {isAdmin && (
          <NavItem icon={ShieldCheck} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} badge={(Object.values(unreadMessagesCounts) as number[]).reduce((a, b) => a + b, 0)} activeColor="bg-brand-teal" />
        )}
      </nav>

      {/* Global Modals */}
      <AnimatePresence>
        {showMedal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMedal(false)}
              className="absolute inset-0 bg-slate-50/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl z-10 p-8 text-center"
            >
              <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <Star size={48} className="text-amber-400 fill-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-wide">Objectif Atteint !</h3>
              <p className="text-slate-600 mb-6">
                Félicitations ! Vous avez brûlé plus de {getWeeklyExerciseGoal()} kcal cette semaine. Continuez à bouger chaque jour pour maintenir ce rythme !
              </p>
              <button 
                onClick={() => setShowMedal(false)}
                className="w-full py-3 bg-amber-500 text-slate-950 font-black uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-colors"
              >
                Super !
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWeightModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeightModal(false)}
              className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Scale className="text-brand-teal" />
                  Ajuster le poids
                </h3>
                <button 
                  onClick={() => setShowWeightModal(false)}
                  className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Votre poids actuel (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-200 rounded-xl p-4 text-slate-900 font-bold text-lg focus:border-brand-teal outline-none transition-colors"
                    placeholder="Ex: 75.5"
                  />
                </div>
                
                <button
                  onClick={() => {
                    const weight = parseFloat(weightInput);
                    if (!isNaN(weight) && weight > 0) {
                      logWeight('Poids', weight);
                      
                      // Also update the main profile weight
                      setDoc(doc(db, 'users', user!.uid), { weight }, { merge: true });
                      setProfile(prev => ({ ...prev, weight }));
                      
                      setShowWeightModal(false);
                    }
                  }}
                  className="w-full py-4 bg-brand-teal text-slate-950 font-black uppercase tracking-wider rounded-xl hover:bg-brand-teal/90 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showActivityModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActivityModal(false)}
              className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl z-10 p-6"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Flame className="text-brand-teal" />
                Ajouter une activité
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Activité</label>
                  <select 
                    value={activityInput.name}
                    onChange={(e) => setActivityInput({...activityInput, name: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-brand-teal outline-none"
                  >
                    <option value="Marche">Marche</option>
                    <option value="Vélo extérieur">Vélo extérieur</option>
                    <option value="Hockey">Hockey</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Natation">Natation</option>
                    <option value="Ski de fond">Ski de fond</option>
                    <option value="Ski alpin">Ski alpin</option>
                    <option value="Danse">Danse</option>
                    <option value="Gymnastique">Gymnastique</option>
                    <option value="Boxe">Boxe</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Durée (minutes)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="5" max="180" step="5"
                      value={activityInput.duration}
                      onChange={(e) => setActivityInput({...activityInput, duration: parseInt(e.target.value)})}
                      className="flex-1 accent-brand-teal"
                    />
                    <span className="text-xl font-bold text-slate-900 w-16 text-right">{activityInput.duration}m</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Intensité</label>
                  <div className="flex gap-2">
                    {['Légère', 'Modérée', 'Élevée'].map(int => (
                      <button
                        key={int}
                        onClick={() => setActivityInput({...activityInput, intensity: int})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                          activityInput.intensity === int 
                            ? 'bg-brand-teal text-slate-950' 
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setShowActivityModal(false)}
                    className="flex-1 py-3 bg-slate-800 text-slate-900 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={() => {
                      let multiplier = 5;
                      if (activityInput.intensity === 'Légère') multiplier = 3;
                      if (activityInput.intensity === 'Élevée') multiplier = 8;
                      const estimatedCals = activityInput.duration * multiplier;
                      logBurnedCalories(estimatedCals, activityInput.name);
                      setShowActivityModal(false);
                    }}
                    className="flex-1 py-3 bg-brand-teal text-slate-950 font-bold rounded-xl hover:bg-brand-teal/90 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGroceryModal && nutritionPlan?.content?.grocery_list && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGroceryModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 z-10 max-h-[85vh] flex flex-col"
            >
              <div className="bg-brand-teal p-6 text-white flex items-center justify-between shadow-[0_4px_20px_rgba(124,6,32,0.3)]">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={24} />
                  <h3 className="text-xl font-bold font-display text-white">Liste d'épicerie</h3>
                </div>
                <button 
                  onClick={() => setShowGroceryModal(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors flex items-center justify-center border border-white/20"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {(nutritionPlan.content.grocery_list as any[]).map((categoryObject: any, idx: number) => {
                  let img = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                  if (categoryObject.category?.toLowerCase().includes('fruit') || categoryObject.category?.toLowerCase().includes('légume')) img = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400&auto=format&fit=crop";
                  if (categoryObject.category?.toLowerCase().includes('viande') || categoryObject.category?.toLowerCase().includes('volaille')) img = "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=400&auto=format&fit=crop";
                  if (categoryObject.category?.toLowerCase().includes('poisson') || categoryObject.category?.toLowerCase().includes('mer')) img = "https://images.unsplash.com/photo-1615141982883-c7da0faeb8eb?q=80&w=400&auto=format&fit=crop";
                  if (categoryObject.category?.toLowerCase().includes('laitier') || categoryObject.category?.toLowerCase().includes('oeuf')) img = "https://images.unsplash.com/photo-1550583724-b2692bcba24c?q=80&w=400&auto=format&fit=crop";

                  return (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                        <img src={img} alt={categoryObject.category} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{categoryObject.category}</h4>
                    </div>
                    <ul className="space-y-2 pl-4">
                      {categoryObject.items?.map((item: string, j: number) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <CheckCircle2 size={16} className="text-rose-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )})}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setShowGroceryModal(false)}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-bold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSleepModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSleepModal(false)}
              className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl z-10 p-6"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="text-brand-teal" />
                Enregistrer la nuit
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Heures de sommeil</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" max="14" step="0.5"
                      value={sleepInput.hours}
                      onChange={(e) => setSleepInput({...sleepInput, hours: parseFloat(e.target.value)})}
                      className="flex-1 accent-brand-teal"
                    />
                    <span className="text-xl font-bold text-slate-900 w-12 text-right">{sleepInput.hours}h</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Qualité du sommeil</label>
                  <div className="flex items-center justify-between px-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSleepInput({...sleepInput, quality: i + 1})}
                        className="p-2 transition-transform hover:scale-110"
                      >
                        <Star 
                          size={28} 
                          className={i < sleepInput.quality ? "text-yellow-400 fill-yellow-400" : "text-slate-600"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setShowSleepModal(false)}
                    className="flex-1 py-3 bg-slate-800 text-slate-900 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSaveSleep}
                    className="flex-1 py-3 bg-brand-teal text-slate-950 font-bold rounded-xl hover:bg-brand-teal/90 transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCircuit && (
          <CircuitTimer exercises={activeCircuit} onClose={() => setActiveCircuit(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 pb-24 sm:pb-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                    <Dumbbell size={20} className="text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Exercice</h3>
                    <p className="text-[10px] text-rose-500 uppercase font-bold tracking-wider">{selectedExercise.target_muscle || 'Général'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedExercise(null)} 
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedExercise.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-xs font-bold">
                      {selectedExercise.sets} séries
                    </span>
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold">
                      {selectedExercise.duration_seconds > 0 ? `${selectedExercise.duration_seconds} sec` : `${selectedExercise.reps} reps`}
                    </span>
                    {selectedExercise.rest_seconds > 0 && (
                      <span className="px-3 py-1 bg-slate-800 text-slate-500 rounded-full text-xs font-bold flex items-center gap-1">
                        <Clock size={12} />
                        {selectedExercise.rest_seconds}s repos
                      </span>
                    )}
                  </div>
                </div>

                {selectedExercise.instructions && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Info size={14} />
                      Instructions
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedExercise.instructions}</p>
                  </div>
                )}

                {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Conseils de pro</h4>
                    <ul className="space-y-2">
                      {selectedExercise.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-500 bg-white/90 p-3 rounded-xl border border-slate-100">
                          <span className="text-rose-500 font-bold mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-brand-teal" />
                      Séries à compléter
                    </h4>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="Poids (kg)" 
                        value={exerciseWeightInput}
                        onChange={(e) => setExerciseWeightInput(e.target.value)}
                        className="w-24 bg-slate-800/50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 text-right focus:border-brand-teal outline-none"
                      />
                      <button 
                        onClick={() => {
                          if (exerciseWeightInput) {
                            logWeight(selectedExercise.name, parseFloat(exerciseWeightInput));
                          }
                        }}
                        className="bg-brand-teal/20 text-brand-teal p-1.5 rounded-lg hover:bg-brand-teal/30 transition-colors"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {Array.from({ length: selectedExercise.sets || 0 }).map((_, i) => {
                      const dayProgress = exerciseProgress[selectedDayIndex] || {};
                      const isDone = (dayProgress[selectedExercise.name] || [])[i];
                      return (
                        <button
                          key={i}
                          onClick={() => toggleSet(selectedExercise, i)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            isDone 
                              ? 'bg-brand-teal/10 border-brand-teal/50 text-brand-teal' 
                              : 'bg-slate-800/50 border-slate-100 text-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isDone ? 'bg-brand-teal border-brand-teal' : 'border-slate-700'
                            }`}>
                              {isDone && <CheckCircle2 size={14} />}
                            </div>
                            <span className="font-bold">Série {i + 1}</span>
                          </div>
                          <span className="text-xs font-bold opacity-60">
                            {selectedExercise.duration_seconds > 0 ? `${selectedExercise.duration_seconds} sec` : `${selectedExercise.reps} reps`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={() => markExerciseAsDone(selectedExercise)}
                  className="w-full py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Fait
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-md" onClick={() => setConfirmDialog(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">Confirmation</h3>
              <p className="text-slate-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-900 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-900 bg-red-500 hover:bg-red-400 transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-6 right-6 bg-green-500 text-slate-900 p-4 rounded-xl font-bold text-center shadow-xl z-[100]"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
