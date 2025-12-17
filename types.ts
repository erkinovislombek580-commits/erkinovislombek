
export interface MediaData {
    type: 'image' | 'video';
    data: string;
    mimeType: string;
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
    timestamp: number; // For sorting
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

export type VoiceName = 'Fenrir' | 'Kore' | 'Puck' | 'Charon';

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
    history: string; // New
    noHistory: string; // New
    untitled: string; // New
    deleteConfirm: string; // New
}
