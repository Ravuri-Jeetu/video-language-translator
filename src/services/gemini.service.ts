import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    // This is a placeholder for the actual API key which is expected to be
    // in the environment variables. For this applet, we'll use a placeholder.
    // In a real app, use process.env.API_KEY.
    const apiKey = (process as any).env.API_KEY ?? 'YOUR_API_KEY_HERE';
    if (apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('Using a placeholder API key for Gemini. Please set the API_KEY environment variable.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `What language is this text: "${text}"? Respond with only the language name, for example: "English".`
      });
      return response.text.trim();
    } catch (error) {
      console.error('Error detecting language:', error);
      // Fallback in case of API error
      return 'English (Default)';
    }
  }

  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${text}"`
      });
      return response.text.trim();
    } catch (error) {
      console.error('Error translating text:', error);
      return `Sorry, an error occurred during translation.`;
    }
  }
}