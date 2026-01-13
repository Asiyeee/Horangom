
import { GoogleGenAI, Chat } from "@google/genai";
import { MODEL_NAME, SYSTEM_PROMPT } from "../constants";
import { Message, AppMode } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  private initChat() {
    this.chat = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });
  }

  async sendMessage(messageText: string): Promise<string> {
    if (!this.chat) {
      this.initChat();
    }

    try {
      const response = await this.chat!.sendMessage({ message: messageText });
      return response.text || "Bir hata oluştu, lütfen tekrar dener misin?";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Üzgünüm, şu an bağlantıda bir sorun yaşıyorum. Lütfen biraz sonra tekrar dener misin?";
    }
  }

  async startLesson(mode: AppMode): Promise<string> {
    this.initChat();
    
    let initialMessage = "";
    switch (mode) {
      case 'sohbet': 
        initialMessage = "Mod 1: Korece sohbet pratiği. Lütfen İLK mesajında Türkçe olarak benden hangi seviyede (Başlangıç, Orta, İleri) sohbet etmek istediğimi sor. Ben seviyemi söyledikten sonra tamamen Korece devam edeceğini belirt."; 
        break;
      case 'konu': initialMessage = "Mod 2: Yeni bir konu öğrenelim. Lütfen metodunu takip ederek bir konu seç ve ilk adımı at."; break;
      case 'topik': initialMessage = "Mod 3: TOPIK pratiği yapalım. Lütfen bir yapı seç ve günlük kullanımıyla başla."; break;
      case 'hangul': initialMessage = "Mod 4: Başlangıç Hangıl seviyesinden başlayalım. Lütfen ilk harf/hece ile girişi yap."; break;
      case 'soru': initialMessage = "Mod 5: İstenilen bir konuda soru hazırlayalım. Lütfen benden konu ve seviye iste."; break;
      default: initialMessage = "Merhaba Horangom Öğretmeni, yeni bir derse başlayalım.";
    }

    try {
        const response = await this.chat!.sendMessage({ message: initialMessage });
        return response.text || "Merhaba! Bugün ne çalışmak istersin?";
    } catch (error) {
        return "Merhaba! Horangom metoduna göre dersimize başlayalım.";
    }
  }
}

export const geminiService = new GeminiService();
