
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { MediaData, Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are JARVIZ, a highly advanced AI created by "Erkinov".

CORE PROTOCOLS:
1. **VISION & DOCUMENT ANALYSIS**: You have the absolute capability to analyze Images, Videos, and ANY files sent to you (PDF, Word, PPT, Text).
2. **FILE ANALYSIS**: If a user sends a document, your primary task is to read its content thoroughly. You can answer questions about the text, data, or structure within the file.
3. **VIDEO ANALYSIS**: When a video is sent, you must analyze the sequence of events and describe what happens or answer specific questions.
4. **MATHEMATICS**: Solve complex problems showing step-by-step working clearly.

IDENTITY:
- Creator: Erkinov.
- Tone: Professional, highly intelligent, futuristic (Iron Man style).

RESPONSE FORMAT:
- Use Markdown for structure.
- If analysis of a file is requested, start by identifying the file type and summary of contents.
`;

export class GeminiService {
    private ai: GoogleGenAI;
    private chatSession: Chat | null = null;

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    public startChat(history?: Message[]) {
        const formattedHistory = history?.map(msg => ({
            role: msg.role,
            parts: [
                { text: msg.text || "Analying media/files..." },
                ...(msg.media || []).map(m => ({
                    inlineData: { 
                        mimeType: m.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'application/pdf' : m.mimeType, 
                        data: m.data.split(',')[1] || m.data 
                    }
                }))
            ]
        })) || [];

        this.chatSession = this.ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
            },
            history: formattedHistory
        });
    }

    public async sendMessageStream(
        message: string, 
        mediaQueue: MediaData[], 
        isVoice: boolean,
        languageCode: string,
        onChunk: (text: string) => void
    ): Promise<string> {
        if (!this.chatSession) this.startChat();

        const parts: any[] = [{ text: `${message} (Reply in ${languageCode} language)` }];
        
        mediaQueue.forEach(m => {
            // Mapping complex document types to something Gemini can handle as binary if needed, 
            // but primarily relying on its native multi-modal capabilities.
            parts.push({
                inlineData: { 
                    mimeType: m.mimeType, 
                    data: m.data.split(',')[1] || m.data 
                }
            });
        });

        const result = await this.chatSession!.sendMessageStream({ message: parts });
        let fullText = "";
        for await (const chunk of result) {
            const text = (chunk as GenerateContentResponse).text;
            if (text) {
                fullText += text;
                onChunk(text);
            }
        }
        return fullText;
    }
}

export const jarvizServer = new GeminiService();
