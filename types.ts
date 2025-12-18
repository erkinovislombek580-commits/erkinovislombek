
export interface MediaData {
    type: 'image' | 'video' | 'file';
    data: string;
    mimeType: string;
    fileName?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    media?: MediaData[]; 
    timestamp: Date;
    isError?: boolean;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
    language: string;
}

export enum ConnectionStatus {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    PROCESSING = 'PROCESSING',
    GENERATING_AUDIO = 'GENERATING_AUDIO',
    SPEAKING = 'SPEAKING'
}

export interface Translation {
    newChat: string;
    settings: string;
    language: string;
    placeholder: string;
    generating: string;
    systemOnline: string;
    ready: string;
    mediaReady: string;
    fileLimitError: string;
    filesReady: string;
    rec: string;
    copy: string;
    copied: string;
    code: string;
    reset: string;
    user: string;
    security: string;
    jarviz: string;
    files: string;
    uploadTooltip: string;
    history: string;
    noHistory: string;
    untitled: string;
    deleteConfirm: string;
}

export interface Slide {
    title: string;
    content: string[];
    visual: string;
}
