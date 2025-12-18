
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, Menu, X, Camera, Plus, Paperclip, MonitorPlay, ChevronLeft, ChevronRight, StopCircle, Play, FileText, Trash2, Video } from 'lucide-react';
import Background from './components/Background';
import NanoCore from './components/NanoCore';
import { jarvizServer } from './services/geminiService';
import { Message, ConnectionStatus, MediaData, Translation, ChatSession } from './types';
import ReactMarkdown from 'react-markdown';

const SUPPORTED_LANGUAGES = [
    { code: 'uz', flag: '🇺🇿', locale: 'uz-UZ' },
    { code: 'en', flag: '🇺🇸', locale: 'en-US' },
    { code: 'ru', flag: '🇷🇺', locale: 'ru-RU' }
];

const TRANSLATIONS: Record<string, Translation> = {
    uz: { newChat: "YANGI CHAT", settings: "SOZLAMALAR", language: "TIL", placeholder: "Buyruq bering yoki Ctrl+V...", generating: "TAYYORLANMOQDA...", systemOnline: "ONLINE", ready: "JARVIZ TAYYOR", mediaReady: "Media Tayyor", fileLimitError: "Maks 10 fayl.", filesReady: "Fayllar", rec: "REC", copy: "NUSXA", copied: "OK", code: "KOD", reset: "RESET", user: "SIZ", security: "XAVFSIZLIK", jarviz: "JARVIZ", files: "FAYL", uploadTooltip: "Yuklash", history: "TARIX", noHistory: "Bo'sh", untitled: "Nomsiz", deleteConfirm: "O'chirish?" },
};

