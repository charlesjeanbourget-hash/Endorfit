import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ImagePlus, Loader2, User, RotateCcw } from 'lucide-react';
import { chatWithCoach } from '../services/geminiService';
import Markdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageBase64?: string;
};

export const AICoachWidget = ({ 
  userContext, 
  onUpdateProfile, 
  onUpdateWorkoutPlan, 
  onUpdateNutritionPlan 
}: { 
  userContext?: string,
  onUpdateProfile?: (updates: any) => Promise<void>,
  onUpdateWorkoutPlan?: (plan: any) => Promise<void>,
  onUpdateNutritionPlan?: (plan: any) => Promise<void>
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Salut ! Je suis SYNAPSE, ton coach IA d'élite. Comment puis-je t'aider aujourd'hui ? Je peux ajuster tes plans, analyser tes photos ou t'aider avec une blessure."
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        console.error("L'image est trop volumineuse (max 4Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userText = input.trim();
    const userImage = selectedImage;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      imageBase64: userImage || undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const historyForGemini = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          text: m.text || ' ',
          imageBase64: m.imageBase64
        })).concat({
          role: 'user',
          text: userText || ' ',
          imageBase64: userImage || undefined
        });

      const response = await chatWithCoach(historyForGemini, userContext);

      if (!response) throw new Error("Pas de réponse");

      const { text, functionCalls } = response;

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          try {
            if (call.name === 'update_profile' && onUpdateProfile) {
              const updates = typeof call.args.updates === 'string' ? JSON.parse(call.args.updates) : call.args.updates;
              await onUpdateProfile(updates);
            } else if (call.name === 'update_workout_plan' && onUpdateWorkoutPlan) {
              const plan = typeof call.args.plan === 'string' ? JSON.parse(call.args.plan) : call.args.plan;
              await onUpdateWorkoutPlan(plan);
            } else if (call.name === 'update_nutrition_plan' && onUpdateNutritionPlan) {
              const plan = typeof call.args.plan === 'string' ? JSON.parse(call.args.plan) : call.args.plan;
              await onUpdateNutritionPlan(plan);
            }
          } catch (err) {
            console.error(`Error executing tool ${call.name}:`, err);
          }
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'model',
        role: 'model',
        text: text || (functionCalls ? "J'ai mis à jour tes informations comme demandé !" : "Désolé, je n'ai pas pu générer de réponse.")
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'error',
        role: 'model',
        text: "Désolé, j'ai eu un petit problème technique. Peux-tu reformuler ta question ?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        id="open-coach-widget"
        onClick={() => setIsOpen(true)}
        className="fixed top-24 left-4 sm:left-6 z-[150] bg-brand-teal text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(124,6,32,0.4)] hover:bg-brand-teal/80 transition-all flex items-center gap-2 animate-bounce-slow"
      >
        <Bot size={24} />
      </button>
    );
  }

  return (
    <div className="fixed top-24 left-4 sm:left-6 z-[150] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-[350px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-teal/20 rounded-full flex items-center justify-center text-brand-teal">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Coach IA</h3>
            <p className="text-[10px] text-brand-teal font-bold uppercase tracking-wider">En ligne</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            id="clear-chat-history"
            onClick={() => {
              if (messages.length > 1) {
                setMessages([{
                  id: 'welcome',
                  role: 'model',
                  text: "Salut ! Je suis ton coach IA. Comment puis-je t'aider aujourd'hui ?"
                }]);
              }
            }}
            className="text-slate-400 hover:text-red-400 transition-colors p-1"
            title="Effacer la conversation"
          >
            <RotateCcw size={16} />
          </button>
          <button id="close-coach-widget" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 ${
              msg.role === 'user' 
                ? 'bg-brand-teal text-slate-950 rounded-tr-sm' 
                : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'
            }`}>
              {msg.imageBase64 && (
                <img src={msg.imageBase64} alt="Upload" className="w-full rounded-lg mb-2 object-cover max-h-40" />
              )}
              {msg.text && (
                <div className={`text-sm ${msg.role === 'user' ? 'font-medium' : 'prose prose-invert prose-sm max-w-none'}`}>
                  {msg.role === 'model' ? (
                    <div className="markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-white/5 p-4 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-400">Le coach analyse...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-800/50 border-t border-white/5">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-16 rounded-lg border border-white/10" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button 
            id="upload-coach-image"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-brand-teal transition-colors rounded-xl hover:bg-slate-700"
          >
            <ImagePlus size={20} />
          </button>
          <input 
            id="coach-chat-input"
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez une question..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-teal"
          />
          <button 
            id="send-coach-message"
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className="p-2 bg-brand-teal text-slate-950 rounded-xl hover:bg-brand-teal/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
