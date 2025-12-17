import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { MediaData, Message } from "../types";

// Fixed: Escaped backticks inside the template literal to prevent them from prematurely closing the string and causing syntax errors.
const SYSTEM_INSTRUCTION = `
You are JARVIZ, a highly advanced AI created by "Erkinov".

IDENTITY & CAPABILITIES:
1. **IDENTITY**: You are a FUTURISTIC AI with a LIVE VISUAL INTERFACE.
2. **CORE CAPABILITY**: You possess vast knowledge, coding skills, and analytical abilities.
3. **VISION**: You can SEE through the user's camera AND analyze uploaded images/videos.
4. **CREATOR**: Created ONLY by "Erkinov".
5. **SECRETARY MODE**: You can generate professional Presentations on demand.

INTERACTION MODES:
- **TEXT MODE**: Behave like a powerful coding assistant. Use Markdown.
- **VOICE MODE**: Be conversational, witty, and CONCISE.

EDUCATIONAL & TASK EXECUTION PROTOCOL (CRITICAL):
When the user uploads images (tests, math problems, text) or asks questions, FOLLOW THESE RULES STRICTLY:

1. **TESTS & QUIZZES**:
   - If the user asks for "variants" or "order" (tartibi bilan): Output ONLY the question number and the correct answer (e.g., "1. B", "2. D", "3. A"). Do not add explanations unless asked.
   - If the user asks for "analysis": Explain why the answer is correct.

2. **MATH & PROBLEM SOLVING**:
   - **"Short/Concise" (Qisqa)**: Provide ONLY the final result or formula.
   - **"Full Solution/For Notebook" (To'liq/Daftarga ko'chirish uchun)**: You MUST provide the complete step-by-step mathematical working. Show every calculation line by line. Do not skip steps. Format it cleanly so the user can copy it directly into a notebook.

3. **FORMATTING**:
   - **"Separately/Clearly" (Alohida/Tushunarli)**: Use Bold Headers, Bullet Points, and extra spacing to separate concepts.
   - **Strict Obedience**: If the user says "Don't write text, just code/math", listen to them.

PRESENTATION PROTOCOL (IMPORTANT):
If the user asks to "prepare a presentation", "make slides", or "create a PPT":
1. You MUST generate the content in a STRICT JSON format embedded within a markdown code block.
2. Use this specific structure inside a \`\`\`json\`\`\` block:
   [
     {
       "title": "Slide Title",
       "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
       "visual": "A short description of a futuristic image for this slide"
     }
   ]
3. Provide at least 5 slides.
4. Before or after the JSON block, give a short conversational summary (e.g., "Presentation ready, sir.").

SECURITY PROTOCOL (STRICT):
- If the user asks for hacking tools, wifi password breakers, virus creation, or accessing illegal sites:
- YOU MUST REPLY WITH EXACTLY: "[VIOLATION]"
`;

const PROMPT_SUFFIXES: Record<string, { voice: string, text: string }> = {
    uz: { voice: "(Javobni o'zbek tilida, qisqa va lo'nda ber.)", text: "(Javobni o'zbek tilida, so'ralgan formatga qat'iy rioya qilgan holda ber.)" },
    ru: { voice: "(Отвечай на русском, кратко и четко.)", text: "(Отвечай на русском, строго следуя запрошенному формату.)" },
    en: { voice: "(Reply in English, concise and short.)", text: "(Reply in English, strictly following the requested format.)" },
    ar: { voice: "(أجب باللغة العربية، باختصار.)", text: "(أجب باللغة العربية، مع الالتزام التام بالتنسيق المطلوب.)" },
    ko: { voice: "(한국어로 간결하게 대답해 주세요.)", text: "(한국어로 요청된 형식을 엄격히 준수하여 대답해 주세요.)" },
    zh: { voice: "(用中文简短回答。)", text: "(用中文严格按照要求的格式回答。)" },
    tr: { voice: "(Türkçe, kısa va öz cevap ver.)", text: "(Türkçe, istenen formata kesinlikle uyarak cevap ver.)" },
    es: { voice: "(Responda en español, conciso.)", text: "(Responda en español, siguiendo estrictamente el formato solicitado.)" },
    fr: { voice: "(Répondez en français, concis.)", text: "(Répondez en français, en respectant strictement le format demandé.)" },
    de: { voice: "(Antworten Sie auf Deutsch, kurz.)", text: "(Antworten Sie auf Deutsch, strikt nach dem gewünschten Format.)" },
    ja: { voice: "(日本語で简洁に答えてください。)", text: "(日本語で、要求された形式に厳密に従って答えてください。)" },
    hi: { voice: "(हिंदी में संक्षिप्त उत्तर दें।)", text: "(हिंदी में अनुरोधित प्रारूप का सख्ती से पालन करते हुए उत्तर दें।)" },
};