const MediaPreviewModal = ({ media, onClose }: { media: MediaData, onClose: () => void }) => (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
        <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white z-50 transition-all"><X size={32}/></button>
        <div className="max-w-5xl w-full max-h-[85vh] flex items-center justify-center relative">
            {media.type === 'image' && <img src={media.data} className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_80px_rgba(6,182,212,0.4)]" />}
            {media.type === 'video' && <video src={media.data} controls autoPlay className="max-w-full max-h-full rounded-xl shadow-2xl" />}
            {media.type === 'file' && (
                <div className="bg-cyan-950/30 p-16 rounded-3xl border border-cyan-500/40 text-center backdrop-blur-md">
                    <FileText size={100} className="mx-auto text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                    <h2 className="text-3xl font-orbitron text-white mb-2">{media.fileName}</h2>
                    <p className="text-cyan-500 font-mono uppercase tracking-widest">{media.mimeType}</p>
                </div>
            )}
        </div>
    </div>
);

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.CONNECTED);
    const [lang, setLang] = useState('uz');
    const [mediaQueue, setMediaQueue] = useState<MediaData[]>([]);
    const [isMenu, setIsMenu] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>(() => JSON.parse(localStorage.getItem('j_h') || '[]'));
    const [currentId, setCurrentId] = useState(Date.now().toString());
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [viewingMedia, setViewingMedia] = useState<MediaData | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const endRef = useRef<HTMLDivElement>(null);
    const t = TRANSLATIONS[lang] || TRANSLATIONS['uz'];

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, status]);

    // Ctrl+V Paste Support
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            setMediaQueue(prev => [...prev, { type: 'image', data: event.target?.result as string, mimeType: blob.type }]);
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setIsCameraOpen(true);
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }, 100);
        } catch (err) {
            alert("Kameraga ruxsat berilmadi yoki kamera topilmadi.");
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        setIsRecording(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            setMediaQueue(prev => [...prev, { type: 'image', data: dataUrl, mimeType: 'image/png' }]);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            const stream = videoRef.current?.srcObject as MediaStream;
            if (!stream) return;
            chunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
                const reader = new FileReader();
                reader.onload = (e) => setMediaQueue(p => [...p, { type: 'video', data: e.target?.result as string, mimeType: 'video/mp4' }]);
                reader.readAsDataURL(blob);
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        }
    };

    const handleSend = async () => {
        if (!input.trim() && mediaQueue.length === 0) return;
        const currentMedia = [...mediaQueue];
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, media: currentMedia, timestamp: new Date() };
        
        setMessages(p => [...p, userMsg]);
        setInput('');
        setMediaQueue([]);
        setStatus(ConnectionStatus.PROCESSING);

        const aiId = (Date.now() + 1).toString();
        setMessages(p => [...p, { id: aiId, role: 'model', text: '', timestamp: new Date() }]);

        try {
            let full = "";
            await jarvizServer.sendMessageStream(userMsg.text, currentMedia, false, lang, (chunk) => {
                full += chunk;
                setMessages(p => p.map(m => m.id === aiId ? { ...m, text: full } : m));
            });
            setStatus(ConnectionStatus.CONNECTED);
        } catch (e) {
            setMessages(p => p.map(m => m.id === aiId ? { ...m, text: "Aloqa uzildi. Fayl juda katta bo'lishi mumkin.", isError: true } : m));
            setStatus(ConnectionStatus.CONNECTED);
        }
    };

    return (
        <div className="flex h-[100dvh] flex-col relative bg-[#050505] text-cyan-50 font-rajdhani overflow-hidden">
            <Background />
            
            <header className="z-30 flex items-center justify-between px-6 py-4 border-b border-cyan-900/30 bg-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMenu(!isMenu)} className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"><Menu size={24}/></button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative">
                             {status === ConnectionStatus.SPEAKING ? (
                                <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-full border-2 border-emerald-400 rounded-full animate-ping opacity-20"></div><Volume2 className="text-emerald-400" /></div>
                             ) : <div className="w-10 h-10 bg-cyan-500/20 rounded-full border border-cyan-500/50 flex items-center justify-center animate-pulse"><MonitorPlay size={20} className="text-cyan-400"/></div>}
                        </div>
                        <h1 className="font-orbitron text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">JARVIZ</h1>
                    </div>
                </div>
                <div className="hidden md:block text-[10px] font-mono text-cyan-500/60 uppercase tracking-[0.3em]">{t.systemOnline}</div>
            </header>

            <main className="flex-1 relative overflow-hidden flex flex-col items-center">
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <NanoCore status={status} analyser={null} />
                </div>
                <div className="relative z-10 w-full max-w-4xl h-full overflow-y-auto custom-scrollbar px-6 py-10">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-6">
                            <div className="w-32 h-32 border-2 border-cyan-500/20 rounded-full flex items-center justify-center animate-spin-slow"><MonitorPlay size={48} className="text-cyan-500/40" /></div>
                            <p className="font-orbitron text-xs tracking-[0.5em]">{t.ready}</p>
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} mb-8 w-full animate-fadeIn`}>
                            <div className={`relative max-w-[92%] p-5 rounded-2xl shadow-2xl ${m.role === 'user' ? 'bg-cyan-950/30 border border-cyan-500/30 text-white' : 'bg-black/60 border border-slate-700/50 text-slate-100'}`}>
                                <div className="text-sm md:text-base leading-relaxed font-rajdhani prose prose-invert select-text">
                                    <ReactMarkdown>{m.text}</ReactMarkdown>
                                </div>
                                {m.media && m.media.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {m.media.map((med, i) => (
                                            <div key={i} onClick={() => setViewingMedia(med)} className="relative aspect-video rounded-xl overflow-hidden border border-cyan-500/30 cursor-pointer hover:scale-[1.02] transition-transform bg-cyan-950/20 group">
                                                {med.type === 'image' && <img src={med.data} className="w-full h-full object-cover" />}
                                                {med.type === 'video' && <div className="w-full h-full flex items-center justify-center"><Play size={32} className="text-cyan-400 group-hover:scale-125 transition-transform" /></div>}
                                                {med.type === 'file' && <div className="w-full h-full flex flex-col items-center justify-center p-4"><FileText size={32} className="text-cyan-400 mb-2" /><span className="text-[10px] truncate w-full text-center font-mono">{med.fileName}</span></div>}
                                                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {m.role === 'model' && (
                                    <button onClick={() => {
                                        if (speakingId === m.id) { window.speechSynthesis.cancel(); setSpeakingId(null); }
                                        else {
                                            window.speechSynthesis.cancel();
                                            const u = new SpeechSynthesisUtterance(m.text);
                                            u.lang = 'uz-UZ';
                                            u.onstart = () => setSpeakingId(m.id);
                                            u.onend = () => setSpeakingId(null);
                                            window.speechSynthesis.speak(u);
                                        }
                                    }} className="mt-4 p-2 rounded-full hover:bg-white/5 transition-colors text-cyan-500">
                                        {speakingId === m.id ? <StopCircle size={22}/> : <Volume2 size={22}/>}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>

                {/* MODAL CAMERA UI */}
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-6 animate-fadeIn backdrop-blur-md">
                        <div className="relative w-full max-w-3xl aspect-video bg-black rounded-[2rem] overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_100px_rgba(6,182,212,0.3)]">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute top-6 right-6 flex gap-4">
                                <button onClick={stopCamera} className="p-4 bg-red-500/20 hover:bg-red-500 text-white rounded-2xl border border-red-500/50 transition-all shadow-lg"><X size={28}/></button>
                            </div>
                            {isRecording && <div className="absolute top-6 left-6 px-4 py-2 bg-red-600 rounded-full flex items-center gap-2 font-black text-xs animate-pulse shadow-lg">REC ●</div>}
                            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12">
                                <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white/10 border-4 border-white/50 flex items-center justify-center hover:bg-white/30 hover:scale-110 active:scale-90 transition-all shadow-2xl"><Camera size={36}/></button>
                                <button onClick={toggleRecording} className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 border-red-200 scale-110 animate-pulse' : 'bg-cyan-500/20 border-cyan-400 hover:bg-cyan-500/40 hover:scale-110'}`}>
                                    {isRecording ? <StopCircle size={36}/> : <Video size={36}/>}
                                </button>
                            </div>
                            <div className="absolute inset-0 pointer-events-none border-[20px] border-cyan-500/5 [mask-image:radial-gradient(circle,transparent_70%,black_100%)]"></div>
                        </div>
                        <div className="mt-8 font-orbitron text-cyan-400 tracking-[0.5em] text-sm animate-pulse">OPTICAL CORE ACTIVE</div>
                    </div>
                )}
            </main>

            <footer className="z-30 p-4 bg-black/80 backdrop-blur-2xl border-t border-cyan-900/30">
                <div className="max-w-4xl mx-auto">
                    {mediaQueue.length > 0 && (
                        <div className="flex gap-4 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                            {mediaQueue.map((m, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-2xl border-2 border-cyan-500/40 overflow-hidden shrink-0 group shadow-lg">
                                    {m.type === 'image' && <img src={m.data} className="w-full h-full object-cover" />}
                                    {m.type === 'video' && <div className="w-full h-full flex items-center justify-center bg-cyan-950"><Play size={20} className="text-cyan-400"/></div>}
                                    {m.type === 'file' && <div className="w-full h-full flex items-center justify-center bg-cyan-950"><FileText size={20} className="text-cyan-400"/></div>}
                                    <button onClick={() => setMediaQueue(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} className="text-white"/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <div className="flex gap-3">
                            <label className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 cursor-pointer hover:bg-cyan-500/10 transition-all shadow-inner">
                                <Paperclip size={24}/><input type="file" className="hidden" multiple onChange={e => {
                                    const files = Array.from(e.target.files || []);
                                    files.forEach((f: File) => {
                                        const r = new FileReader();
                                        r.onload = () => setMediaQueue(p => [...p, { 
                                            type: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : 'file', 
                                            data: r.result as string, 
                                            mimeType: f.type, 
                                            fileName: f.name 
                                        }]);
                                        r.readAsDataURL(f);
                                    });
                                }} />
                            </label>
                            <button onClick={startCamera} className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-all shadow-inner"><Camera size={24}/></button>
                        </div>
                        <div className="flex-1 bg-black/40 border border-cyan-500/30 rounded-3xl px-6 py-4 flex items-center shadow-2xl focus-within:border-cyan-400 transition-colors">
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={t.placeholder} className="w-full bg-transparent outline-none text-lg text-cyan-50 placeholder-cyan-900/40" />
                        </div>
                        <button onClick={handleSend} className="p-5 rounded-3xl bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-95 transition-all text-white"><Send size={28}/></button>
                    </div>
                </div>
            </footer>

            {viewingMedia && <MediaPreviewModal media={viewingMedia} onClose={() => setViewingMedia(null)} />}
            
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-[100] w-80 bg-[#07090e] border-r border-cyan-900/30 transform transition-transform duration-500 ease-in-out ${isMenu ? 'translate-x-0 shadow-[40px_0_80px_rgba(0,0,0,0.9)]' : '-translate-x-full'} flex flex-col p-8`}>
                <div className="flex justify-between items-center mb-10 border-b border-cyan-900/30 pb-6">
                    <h2 className="font-orbitron text-cyan-400 text-xs tracking-[0.3em] font-bold">{t.settings}</h2>
                    <button onClick={() => setIsMenu(false)} className="text-cyan-900 hover:text-cyan-400 transition-colors"><X size={24}/></button>
                </div>
                <button onClick={() => { setMessages([]); setMediaQueue([]); setIsMenu(false); jarvizServer.startChat(); setCurrentId(Date.now().toString()); }} className="w-full py-5 mb-10 bg-cyan-900/20 border border-cyan-500/40 rounded-2xl font-orbitron text-[10px] tracking-[0.3em] hover:bg-cyan-900/40 transition-all flex items-center justify-center gap-3 text-cyan-100 uppercase"><Plus size={18}/>{t.newChat}</button>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {sessions.map(s => (
                        <div key={s.id} onClick={() => { setMessages(s.messages); setCurrentId(s.id); setIsMenu(false); jarvizServer.startChat(s.messages); }} className={`p-4 rounded-2xl text-[11px] truncate cursor-pointer transition-all border font-rajdhani font-semibold ${currentId === s.id ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-100 shadow-lg' : 'border-transparent text-slate-500 hover:bg-white/5'}`}>{s.title}</div>
                    ))}
                </div>
                <div className="pt-8 border-t border-cyan-900/30 text-center text-[8px] font-orbitron text-cyan-900 uppercase tracking-widest font-black">JARVIZ Neural v3.5</div>
            </div>
        </div>
    );
};

export default App;
