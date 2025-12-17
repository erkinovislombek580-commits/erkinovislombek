import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, Volume2, Globe, Menu, X, Camera, Play, StopCircle, Plus, Trash2, ShieldAlert, Loader2, Paperclip, Copy, Check, ZoomIn, ZoomOut, SkipBack, SkipForward, MonitorPlay, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import Background from './components/Background';
import NanoCore from './components/NanoCore';
import { jarvizServer } from './services/geminiService';
import { Message, ConnectionStatus, MediaData, Translation, ChatSession } from './types';
import ReactMarkdown from 'react-markdown';

const SUPPORTED_LANGUAGES = [
    { code: 'uz', label: "UZ", flag: '🇺🇿', locale: 'uz-UZ' },
    { code: 'ru', label: "RU", flag: '🇷🇺', locale: 'ru-RU' },
    { code: 'en', label: "EN", flag: '🇺🇸', locale: 'en-US' },
    { code: 'ar', label: "AR", flag: '🇸🇦', locale: 'ar-SA' },
    { code: 'ko', label: "KR", flag: '🇰🇷', locale: 'ko-KR' },
    { code: 'zh', label: "CN", flag: '🇨🇳', locale: 'zh-CN' },
    { code: 'tr', label: "TR", flag: '🇹🇷', locale: 'tr-TR' },
    { code: 'es', label: "ES", flag: '🇪🇸', locale: 'es-ES' },
    { code: 'fr', label: "FR", flag: '🇫🇷', locale: 'fr-FR' },
    { code: 'de', label: "DE", flag: '🇩🇪', locale: 'de-DE' },
    { code: 'ja', label: "JP", flag: '🇯🇵', locale: 'ja-JP' },
    { code: 'hi', label: "IN", flag: '🇮🇳', locale: 'hi-IN' },
];

const TRANSLATIONS: Record<string, Translation> = {
    uz: { newChat: "YANGI CHAT", settings: "SOZLAMALAR", language: "TILNI TANLASH", placeholder: "Buyruq bering (yoki Ctrl+V)...", generating: "JAVOB TAYYORLANMOQDA...", systemOnline: "TIZIM ISHLAMOQDA", ready: "JARVIZ AI TAYYOR", mediaReady: "Media Tayyor", fileLimitError: "Maksimal 10 ta fayl.", filesReady: "Fayl tayyor", rec: "YOZILMOQDA", copy: "NUSXA OLISH", copied: "NUSXALANDI", code: "KOD", reset: "ASL HOLAT", user: "SIZ", security: "XAVFSIZLIK", jarviz: "JARVIZ", files: "FAYL", uploadTooltip: "Rasm yoki Video yuklash", history: "MULOQOT TARIXI", noHistory: "Tarix bo'sh", untitled: "Nomsiz suhbat", deleteConfirm: "O'chirilsinmi?" },
    en: { newChat: "NEW CHAT", settings: "SETTINGS", language: "INTERFACE LANGUAGE", placeholder: "Enter command (or Ctrl+V)...", generating: "GENERATING RESPONSE...", systemOnline: "SYSTEM ONLINE", ready: "JARVIZ AI READY", mediaReady: "Media Ready", fileLimitError: "Max 10 files.", filesReady: "Files ready", rec: "REC", copy: "COPY", copied: "COPIED", code: "CODE", reset: "RESET", user: "YOU", security: "SECURITY", jarviz: "JARVIZ", files: "FILES", uploadTooltip: "Upload Image or Video", history: "CHAT HISTORY", noHistory: "No history", untitled: "Untitled Chat", deleteConfirm: "Delete?" },
    ru: { newChat: "НОВЫЙ ЧАТ", settings: "НАСТРОЙКИ", language: "ЯЗЫК ИНТЕРФЕЙСА", placeholder: "Введите команду (или Ctrl+V)...", generating: "ГЕНЕРАЦИЯ ОТВЕТА...", systemOnline: "СИСТЕМА В СЕТИ", ready: "JARVIZ AI ГОТОВ", mediaReady: "Медиа готово", fileLimitError: "Макс 10 файлов.", filesReady: "Файлов готово", rec: "ЗАПИСЬ", copy: "КОПИРОВАТЬ", copied: "СКОПИРОВАНО", code: "КОД", reset: "СБРОС", user: "ВЫ", security: "БЕЗОПАСНОСТЬ", jarviz: "ДЖАРВИЗ", files: "ФАЙЛ", uploadTooltip: "Загрузить фото или видео", history: "ИСТОРИЯ ЧАТОВ", noHistory: "История пуста", untitled: "Без названия", deleteConfirm: "Удалить?" },
};