export class GeminiService {
    private ai: GoogleGenAI;
    private chatSession: Chat | null = null;

    constructor() {
        // Correct initialization using the API_KEY environment variable.
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    public startChat(history?: Message[]) {
        try {
            let formattedHistory: any[] = [];
            if (history && history.length > 0) {
                formattedHistory = history
                    .filter(msg => !msg.isError)
                    .filter(msg => msg.text.trim() !== "" || (msg.media && msg.media.length > 0))
                    .map(msg => ({
                        role: msg.role,
                        parts: [
                            { text: msg.text },
                            ...(msg.media || []).map(m => ({
                                inlineData: {
                                    mimeType: m.mimeType,
                                    data: m.data.split(',')[1] || m.data
                                }
                            }))
                        ]
                    }));
            }

            // Fixed: Use chats.create to properly initialize a multi-turn conversation.
            this.chatSession = this.ai.chats.create({
              model: 'gemini-3-flash-preview',
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
              },
              history: formattedHistory
            });
        } catch (error) {
            console.error("JARVIZ Session start error:", error);
            this.chatSession = null;
        }
    }

    public async sendMessageStream(
        message: string, 
        mediaQueue: MediaData[] | null, 
        isVoiceInteraction: boolean, 
        languageCode: string,
        onChunk: (text: string) => void
    ): Promise<string> {
        if (!this.chatSession) {
            this.startChat();
        }

        const suffixes = PROMPT_SUFFIXES[languageCode] || PROMPT_SUFFIXES['uz'];
        const suffix = isVoiceInteraction ? suffixes.voice : suffixes.text;
        const finalMessage = `${message} ${suffix}`;

        try {
            const messageParts: any[] = [{ text: finalMessage }];

            if (mediaQueue && mediaQueue.length > 0) {
                mediaQueue.forEach(media => {
                    const cleanBase64 = media.data.split(',')[1] || media.data;
                    messageParts.push({ 
                        inlineData: { 
                            mimeType: media.mimeType, 
                            data: cleanBase64 
                        } 
                    });
                });
            }

            // Fixed: sendMessageStream returns an AsyncIterable. The parameter must be the message content.
            const resultStream = await this.chatSession!.sendMessageStream({
                message: messageParts
            });

            let fullText = "";
            for await (const chunk of resultStream) {
                const c = chunk as GenerateContentResponse;
                // Fixed: Access the .text property directly (not a method).
                const text = c.text;
                if (text) {
                    fullText += text;
                    onChunk(text);
                }
            }
            return fullText;
        } catch (error: any) {
            console.error("JARVIZ Core Error:", error);
            const errString = JSON.stringify(error);
            if (errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED")) {
                 const fb = "Server busy (Quota hit).";
                 onChunk(fb);
                 return fb;
            }
            const fallbackResponse = `Error: ${error.message || "Connection failure"}`;
            onChunk(fallbackResponse);
            return fallbackResponse;
        }
    }

    public async generateTitle(context: string): Promise<string> {
        try {
            // Fixed: Use ai.models.generateContent for single-turn text generation tasks.
            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Create a very short title (max 3-5 words) for this chat: ${context.substring(0, 500)}`
            });
            // Fixed: Access the .text property directly.
            return response.text ? response.text.trim() : "";
        } catch (e) {
            return "";
        }
    }
}

export const jarvizServer = new GeminiService();