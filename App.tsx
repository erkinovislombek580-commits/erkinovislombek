import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, Volume2, Globe, Menu, X, Camera, Play, StopCircle, Plus, Trash2, ShieldAlert, Loader2, Paperclip, Copy, Check, ZoomIn, ZoomOut, SkipBack, SkipForward, ChevronDown, ChevronUp, MonitorPlay, ChevronLeft, ChevronRight, MessageSquare, History, Settings, Power } from 'lucide-react';
import Background from './components/Background';
import NanoCore from './components/NanoCore';
import { jarvizServer } from './services/geminiService';
import { Message, ConnectionStatus, MediaData, Translation, ChatSession } from './types';
import ReactMarkdown from 'react-markdown';

// --- Language Data & Translations ---
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
    ar: { newChat: "محادثة جديدة", settings: "الإعدادات", language: "لغة الواجهة", placeholder: "أدخل الأمر...", generating: "جارٍ إنشاء الرد...", systemOnline: "النظام متصل", ready: "جارفيز جاهز", mediaReady: "الوسائط جاهزة", fileLimitError: "الحد الأقصى 10 ملفات.", filesReady: "الملفات جاهزة", rec: "تسجيل", copy: "نسخ", copied: "تم النسخ", code: "رمز", reset: "إعادة تعيين", user: "أنت", security: "الأمان", jarviz: "جارفيز", files: "ملفات", uploadTooltip: "تحميل صورة أو فيديو", history: "سجل المحادثات", noHistory: "لا يوجد سجل", untitled: "محادثة بدون عنوان", deleteConfirm: "حذف؟" },
    ko: { newChat: "새 채팅", settings: "설정", language: "인터페이스 언어", placeholder: "명령 입력...", generating: "응답 생성 중...", systemOnline: "시스템 온라인", ready: "JARVIZ AI 준비", mediaReady: "미디어 준비", fileLimitError: "최대 10개 파일.", filesReady: "파일 준비", rec: "녹화", copy: "복사", copied: "복사됨", code: "코드", reset: "초기화", user: "사용자", security: "보안", jarviz: "자르비즈", files: "파일", uploadTooltip: "이미지 또는 비디오 업로드", history: "채팅 기록", noHistory: "기록 없음", untitled: "제목 없음", deleteConfirm: "삭제하시겠습니까?" },
    zh: { newChat: "新聊天", settings: "设置", language: "界面语言", placeholder: "输入命令...", generating: "正在生成响应...", systemOnline: "系统在线", ready: "JARVIZ AI 就绪", mediaReady: "媒体就绪", fileLimitError: "最多 10 个文件。", filesReady: "文件就绪", rec: "录制", copy: "复制", copied: "已复制", code: "代码", reset: "重置", user: "你", security: "安全", jarviz: "JARVIZ", files: "文件", uploadTooltip: "上传图片或视频", history: "聊天记录", noHistory: "无记录", untitled: "无标题", deleteConfirm: "删除？" },
    tr: { newChat: "YENİ SOHBET", settings: "AYARLAR", language: "ARAYÜZ DİLİ", placeholder: "Komut girin...", generating: "CEVAP OLUŞTURULUYOR...", systemOnline: "SİSTEM ÇEVRİMİÇİ", ready: "JARVIZ AI HAZIR", mediaReady: "Medya Hazır", fileLimitError: "Maks 10 dosya.", filesReady: "Dosyalar hazır", rec: "KAYIT", copy: "KOPYALA", copied: "KOPYALANDI", code: "KOD", reset: "SIFIRLA", user: "SİZ", security: "GÜVENLİK", jarviz: "JARVIZ", files: "DOSYA", uploadTooltip: "Resim veya Video Yükle", history: "SOHBET GEÇMİŞİ", noHistory: "Geçmiş yok", untitled: "Adsız Sohbet", deleteConfirm: "Silinsin mi?" },
    es: { newChat: "NUEVO CHAT", settings: "AJUSTES", language: "IDIOMA", placeholder: "Ingrese comando...", generating: "GENERANDO RESPUESTA...", systemOnline: "SISTEMA EN LÍNEA", ready: "JARVIZ AI LISTO", mediaReady: "Medios Listos", fileLimitError: "Máx 10 archivos.", filesReady: "Archivos listos", rec: "GRABAR", copy: "COPIAR", copied: "COPIADO", code: "CÓDIGO", reset: "REINICIAR", user: "TÚ", security: "SEGURIDAD", jarviz: "JARVIZ", files: "ARCHIVOS", uploadTooltip: "Subir imagen o video", history: "HISTORIAL", noHistory: "Sin historial", untitled: "Sin título", deleteConfirm: "¿Borrar?" },
    fr: { newChat: "NOUVEAU CHAT", settings: "PARAMÈTRES", language: "LANGUE", placeholder: "Entrez la commande...", generating: "GÉNÉRATION...", systemOnline: "SYSTÈME EN LIGNE", ready: "JARVIZ AI PRÊT", mediaReady: "Média Prêt", fileLimitError: "Max 10 fichiers.", filesReady: "Fichiers prêts", rec: "ENR", copy: "COPIER", copied: "COPIÉ", code: "CODE", reset: "RÉINITIALISER", user: "VOUS", security: "SÉCURITÉ", jarviz: "JARVIZ", files: "FICHIERS", uploadTooltip: "Télécharger image ou vidéo", history: "HISTORIQUE", noHistory: "Aucun historique", untitled: "Sans titre", deleteConfirm: "Supprimer ?" },
    de: { newChat: "NEUER CHAT", settings: "EINSTELLUNGEN", language: "SPRACHE", placeholder: "Befehl eingeben...", generating: "ANTWORT GENERIEREN...", systemOnline: "SYSTEM ONLINE", ready: "JARVIZ AI BEREIT", mediaReady: "Medien bereit", fileLimitError: "Max 10 Dateien.", filesReady: "Dateien bereit", rec: "AUFNAHME", copy: "KOPIEREN", copied: "KOPIERT", code: "CODE", reset: "ZURÜCKSETZEN", user: "DU", security: "SICHERHEIT", jarviz: "JARVIZ", files: "DATEIEN", uploadTooltip: "Bild oder Video hochladen", history: "CHAT-VERLAUF", noHistory: "Kein Verlauf", untitled: "Unbenannt", deleteConfirm: "Löschen?" },
    ja: { newChat: "新しいチャット", settings: "設定", language: "インターフェース言語", placeholder: "コマンドを入力...", generating: "応答を生成中...", systemOnline: "システムオンライン", ready: "JARVIZ AI 準備完了", mediaReady: "メディア準備完了", fileLimitError: "最大10ファイル", filesReady: "ファイル準備完了", rec: "録画", copy: "コピー", copied: "コピー完了", code: "コード", reset: "リセット", user: "あなた", security: "セキュリティ", jarviz: "JARVIZ", files: "ファイル", uploadTooltip: "画像または動画をアップロード", history: "チャット履歴", noHistory: "履歴なし", untitled: "無題のチャット", deleteConfirm: "削除しますか？" },
    hi: { newChat: "नई चैट", settings: "सेटिंग्स", language: "भाषा", placeholder: "आदेश दर्ज करें...", generating: "प्रतिक्रिया उत्पन्न हो रही है...", systemOnline: "सिस्टम ऑनलाइन", ready: "JARVIZ AI तैयार", mediaReady: "मीडिया तैयार", fileLimitError: "अधिकतम 10 फ़ाइलें", filesReady: "फ़ाइलें तैयार", rec: "रिकॉर्डिंग", copy: "कॉपी", copied: "कॉपी किया गया", code: "कोड", reset: "रीसेट", user: "आप", security: "सुरक्षा", jarviz: "JARVIZ", files: "फ़ाइलें", uploadTooltip: "छवि या वीडियो अपलोड करें", history: "चैट इतिहास", noHistory: "कोई इतिहास नहीं", untitled: "शीर्षकहीन", deleteConfirm: "हटाएं?" },
};

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
        [index: number]: {
            isFinal: boolean;
            [index: number]: {
                transcript: string;
            };
        };
        length: number;
    } & Iterable<any>;
    error?: any;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface Slide {
    title: string;
    content: string[];
    visual: string;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
        AudioContext: typeof AudioContext;
        webkitAudioContext: typeof AudioContext;
    }
}