const WaveformIcon = () => (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
        <div className="flex w-[200%] animate-[slideLeft_1.5s_linear_infinite]">
             <svg viewBox="0 0 100 50" className="w-full h-full text-emerald-400 stroke-current fill-none stroke-[3px]" preserveAspectRatio="none">
                 <path d="M0 25 L10 25 L15 10 L25 40 L35 25 L45 25 L50 25 L60 25 L65 5 L75 45 L85 25 L100 25" />
             </svg>
             <svg viewBox="0 0 100 50" className="w-full h-full text-emerald-400 stroke-current fill-none stroke-[3px]" preserveAspectRatio="none">
                 <path d="M0 25 L10 25 L15 10 L25 40 L35 25 L45 25 L50 25 L60 25 L65 5 L75 45 L85 25 L100 25" />
             </svg>
        </div>
    </div>
);

const RealGlobeIcon = () => (
    <div className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden bg-[#1a1205] shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-500/50">
        <div className="flex w-[200%] h-full animate-[slideLeft_15s_linear_infinite]">
             <svg viewBox="0 0 360 180" className="w-1/2 h-full text-amber-500 fill-current shrink-0" preserveAspectRatio="none">
                 <path d="M30,30 L50,20 L80,20 L100,10 L120,20 L110,40 L90,50 L70,80 L50,70 L40,50 L30,40 Z" opacity="0.9" />
                 <path d="M80,90 L110,90 L120,110 L100,150 L90,160 L80,140 L75,110 Z" opacity="0.9" />
                 <path d="M160,30 L180,20 L200,30 L190,50 L160,50 L150,40 Z" opacity="0.9" />
                 <path d="M150,60 L180,60 L190,80 L200,110 L180,130 L160,120 L150,90 Z" opacity="0.9" />
                 <path d="M200,30 L250,20 L290,20 L310,40 L300,70 L270,90 L240,80 L210,60 Z" opacity="0.9" />
             </svg>
             <svg viewBox="0 0 360 180" className="w-1/2 h-full text-amber-500 fill-current shrink-0" preserveAspectRatio="none">
                 <path d="M30,30 L50,20 L80,20 L100,10 L120,20 L110,40 L90,50 L70,80 L50,70 L40,50 L30,40 Z" opacity="0.9" />
                 <path d="M80,90 L110,90 L120,110 L100,150 L90,160 L80,140 L75,110 Z" opacity="0.9" />
                 <path d="M160,30 L180,20 L200,30 L190,50 L160,50 L150,40 Z" opacity="0.9" />
             </svg>
        </div>
        <div className="absolute inset-0 rounded-full shadow-[inset_-8px_-4px_12px_rgba(0,0,0,0.95),inset_4px_4px_12px_rgba(251,191,36,0.3)] pointer-events-none z-10"></div>
    </div>
);

const PresentationViewer = ({ slides }: { slides: any[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const nextSlide = () => setCurrentIndex(prev => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
    return (
        <div className="mt-4 mb-2 w-full max-w-2xl mx-auto relative bg-black/40 backdrop-blur-xl border border-cyan-500/40 rounded-xl overflow-hidden shadow-lg">
            <div className="h-8 bg-cyan-950/50 border-b border-cyan-500/20 flex items-center justify-between px-4">
                 <div className="flex items-center gap-2"><MonitorPlay size={14} className="text-cyan-400" /><span className="text-[10px] font-orbitron text-cyan-300">JARVIZ PRESENTER</span></div>
                 <span className="text-[10px] font-mono text-cyan-500">{currentIndex + 1} / {slides.length}</span>
            </div>
            <div className="p-8 md:p-12 min-h-[300px] relative">
                <h3 className="text-2xl font-orbitron font-bold text-white mb-6">{slides[currentIndex].title}</h3>
                <ul className="space-y-4">
                    {slides[currentIndex].content.map((point: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-cyan-100 font-rajdhani text-lg">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0"></span>{point}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="absolute inset-y-0 left-0 flex items-center"><button onClick={prevSlide} className="p-2 text-cyan-500"><ChevronLeft size={24} /></button></div>
            <div className="absolute inset-y-0 right-0 flex items-center"><button onClick={nextSlide} className="p-2 text-cyan-500"><ChevronRight size={24} /></button></div>
        </div>
    );
};

const MessageItem = React.memo(({ msg, onMediaClick, onSpeak, isSpeaking, labels }: { msg: Message, onMediaClick: (data: MediaData) => void, onSpeak: (id: string, text: string) => void, isSpeaking: boolean, labels: Translation }) => {
    const isSystemAlert = msg.text.includes("[SYSTEM ALERT]");
    const extractSlides = (text: string) => {
        try {
            const jsonMatch = text.match(/```json\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/);
            if (jsonMatch) return JSON.parse(jsonMatch[1]);
        } catch (e) { return null; }
        return null;
    };
    const slides = msg.role === 'model' ? extractSlides(msg.text) : null;
    const cleanText = slides ? msg.text.replace(/```json[\s\S]*?```/, '').trim() : msg.text;
    const alertStyle = isSystemAlert ? "bg-red-950/80 border-2 border-red-500" : msg.role === 'user' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-50' : 'bg-black/60 border border-slate-700/50 text-slate-100';

    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn w-full mb-4`}>
            <div className={`relative max-w-[95%] p-4 rounded-xl shadow-lg ${alertStyle}`}>
                <div className="text-sm leading-relaxed font-rajdhani overflow-x-auto select-text">
                    <ReactMarkdown components={{
                        code({node, className, children, ...props}) {
                            return <code className="bg-cyan-950/50 text-cyan-200 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                        }
                    }}>{cleanText.replace("[SYSTEM ALERT]", "").trim()}</ReactMarkdown>
                </div>
                {msg.media && <div className="mt-3 grid grid-cols-2 gap-2">{msg.media.map((m, i) => <div key={i} onClick={() => onMediaClick(m)} className="h-32 border border-cyan-500/30 overflow-hidden rounded cursor-pointer"><img src={m.data} className="w-full h-full object-cover" /></div>)}</div>}
                {msg.role === 'model' && (
                    <button onClick={() => onSpeak(msg.id, cleanText)} className="absolute bottom-2 right-2 p-1.5 rounded-full text-cyan-500 hover:text-white transition-all">
                        {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
                    </button>
                )}
            </div>
            {slides && <PresentationViewer slides={slides} />}
        </div>
    );
});

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.CONNECTED);
    const [language, setLanguage] = useState<string>('uz');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewingMedia, setViewingMedia] = useState<MediaData | null>(null);
    const [mediaQueue, setMediaQueue] = useState<MediaData[]>([]);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        const saved = localStorage.getItem('jarviz_history');
        return saved ? JSON.parse(saved) : [];
    });
    const [currentId, setCurrentId] = useState(Date.now().toString());

    const t = TRANSLATIONS[language] || TRANSLATIONS['uz'];
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { localStorage.setItem('jarviz_history', JSON.stringify(sessions)); }, [sessions]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() && mediaQueue.length === 0) return;
        const currentMedia = [...mediaQueue];
        // Fixed: Explicitly type newUserMsg to prevent role string inference errors.
        const newUserMsg: Message = { 
            id: Date.now().toString(), 
            role: 'user' as const, 
            text: inputValue, 
            media: currentMedia.length > 0 ? currentMedia : undefined, 
            timestamp: new Date() 
        };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setMediaQueue([]);
        setStatus(ConnectionStatus.PROCESSING);
        
        const aiId = (Date.now() + 1).toString();
        // Fixed: Use 'model' as const to satisfy the Message interface role requirement.
        setMessages(prev => [...prev, { id: aiId, role: 'model' as const, text: '', timestamp: new Date() }]);
        
        let full = "";
        await jarvizServer.sendMessageStream(newUserMsg.text, currentMedia, false, language, (chunk) => {
            full += chunk;
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: full } : m));
        });
        setStatus(ConnectionStatus.CONNECTED);
        
        setSessions(prev => {
            const idx = prev.findIndex(s => s.id === currentId);
            // Fixed: Explicitly typed newMsg as Message[] to ensure the array contains valid Message objects.
            const newMsg: Message[] = [
                ...messages, 
                newUserMsg, 
                { id: aiId, role: 'model' as const, text: full, timestamp: new Date() }
            ];
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], messages: newMsg, timestamp: Date.now() };
                return updated;
            } else {
                return [{ id: currentId, title: newUserMsg.text.slice(0, 20), messages: newMsg, timestamp: Date.now(), language }, ...prev];
            }
        });
    };

    const speak = (id: string, text: string) => {
        if (speakingMessageId === id) { window.speechSynthesis.cancel(); setSpeakingMessageId(null); setStatus(ConnectionStatus.CONNECTED); }
        else {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.onstart = () => { setSpeakingMessageId(id); setStatus(ConnectionStatus.SPEAKING); };
            u.onend = () => { setSpeakingMessageId(null); setStatus(ConnectionStatus.CONNECTED); };
            window.speechSynthesis.speak(u);
        }
    };

    const newChat = () => { setMessages([]); setMediaQueue([]); setCurrentId(Date.now().toString()); jarvizServer.startChat(); setIsMenuOpen(false); };

    return (
        <div className="flex h-[100dvh] flex-col relative overflow-hidden font-rajdhani text-cyan-50">
            <Background />
            <header className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-cyan-900/30 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-cyan-400"><Menu size={20} /></button>
                    <div className="flex items-center gap-2">
                        {status === ConnectionStatus.SPEAKING ? <div className="w-8 h-8 relative"><WaveformIcon /></div> : <div className="w-8 h-8 relative"><RealGlobeIcon /></div>}
                        <h1 className="font-orbitron text-lg font-bold">JARVIZ</h1>
                    </div>
                </div>
                <div className="text-[10px] font-mono text-cyan-500">{t.systemOnline}</div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none"><NanoCore status={status} analyser={null} /></div>
                <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar px-4 py-6">
                    {messages.length === 0 && <div className="h-full flex items-center justify-center text-cyan-500/50 font-orbitron text-xs tracking-widest">{t.ready}</div>}
                    {messages.map(m => <MessageItem key={m.id} msg={m} onMediaClick={setViewingMedia} onSpeak={speak} isSpeaking={speakingMessageId === m.id} labels={t} />)}
                    {status === ConnectionStatus.PROCESSING && <div className="pl-4 py-2 text-cyan-400 animate-pulse text-xs">{t.generating}</div>}
                    <div ref={endRef} />
                </div>
            </main>

            <footer className="relative z-30 p-3 bg-black/80 backdrop-blur-lg border-t border-cyan-900/30">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <button className="p-3 rounded-lg bg-cyan-900/20 text-cyan-400"><Paperclip size={20} /></button>
                    <div className="flex-1 bg-black/50 border border-cyan-900/30 rounded-lg px-4 py-3">
                        <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder={t.placeholder} className="w-full bg-transparent outline-none text-cyan-100" />
                    </div>
                    <button onClick={handleSendMessage} className="p-3 rounded-lg bg-cyan-600 text-white"><Send size={20} /></button>
                </div>
            </footer>

            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#090b10] border-r border-cyan-900/30 transform transition-transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col p-4`}>
                <div className="flex justify-between items-center mb-6"><h2 className="font-orbitron text-sm font-bold text-cyan-400">{t.settings}</h2><button onClick={() => setIsMenuOpen(false)}><X size={20} /></button></div>
                <button onClick={newChat} className="w-full py-3 mb-6 bg-cyan-900/50 border border-cyan-500/30 rounded font-orbitron text-xs font-bold text-white flex items-center justify-center gap-2"><Plus size={16} />{t.newChat}</button>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] text-cyan-500/50 mb-2">{t.history}</p>
                    {sessions.map(s => <div key={s.id} onClick={() => { setMessages(s.messages); setCurrentId(s.id); setIsMenuOpen(false); jarvizServer.startChat(s.messages); }} className={`p-2 rounded mb-1 text-xs truncate cursor-pointer ${currentId === s.id ? 'bg-cyan-950 text-cyan-100' : 'text-slate-500 hover:bg-white/5'}`}>{s.title}</div>)}
                </div>
            </div>
        </div>
    );
};

export default App;