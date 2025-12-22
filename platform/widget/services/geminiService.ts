import { GoogleGenAI } from "@google/genai";
import { fetchServices } from './configService';
import { Language, Service } from '../types';
import { SERVICES as FALLBACK_SERVICES } from '../constants';

export const suggestService = async (symptoms: string, language: Language): Promise<string | null> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("API Key not found, skipping AI suggestion");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    // Fetch services dynamically (with fallback)
    let services: Service[];
    try {
      services = await fetchServices();
    } catch {
      services = FALLBACK_SERVICES;
    }

    // Create a lean prompt context
    const serviceList = services.map(s => `${s.id}: ${s.name[Language.EN]} (${s.description[Language.EN]})`).join('\n');

    const prompt = `
      You are a dental receptionist assistant.
      Here are the available services:
      ${serviceList}
      
      The patient describes their symptoms as: "${symptoms}".
      
      Based on this description, return ONLY the ID of the most appropriate service (e.g., "s1"). 
      If unsure or if it's general pain, return "s1" (Consultation).
      Do not return any other text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim();
    if (text && services.some(s => s.id === text)) {
      return text;
    }
    return 's1';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};