// Custom Waveform Icon Component
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

// Custom Real Globe Icon Component (REALISTIC WORLD MAP & 7D GOLDEN EFFECT)
const RealGlobeIcon = () => (
    <div className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden bg-[#1a1205] shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-500/50">
        <div className="flex w-[200%] h-full animate-[slideLeft_15s_linear_infinite]">
             {/* Map Part 1 */}
             <svg viewBox="0 0 360 180" className="w-1/2 h-full text-amber-500 fill-current shrink-0" preserveAspectRatio="none">
                 {/* Grid Lines */}
                 <path d="M0,45 L360,45 M0,90 L360,90 M0,135 L360,135 M90,0 L90,180 M180,0 L180,180 M270,0 L270,180" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
                 
                 {/* North America */}
                 <path d="M30,30 L50,20 L80,20 L100,10 L120,20 L110,40 L90,50 L70,80 L50,70 L40,50 L30,40 Z" opacity="0.9" />
                 {/* South America */}
                 <path d="M80,90 L110,90 L120,110 L100,150 L90,160 L80,140 L75,110 Z" opacity="0.9" />
                 {/* Europe */}
                 <path d="M160,30 L180,20 L200,30 L190,50 L160,50 L150,40 Z" opacity="0.9" />
                 {/* Africa */}
                 <path d="M150,60 L180,60 L190,80 L200,110 L180,130 L160,120 L150,90 Z" opacity="0.9" />
                 {/* Asia */}
                 <path d="M200,30 L250,20 L290,20 L310,40 L300,70 L270,90 L240,80 L210,60 Z" opacity="0.9" />
                 {/* Australia */}
                 <path d="M280,110 L310,110 L315,130 L290,140 L280,130 Z" opacity="0.9" />
                 {/* Antarctica */}
                 <path d="M100,165 L260,165 L250,175 L110,175 Z" opacity="0.7" />
             </svg>
             
             {/* Duplicate SVG for Loop */}
             <svg viewBox="0 0 360 180" className="w-1/2 h-full text-amber-500 fill-current shrink-0" preserveAspectRatio="none">
                 <path d="M0,45 L360,45 M0,90 L360,90 M0,135 L360,135 M90,0 L90,180 M180,0 L180,180 M270,0 L270,180" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
                 <path d="M30,30 L50,20 L80,20 L100,10 L120,20 L110,40 L90,50 L70,80 L50,70 L40,50 L30,40 Z" opacity="0.9" />
                 <path d="M80,90 L110,90 L120,110 L100,150 L90,160 L80,140 L75,110 Z" opacity="0.9" />
                 <path d="M150,60 L180,60 L190,80 L200,110 L180,130 L160,120 L150,90 Z" opacity="0.9" />
                 <path d="M160,30 L180,20 L200,30 L190,50 L160,50 L150,40 Z" opacity="0.9" />
                 <path d="M200,30 L250,20 L290,20 L310,40 L300,70 L270,90 L240,80 L210,60 Z" opacity="0.9" />
                 <path d="M280,110 L310,110 L315,130 L290,140 L280,130 Z" opacity="0.9" />
                 <path d="M100,165 L260,165 L250,175 L110,175 Z" opacity="0.7" />
             </svg>
        </div>
        
        {/* Shading/3D Effect */}
        <div className="absolute inset-0 rounded-full shadow-[inset_-8px_-4px_12px_rgba(0,0,0,0.95),inset_4px_4px_12px_rgba(251,191,36,0.3)] pointer-events-none z-10"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-amber-100/30 pointer-events-none z-20"></div>
    </div>
);

// --- Presentation Viewer Component ---
const PresentationViewer = ({ slides }: { slides: Slide[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => setCurrentIndex(prev => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="mt-4 mb-2 w-full max-w-2xl mx-auto">
            {/* Holographic Container */}
            <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)] group">
                {/* Header / Top Bar */}
                <div className="h-8 bg-cyan-950/50 border-b border-cyan-500/20 flex items-center justify-between px-4">
                     <div className="flex items-center gap-2">
                         <MonitorPlay size={14} className="text-cyan-400" />
                         <span className="text-[10px] font-orbitron text-cyan-300 tracking-widest">JARVIZ PRESENTER</span>
                     </div>
                     <span className="text-[10px] font-mono text-cyan-500">{currentIndex + 1} / {slides.length}</span>
                </div>

                {/* Slide Content */}
                <div className="p-8 md:p-12 min-h-[300px] flex flex-col justify-center relative">
                    {/* Background Grid Pattern for Slide */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 animate-fadeIn">
                        <h3 className="text-2xl md:text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400 mb-6 drop-shadow-[0_2px_10px_rgba(6,182,212,0.5)]">
                            {slides[currentIndex].title}
                        </h3>
                        <ul className="space-y-4">
                            {slides[currentIndex].content.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-cyan-100/90 font-rajdhani text-lg md:text-xl leading-relaxed">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan] shrink-0"></span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Visual Description (Simulated Image Placeholder) */}
                    <div className="mt-8 p-3 bg-cyan-900/20 border border-cyan-500/10 rounded-lg">
                        <p className="text-[10px] text-cyan-500 font-mono uppercase tracking-wider mb-1">Visual Concept</p>
                        <p className="text-xs text-cyan-300/70 italic">{slides[currentIndex].visual}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute inset-y-0 left-0 flex items-center">
                    <button onClick={prevSlide} className="p-2 bg-black/50 hover:bg-cyan-500/20 text-cyan-500 transition-all rounded-r-lg">
                        <ChevronLeft size={24} />
                    </button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                    <button onClick={nextSlide} className="p-2 bg-black/50 hover:bg-cyan-500/20 text-cyan-500 transition-all rounded-l-lg">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Code Block Component ---
const CodeBlock = ({ language, children, labels }: { language: string | undefined, children?: React.ReactNode, labels: Translation }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (children) {
            const text = String(children).replace(/\n$/, '');
            navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="my-3 rounded-lg overflow-hidden border border-cyan-900/50 bg-[#0d1117] shadow-lg">
            <div className="bg-cyan-950/40 px-3 py-2 text-xs text-cyan-400 border-b border-cyan-900/30 font-orbitron flex justify-between items-center select-none">
                <span className="uppercase tracking-wider">{language || labels.code}</span>
                <button 
                    onClick={handleCopy} 
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                    title={labels.copy}
                >
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    <span className="text-[10px]">{isCopied ? labels.copied : labels.copy}</span>
                </button>
            </div>
            <pre className="p-4 overflow-x-auto custom-scrollbar">
                <code className="!bg-transparent text-cyan-100 font-mono text-sm leading-relaxed">
                    {children}
                </code>
            </pre>
        </div>
    );
};

// --- Advanced Media Viewer Component ---
const AdvancedMediaViewer = ({ media, onClose, labels }: { media: MediaData, onClose: () => void, labels: Translation }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playbackRate, setPlaybackRate] = useState(1);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => {
        setScale(prev => {
            const newScale = Math.max(prev - 0.5, 1);
            if (newScale === 1) setPosition({ x: 0, y: 0 }); 
            return newScale;
        });
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const changeSpeed = () => {
        if (!videoRef.current) return;
        const rates = [0.5, 1.0, 1.5, 2.0];
        const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
        const newRate = rates[nextIdx];
        videoRef.current.playbackRate = newRate;
        setPlaybackRate(newRate);
    };

    const skipVideo = (seconds: number) => {
        if (videoRef.current) videoRef.current.currentTime += seconds;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-fadeIn">
            <div className="absolute top-4 right-4 z-50">
                 <button onClick={onClose} className="p-2 bg-red-900/50 text-red-200 rounded-full hover:bg-red-800 transition-colors border border-red-500/30"><X size={24}/></button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {media.type === 'image' ? (
                    <div 
                        className="relative transition-transform duration-100 ease-out cursor-move"
                        style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img src={media.data} alt="Full view" className="max-w-full max-h-[85vh] object-contain rounded select-none draggable-none" draggable={false} />
                    </div>
                ) : (
                    <div className="w-full max-w-4xl">
                        <video ref={videoRef} src={media.data} controls className="w-full max-h-[70vh] rounded border border-cyan-500/30 bg-black" />
                    </div>
                )}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cyan-500/30 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50">
                {media.type === 'image' ? (
                    <>
                        <button onClick={handleZoomOut} className="text-cyan-400 hover:text-white transition-colors"><ZoomOut size={24} /></button>
                        <span className="font-mono text-cyan-200 w-12 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={handleZoomIn} className="text-cyan-400 hover:text-white transition-colors"><ZoomIn size={24} /></button>
                        <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="ml-4 text-xs font-orbitron text-cyan-500 hover:text-white border border-cyan-500/30 px-3 py-1 rounded">{labels.reset}</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => skipVideo(-10)} className="text-cyan-400 hover:text-white"><SkipBack size={24} /></button>
                        <button onClick={() => {
                            if(videoRef.current?.paused) videoRef.current.play();
                            else videoRef.current?.pause();
                        }} className="text-cyan-400 hover:text-white"><Play size={24} /></button>
                        <button onClick={() => skipVideo(10)} className="text-cyan-400 hover:text-white"><SkipForward size={24} /></button>
                        <div className="w-[1px] h-6 bg-cyan-800 mx-2"></div>
                        <button onClick={changeSpeed} className="flex items-center gap-1 text-cyan-400 hover:text-white font-mono font-bold w-16 justify-center">
                            {playbackRate}x
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const MessageItem = React.memo(({ msg, onMediaClick, onSpeak, isSpeaking, labels }: { msg: Message, onMediaClick: (data: MediaData) => void, onSpeak: (id: string, text: string) => void, isSpeaking: boolean, labels: Translation }) => {
    const isSystemAlert = msg.text.includes("[SYSTEM ALERT]");

    // Extract slides if present in specific JSON block
    const extractSlides = (text: string): Slide[] | null => {
        try {
            const jsonMatch = text.match(/```json\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                const parsed = JSON.parse(jsonMatch[1]);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title && parsed[0].content) {
                    return parsed;
                }
            }
        } catch (e) {
            return null;
        }
        return null;
    };

    const slides = msg.role === 'model' ? extractSlides(msg.text) : null;
    // Clean text by removing the JSON block for display
    const cleanText = slides ? msg.text.replace(/```json[\s\S]*?```/, '').trim() : msg.text;

    const alertStyle = isSystemAlert 
        ? "bg-red-950/80 border-2 border-red-500 text-red-100 shadow-[0_0_30px_rgba(220,38,38,0.5)]" 
        : msg.role === 'user' 
            ? 'bg-cyan-950/40 backdrop-blur-md border border-cyan-500/30 text-cyan-50 rounded-tr-sm mr-2' 
            : 'bg-black/60 backdrop-blur-md border border-slate-700/50 text-slate-100 rounded-tl-sm ml-2';

    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn w-full`}>
            <div className={`relative max-w-[95%] md:max-w-[85%] p-4 rounded-xl shadow-lg group ${alertStyle}`}>
                {isSystemAlert && (
                    <div className="absolute -top-3 -left-3 bg-red-600 rounded-full p-1 border-2 border-black">
                        <ShieldAlert size={20} className="text-white" />
                    </div>
                )}
                
                <div className="flex justify-between items-center mb-1 border-b border-white/10 pb-1 select-none">
                    <span className={`text-[10px] uppercase tracking-widest font-bold opacity-70 ${isSystemAlert ? 'text-red-300' : ''}`}>
                        {msg.role === 'user' ? labels.user : isSystemAlert ? labels.security : labels.jarviz}
                    </span>
                </div>
                
                {cleanText && (
                    <div className={`text-sm md:text-base leading-relaxed font-rajdhani tracking-wide ${msg.role === 'model' ? 'pb-2' : ''} overflow-x-auto select-text cursor-text shadow-black drop-shadow-sm`}>
                        <ReactMarkdown
                            components={{
                                code({node, className, children, ...props}) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                        <CodeBlock language={match[1]} labels={labels}>
                                            {String(children).replace(/\n$/, '')}
                                        </CodeBlock>
                                    ) : (
                                        <code className="bg-cyan-950/50 text-cyan-200 px-1.5 py-0.5 rounded text-xs font-mono border border-cyan-500/20" {...props}>
                                            {children}
                                        </code>
                                    )
                                },
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="pl-1">{children}</li>,
                            }}
                        >
                            {cleanText.replace("[SYSTEM ALERT]", "").trim()}
                        </ReactMarkdown>
                    </div>
                )}

                {msg.media && msg.media.length > 0 && (
                    <div className={`mt-3 grid gap-2 ${msg.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {msg.media.map((item, idx) => (
                            <div key={idx} onClick={() => onMediaClick(item)} className="relative group/media cursor-pointer overflow-hidden rounded border border-cyan-500/30">
                                {item.type === 'image' ? (
                                    <img src={item.data} alt="Attachment" className="w-full h-32 md:h-48 object-cover transition-transform duration-500 group-hover/media:scale-110" />
                                ) : (
                                    <div className="w-full h-32 md:h-48 bg-black flex items-center justify-center relative">
                                        <video src={item.data} className="w-full h-full object-cover opacity-60" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/50 p-2 rounded-full border border-white/20">
                                                <Play size={20} className="text-white ml-0.5" fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {msg.role === 'model' && (
                    <div className="absolute bottom-2 right-2 flex gap-2 select-none">
                        <button 
                            onClick={() => onSpeak(msg.id, cleanText.replace("[SYSTEM ALERT]", ""))}
                            className={`p-1.5 rounded-full transition-all duration-300 ${
                                isSpeaking 
                                ? 'bg-green-500/20 text-green-400 opacity-100 scale-110 shadow-[0_0_10px_rgba(74,222,128,0.4)]' 
                                : 'bg-cyan-900/10 hover:bg-cyan-500/20 text-cyan-500/40 hover:text-cyan-400 opacity-60 hover:opacity-100'
                            }`}
                            title="Ovozli o'qish"
                        >
                            {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Render Presentation Slides AFTER the chat bubble if they exist */}
            {slides && (
                 <div className="w-full animate-slideUpFade">
                     <PresentationViewer slides={slides} />
                 </div>
            )}
        </div>
    );
});
MessageItem.displayName = 'MessageItem';

const App: React.FC = () => {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.CONNECTED);
    const [volume, setVolume] = useState(1.0);
    const [isListening, setIsListening] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Removed isLanguageListOpen as we now use a grid
    const [language, setLanguage] = useState<string>('uz');
    
    // History State
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        try {
            const saved = localStorage.getItem('jarviz_chat_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [currentSessionId, setCurrentSessionId] = useState<string>(() => Date.now().toString());

    const t = TRANSLATIONS[language] || TRANSLATIONS['uz'];

    // Camera & Media State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [mediaQueue, setMediaQueue] = useState<MediaData[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [viewingMedia, setViewingMedia] = useState<MediaData | null>(null);
    
    // Speaking State
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

    // --- Refs ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<number | null>(null);
    
    const isAiSpeakingRef = useRef(false); 
    const isProcessingRef = useRef(false); 
    const isMutedRef = useRef(false); 
    const lastAiSpeechEndRef = useRef<number>(0);
    
    const silenceTimerRef = useRef<number | null>(null);
    const watchdogTimerRef = useRef<number | null>(null);
    const hasGeneratedTitleRef = useRef(false);

    // Initialize voices
    useEffect(() => {
        const loadVoices = () => { window.speechSynthesis.getVoices(); };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }, []);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    };

    useEffect(() => { scrollToBottom(); }, [messages, status, mediaQueue]);
    useEffect(() => { isMutedRef.current = volume === 0; }, [volume]);

    // --- History Logic ---
    useEffect(() => {
        localStorage.setItem('jarviz_chat_history', JSON.stringify(sessions));
    }, [sessions]);

    // Auto-save messages to history
    useEffect(() => {
        if (messages.length === 0) return;

        setSessions(prev => {
            const existingIdx = prev.findIndex(s => s.id === currentSessionId);
            
            if (existingIdx >= 0) {
                // Update existing session
                const updatedSessions = [...prev];
                updatedSessions[existingIdx] = {
                    ...updatedSessions[existingIdx],
                    messages: messages,
                    timestamp: Date.now()
                };
                return updatedSessions.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                // Create new session entry with title derived from first message
                const firstUserMsg = messages.find(m => m.role === 'user');
                const title = firstUserMsg 
                    ? (firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '')) 
                    : t.untitled;

                const newSession: ChatSession = {
                    id: currentSessionId,
                    title: title,
                    messages: messages,
                    timestamp: Date.now(),
                    language: language
                };
                return [newSession, ...prev];
            }
        });
    }, [messages, currentSessionId, language]);

    // Reset title gen ref when changing sessions
    useEffect(() => {
        hasGeneratedTitleRef.current = false;
    }, [currentSessionId]);

    // Auto-generate title after first exchange
    useEffect(() => {
        if (!hasGeneratedTitleRef.current && status === ConnectionStatus.CONNECTED && messages.length === 2 && messages[1].role === 'model' && !messages[1].isError) {
             hasGeneratedTitleRef.current = true;
             
             const context = `User: ${messages[0].text.substring(0, 100)}\nAI: ${messages[1].text.substring(0, 100)}`;
             jarvizServer.generateTitle(context).then(newTitle => {
                 if (newTitle) {
                     const cleanTitle = newTitle.replace(/^["']|["']$/g, '').replace(/\.$/, '');
                     setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: cleanTitle } : s));
                 }
             });
        }
    }, [status, messages.length, currentSessionId]);

    const createNewChat = useCallback(() => {
        if (messages.length > 0) {
            setMessages([]);
            setMediaQueue([]);
            setSpeakingMessageId(null);
            stopAudio();
            setCurrentSessionId(Date.now().toString());
            jarvizServer.startChat(); // Clear server context
        }
        if (window.innerWidth < 768) setIsMenuOpen(false);
    }, [messages.length]);

    const loadSession = useCallback((session: ChatSession) => {
        setMessages(session.messages);
        setCurrentSessionId(session.id);
        setMediaQueue([]);
        setSpeakingMessageId(null);
        stopAudio();
        // Resume server context with history
        jarvizServer.startChat(session.messages); 
        if (window.innerWidth < 768) setIsMenuOpen(false);
    }, []);

    const deleteSession = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm(t.deleteConfirm)) {
            setSessions(prev => prev.filter(s => s.id !== id));
            // If deleting current session, reset current view
            if (currentSessionId === id) {
                setMessages([]);
                setMediaQueue([]);
                setCurrentSessionId(Date.now().toString());
                jarvizServer.startChat();
            }
        }
    }, [currentSessionId, t.deleteConfirm]);

    // --- Camera Functions ---
    useEffect(() => {
        if (isCameraOpen && streamRef.current && videoRef.current) {
            const video = videoRef.current;
            video.srcObject = streamRef.current;
            video.muted = true;
            video.playsInline = true;
            video.onloadedmetadata = () => { video.play().catch(e => console.error("Play error:", e)); };
        }
    }, [isCameraOpen]);

    const startCamera = async () => {
        setErrorMsg(null);
        try {
            const constraints = { video: { facingMode: 'environment' }, audio: true };
            let stream;
            try { stream = await navigator.mediaDevices.getUserMedia(constraints); } 
            catch (err) { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
            streamRef.current = stream;
            setIsCameraOpen(true);
        } catch (err) { setErrorMsg("Kameraga ulanishda xatolik."); }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
        setIsRecording(false);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };

    const captureImage = () => {
        if (mediaQueue.length >= 10) {
            setErrorMsg(t.fileLimitError);
            stopCamera();
            return;
        }
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setMediaQueue(prev => [...prev, { type: 'image', data: dataUrl, mimeType: 'image/jpeg' }]);
                stopCamera();
            }
        }
    };

    const startRecording = () => {
        if (!streamRef.current) return;
        if (mediaQueue.length >= 10) { setErrorMsg(t.fileLimitError); return; }
        
        recordedChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/mp4';
        let recorder = new MediaRecorder(streamRef.current, { mimeType });
        recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunksRef.current.push(event.data); };
        recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                setMediaQueue(prev => [...prev, { type: 'video', data: reader.result as string, mimeType: blob.type }]);
                stopCamera();
            };
        };
        mediaRecorderRef.current = recorder;
        recorder.start(1000);
        setIsRecording(true);
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => { setRecordingTime(prev => prev + 1); }, 1000) as unknown as number;
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            if (mediaQueue.length + files.length > 10) {
                setErrorMsg(t.fileLimitError);
            }
            Array.from(files).slice(0, 10 - mediaQueue.length).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const mimeType = file.type;
                    let type: 'image' | 'video' = 'image';
                    if (mimeType.startsWith('video')) type = 'video';
                    setMediaQueue(prev => [...prev, { type, data: result, mimeType: mimeType }]);
                };
                reader.readAsDataURL(file);
            });
            event.target.value = '';
        }
    };

    // --- New: Paste Handler ---
    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
        const items = event.clipboardData.items;
        const filesToProcess: File[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) {
                    filesToProcess.push(file);
                }
            }
        }

        if (filesToProcess.length > 0) {
            if (mediaQueue.length + filesToProcess.length > 10) {
                setErrorMsg(t.fileLimitError);
                return;
            }

            filesToProcess.slice(0, 10 - mediaQueue.length).forEach((file) => {
                 const reader = new FileReader();
                 reader.onloadend = () => {
                     const result = reader.result as string;
                     const mimeType = file.type;
                     
                     // Only accept images and videos
                     if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
                         let type: 'image' | 'video' = 'image';
                         if (mimeType.startsWith('video')) type = 'video';
                         
                         setMediaQueue(prev => [...prev, { type, data: result, mimeType }]);
                     }
                 };
                 reader.readAsDataURL(file);
            });
        }
    }, [mediaQueue.length, t.fileLimitError]);

    const removeMediaFromQueue = (index: number) => {
        setMediaQueue(prev => prev.filter((_, i) => i !== index));
    };

    const triggerFileUpload = () => {
        if (mediaQueue.length >= 10) {
             setErrorMsg(t.fileLimitError);
             return;
        }
        fileInputRef.current?.click();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getCurrentLocale = useCallback(() => {
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === language);
        return langObj ? langObj.locale : 'uz-UZ';
    }, [language]);

    // --- Audio Functions ---
    const startMic = useCallback(() => {
        if (!recognitionRef.current) return;
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        if (watchdogTimerRef.current) { clearTimeout(watchdogTimerRef.current); watchdogTimerRef.current = null; }
        try { recognitionRef.current.start(); } catch (e) { console.log("Mic start error:", e); }
    }, []);

    const stopMic = useCallback(() => {
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        if (watchdogTimerRef.current) { clearTimeout(watchdogTimerRef.current); watchdogTimerRef.current = null; }
        if (!recognitionRef.current) return;
        try { recognitionRef.current.abort(); } catch (e) {}
    }, []);

    const stopAudio = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.pause(); 
            window.speechSynthesis.cancel();
        }
        isAiSpeakingRef.current = false;
        setStatus(ConnectionStatus.CONNECTED);
    }, []);

    const speakNative = useCallback((text: string, allowInterruption: boolean = true, onEndedCallback?: () => void) => {
        stopMic(); 
        if (isMutedRef.current || !('speechSynthesis' in window)) {
            setStatus(ConnectionStatus.CONNECTED);
            if (onEndedCallback) onEndedCallback();
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getCurrentLocale();
        utterance.volume = volume;
        utterance.onstart = () => {
            isAiSpeakingRef.current = true;
            setStatus(ConnectionStatus.SPEAKING);
            stopMic();
        };
        const handleEnd = () => {
            isAiSpeakingRef.current = false;
            setStatus(ConnectionStatus.CONNECTED);
            lastAiSpeechEndRef.current = Date.now(); 
            if (onEndedCallback) onEndedCallback();
        };
        utterance.onend = handleEnd;
        utterance.onerror = handleEnd;
        window.speechSynthesis.speak(utterance);
    }, [getCurrentLocale, volume, stopMic]);

    const handleManualSpeak = useCallback((id: string, text: string) => {
        if (speakingMessageId === id) {
            stopAudio();
            setSpeakingMessageId(null);
        } else {
            stopAudio();
            setSpeakingMessageId(id);
            speakNative(text, false, () => setSpeakingMessageId(null));
        }
    }, [speakingMessageId, speakNative, stopAudio]);

    const handleSendMessage = useCallback(async (textOverride?: string) => {
        const text = textOverride || inputValue;
        if (!text.trim() && mediaQueue.length === 0) return;

        stopMic();
        isProcessingRef.current = true;
        if (isAiSpeakingRef.current) stopAudio();

        const currentMedia = [...mediaQueue];
        const newUserMsg: Message = { 
            id: Date.now().toString(), 
            role: 'user', 
            text: text, 
            media: currentMedia.length > 0 ? currentMedia : undefined,
            timestamp: new Date() 
        };
        
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setMediaQueue([]); 
        setStatus(ConnectionStatus.PROCESSING);
        
        const newAiMsgId = (Date.now() + 2).toString();
        setMessages(prev => [...prev, { id: newAiMsgId, role: 'model', text: '', timestamp: new Date() }]);

        try {
            let accumulatedText = '';
            let lastUpdate = 0;
            const isVoice = !!textOverride;
            
            // Pass language code to server for dynamic system prompting
            await jarvizServer.sendMessageStream(text, currentMedia, isVoice, language, (chunk) => {
                accumulatedText += chunk;
                if (Date.now() - lastUpdate > 50) { 
                    setMessages(prev => prev.map(msg => msg.id === newAiMsgId ? { ...msg, text: accumulatedText } : msg));
                    lastUpdate = Date.now();
                }
            });

            setMessages(prev => prev.map(msg => msg.id === newAiMsgId ? { ...msg, text: accumulatedText } : msg));
            isProcessingRef.current = false;
            setStatus(ConnectionStatus.CONNECTED);

        } catch (error) {
            isProcessingRef.current = false;
            setStatus(ConnectionStatus.CONNECTED);
            // Mark as error so it doesn't get saved to valid history context
            setMessages(prev => prev.map(msg => msg.id === newAiMsgId ? { ...msg, text: typeof error === 'string' ? error : "Connection Error.", isError: true } : msg));
        }
    }, [mediaQueue, inputValue, speakNative, stopAudio, stopMic, language]);

    // Refs logic
    const handleSendMessageRef = useRef(handleSendMessage);
    useEffect(() => { handleSendMessageRef.current = handleSendMessage; }, [handleSendMessage]);

    const toggleListening = () => {
        if (isListening) stopMic(); else { if (isAiSpeakingRef.current) stopAudio(); startMic(); }
    };
    
    // Setup Speech Recognition
    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true; 
            recognition.interimResults = true; 
            recognition.lang = getCurrentLocale();
            recognition.onstart = () => { setIsListening(true); setErrorMsg(null); };
            recognition.onend = () => {
                setIsListening(false);
                if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
                if (watchdogTimerRef.current) { clearTimeout(watchdogTimerRef.current); watchdogTimerRef.current = null; }
            };
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) currentTranscript += event.results[i][0].transcript;
                setInputValue(currentTranscript);
                if (currentTranscript.trim().length < 1) return;
                if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => { 
                    handleSendMessageRef.current(currentTranscript); 
                    silenceTimerRef.current = null; 
                }, 1500) as unknown as number;
            };
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                setIsListening(false);
                if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
                if (watchdogTimerRef.current) { clearTimeout(watchdogTimerRef.current); watchdogTimerRef.current = null; }
            };
            recognitionRef.current = recognition;
        }
    }, [getCurrentLocale]);

    // --- Render ---
    if (viewingMedia) {
        return <AdvancedMediaViewer media={viewingMedia} onClose={() => setViewingMedia(null)} labels={t} />;
    }

    return (
        <div className="flex h-[100dvh] flex-col relative overflow-hidden font-rajdhani text-cyan-50">
            <Background />
            
            {/* --- HEADER --- */}
            <header className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-cyan-900/30 bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 mr-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-900/50 hover:border-cyan-400/50 transition-all">
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="flex items-center gap-3">
                         {status === ConnectionStatus.SPEAKING ? (
                            <div className="w-10 h-10 relative bg-cyan-900/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                                <WaveformIcon />
                            </div>
                         ) : (
                            <div className="w-10 h-10 relative bg-[#1a1205] rounded-full flex items-center justify-center border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                 <RealGlobeIcon />
                            </div>
                         )}
                        <div>
                            <h1 className="font-orbitron text-xl font-bold tracking-widest text-white leading-none">JARVIZ</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-2 h-2 rounded-full ${status === ConnectionStatus.DISCONNECTED ? 'bg-red-500' : 'bg-cyan-400 animate-pulse'}`}></span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">{t.systemOnline}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* --- MENU & SIDEBAR (REDESIGNED - COMPACT 5D) --- */}
            <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}></div>
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#090b10]/95 backdrop-blur-2xl border-r border-cyan-900/30 transform transition-transform duration-500 ease-out flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* 5D Header */}
                <div className="p-4 flex justify-between items-center border-b border-white/5 bg-gradient-to-r from-cyan-950/20 to-transparent">
                    <div className="flex items-center gap-2">
                        <Settings size={18} className="text-cyan-400" />
                        <h2 className="text-cyan-100 font-orbitron text-sm font-bold tracking-widest">{t.settings}</h2>
                    </div>
                    <button onClick={() => setIsMenuOpen(false)} className="p-1.5 rounded-lg bg-black/40 text-cyan-500 hover:text-white border border-white/5 hover:border-cyan-500/50 transition-all"><X size={16} /></button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto px-3 py-4 custom-scrollbar space-y-6">
                    
                    {/* New Chat - Compact 5D Button */}
                    <button onClick={createNewChat} className="w-full py-3 px-4 rounded-lg bg-gradient-to-b from-cyan-900/80 to-cyan-950 border-t border-cyan-500/30 border-b border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 group">
                        <Plus size={16} className="text-cyan-400 group-hover:rotate-90 transition-transform" /> 
                        <span className="font-orbitron text-xs font-bold text-cyan-100 tracking-wider">{t.newChat}</span>
                    </button>
                    
                    {/* Language - 5D Crystal Keys */}
                    <div className="space-y-2">
                        <div className="text-[10px] text-cyan-500/70 font-orbitron tracking-widest uppercase pl-1">{t.language}</div>
                        <div className="grid grid-cols-4 gap-2">
                             {SUPPORTED_LANGUAGES.map(langObj => (
                                 <button 
                                     key={langObj.code}
                                     onClick={() => setLanguage(langObj.code)} 
                                     className={`relative h-10 w-full rounded bg-gradient-to-b border-t border-l border-r border-b-[2px] flex items-center justify-center transition-all active:scale-95 active:border-b
                                     ${language === langObj.code 
                                         ? 'from-cyan-600 to-cyan-800 border-cyan-400 border-b-cyan-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                                         : 'from-slate-800 to-slate-900 border-slate-700 border-b-black opacity-80 hover:opacity-100'
                                     }`}
                                 >
                                     <span className="text-sm mr-1 filter drop-shadow-md">{langObj.flag}</span>
                                     <span className={`text-[10px] font-bold font-mono ${language === langObj.code ? 'text-white' : 'text-slate-400'}`}>{langObj.code.toUpperCase()}</span>
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* History - Tech Capsules */}
                    <div className="space-y-2">
                        <div className="text-[10px] text-cyan-500/70 font-orbitron tracking-widest uppercase pl-1 pt-2 border-t border-white/5">{t.history}</div>
                        
                        {sessions.length === 0 ? (
                            <div className="text-center py-4 text-slate-600 text-xs font-mono">{t.noHistory}</div>
                        ) : (
                            <div className="space-y-1.5">
                                {sessions.map(session => (
                                    <div 
                                        key={session.id} 
                                        onClick={() => loadSession(session)}
                                        className={`group relative p-2 pl-3 rounded border-l-2 transition-all cursor-pointer flex items-center justify-between
                                            ${currentSessionId === session.id 
                                            ? 'bg-cyan-950/40 border-l-cyan-400 border-t border-b border-r border-white/5' 
                                            : 'bg-transparent border-l-slate-700 border-transparent hover:bg-white/5 hover:border-l-cyan-700'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`font-rajdhani font-semibold text-xs truncate ${currentSessionId === session.id ? 'text-cyan-100' : 'text-slate-400'}`}>
                                                {session.title}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={(e) => deleteSession(e, session.id)}
                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-950/30 rounded transition-all opacity-100 z-10"
                                            title="O'chirish"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Status */}
                <div className="p-3 border-t border-white/5 bg-black/40">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                         <span>SYS: ONLINE</span>
                         <span className="text-cyan-700">V.3.4</span>
                    </div>
                </div>
            </div>
            
            {/* --- MAIN CONTENT BODY --- */}
            <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                     <div className={`transition-all duration-500 ${messages.length > 0 ? 'opacity-80 scale-95' : 'opacity-100 scale-100'}`}>
                        <NanoCore status={status} analyser={null} />
                     </div>
                </div>

                <div className="relative z-10 w-full h-full flex flex-col items-center">
                    <div className="w-full max-w-3xl h-full overflow-y-auto custom-scrollbar px-4 pb-4 pt-4">
                         {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-end pb-20 opacity-50 select-none">
                                <p className="font-orbitron text-sm tracking-widest text-cyan-500">{t.ready}</p>
                            </div>
                         )}

                         {messages.map((msg) => (
                            <MessageItem 
                                key={msg.id} 
                                msg={msg} 
                                onMediaClick={setViewingMedia}
                                onSpeak={handleManualSpeak}
                                isSpeaking={speakingMessageId === msg.id}
                                labels={t}
                            />
                        ))}
                        
                        {isProcessingRef.current && (
                            <div className="flex justify-start animate-fadeIn w-full pl-2 select-none">
                                <div className="bg-slate-900/50 border border-slate-700/50 text-cyan-400 px-4 py-2 rounded-tl-sm rounded-br-xl flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={14} />
                                    <span className="text-xs font-orbitron tracking-wider">{t.generating}</span>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>
            </main>

            {/* --- FOOTER INPUT --- */}
            <footer className="relative z-30 p-3 md:p-4 bg-black/80 backdrop-blur-lg border-t border-cyan-900/30 shrink-0">
                {/* Multi-Media Queue Preview */}
                {mediaQueue.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full bg-black/90 p-3 border-t border-cyan-900/50 flex items-center gap-3 overflow-x-auto custom-scrollbar animate-slideUpFade z-20">
                        {mediaQueue.map((item, index) => (
                            <div key={index} className="relative flex-shrink-0 group">
                                {item.type === 'image' ? (
                                    <img src={item.data} className="h-16 w-16 object-cover rounded border border-cyan-500/50" alt="preview" />
                                ) : (
                                    <video src={item.data} className="h-16 w-16 object-cover rounded border border-cyan-500/50" />
                                )}
                                <button onClick={() => removeMediaFromQueue(index)} className="absolute -top-2 -right-2 bg-red-900 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                            </div>
                        ))}
                        <div className="text-cyan-500/50 text-[10px] font-mono self-center whitespace-nowrap ml-2">
                            {mediaQueue.length}/10 {t.files}
                        </div>
                    </div>
                )}

                {errorMsg && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-red-900/90 text-white text-xs px-3 py-1 rounded-full border border-red-500 animate-fadeIn">
                        {errorMsg}
                    </div>
                )}
                
                <div className="max-w-3xl mx-auto flex items-end gap-3 relative">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        multiple 
                        accept="image/*,video/*"
                    />
                    
                    {/* 5D PAPERCLIP BUTTON */}
                    <button 
                        onClick={triggerFileUpload}
                        title={t.uploadTooltip}
                        className="relative p-3 md:p-4 rounded-xl bg-gradient-to-br from-[#111827] to-black border-t border-l border-cyan-500/30 border-b border-r border-black/80 shadow-[5px_5px_10px_rgba(0,0,0,0.8),-1px_-1px_3px_rgba(6,182,212,0.1)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.9)] active:translate-y-[1px] transition-all group overflow-hidden"
                    >
                        {/* Glass Gloss Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                        <Paperclip size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] relative z-10 group-hover:scale-110 transition-transform" />
                    </button>
                    
                    {/* 5D CAMERA BUTTON */}
                    <button 
                        onClick={() => isCameraOpen ? (isRecording ? stopRecording() : captureImage()) : startCamera()}
                        className={`relative p-3 md:p-4 rounded-xl border-t border-l border-b border-r border-black/80 shadow-[5px_5px_10px_rgba(0,0,0,0.8),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.9)] active:translate-y-[1px] transition-all group overflow-hidden ${
                            isCameraOpen 
                            ? isRecording 
                                ? 'bg-gradient-to-br from-red-900/60 to-black border-t-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                                : 'bg-gradient-to-br from-cyan-800/40 to-black border-t-cyan-400/50' 
                            : 'bg-gradient-to-br from-[#111827] to-black border-t-cyan-500/30'
                        }`}
                    >
                        {/* Glass Gloss Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            {isCameraOpen ? (
                                isRecording ? (
                                    <StopCircle size={20} className="text-red-500 animate-pulse drop-shadow-[0_0_8px_red]" />
                                ) : (
                                    <Camera size={20} className="text-cyan-300 drop-shadow-[0_0_8px_cyan]" />
                                )
                            ) : (
                                <Camera size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform" />
                            )}
                        </div>
                    </button>

                    {/* 5D MIC BUTTON */}
                    <button 
                        onClick={toggleListening}
                        className={`relative p-3 md:p-4 rounded-xl border-t border-l border-b border-r border-black/80 shadow-[5px_5px_10px_rgba(0,0,0,0.8),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.9)] active:translate-y-[1px] transition-all group overflow-hidden select-none ${
                            isListening
                            ? 'bg-gradient-to-br from-red-900/60 to-black border-t-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-105'
                            : 'bg-gradient-to-br from-[#111827] to-black border-t-cyan-500/30'
                        }`}
                    >
                        {/* Glass Gloss Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                        <Mic size={20} className={`relative z-10 transition-transform group-hover:scale-110 ${isListening ? 'text-red-400 animate-pulse drop-shadow-[0_0_10px_red]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'}`} />
                    </button>

                    {/* 5D INPUT FIELD (INSET STYLE) */}
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            onPaste={handlePaste}
                            placeholder={t.placeholder}
                            className="w-full bg-[#080a0f] text-cyan-100 placeholder-cyan-700/40 rounded-xl px-4 py-3 md:py-4 focus:outline-none transition-all font-rajdhani text-lg shadow-[inset_4px_4px_10px_black,inset_-2px_-2px_4px_rgba(6,182,212,0.05)] border-b border-cyan-500/10 focus:border-cyan-500/30 focus:shadow-[inset_4px_4px_15px_black,inset_-1px_-1px_2px_rgba(6,182,212,0.1)]"
                        />
                    </div>
                    
                    {/* 5D SEND BUTTON */}
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() && mediaQueue.length === 0}
                        className="relative p-3 md:p-4 rounded-xl bg-gradient-to-br from-cyan-900/40 to-black border-t border-l border-cyan-400/40 border-b border-r border-black/80 shadow-[5px_5px_15px_rgba(0,0,0,0.8),-1px_-1px_3px_rgba(6,182,212,0.2)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.9)] active:translate-y-[1px] transition-all disabled:opacity-30 disabled:grayscale group overflow-hidden"
                    >
                         {/* Glass Gloss Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-50 pointer-events-none"></div>
                        <Send size={20} className={`relative z-10 text-cyan-400 drop-shadow-[0_0_8px_cyan] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${status === ConnectionStatus.PROCESSING ? 'opacity-50' : ''}`} />
                    </button>
                </div>
            </footer>
            
            {/* Camera Overlay */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-40 bg-black flex flex-col">
                    <div className="relative flex-1 bg-black overflow-hidden">
                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
                            <span className="text-red-500 font-mono animate-pulse flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div> {t.rec}</span>
                            <button onClick={stopCamera} className="bg-black/50 p-2 rounded-full text-white border border-white/20"><X /></button>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-6">
                             {isRecording && <div className="font-mono text-2xl text-white">{formatTime(recordingTime)}</div>}
                             <div className="flex items-center gap-8">
                                 <button onClick={captureImage} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-all"></button>
                                 <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full border-4 ${isRecording ? 'border-red-500 bg-red-500/20' : 'border-red-500 bg-transparent'} flex items-center justify-center transition-all`}>
                                     <div className={`w-8 h-8 rounded-sm ${isRecording ? 'bg-red-500' : 'bg-red-500 rounded-full'}`}></div>
                                 </button>
                             </div>
                             <div className="text-white/70 text-sm font-mono">{mediaQueue.length}/10 {t.filesReady}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;