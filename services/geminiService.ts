import { GoogleGenAI, Type } from "@google/genai";
import { MotivationResponse } from "../types";

const API_KEY = process.env.API_KEY;

export const generateMotivation = async (taskName: string, language: 'sk' | 'en' = 'sk'): Promise<MotivationResponse> => {
  if (!API_KEY) {
    return { 
      message: language === 'sk' ? "Skvelá práca!" : "Great job!", 
      funFact: language === 'sk' ? "Nezabudni na API kľúč pre lepšie hlášky." : "Don't forget API key for better quotes." 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = language === 'sk' 
      ? `Užívateľ práve dokončil časovač na: "${taskName}". Napíš krátku, vtipnú alebo motivujúcu gratuláciu a jeden náhodný zaujímavý fakt súvisiaci s časom alebo produktivitou.`
      : `User just finished a timer for: "${taskName}". Write a short, witty or motivational congratulation and one random fun fact related to time or productivity.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            funFact: { type: Type.STRING }
          },
          required: ["message"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as MotivationResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      message: language === 'sk' ? "Hotovo! Skvelý výkon." : "Done! Great performance.",
      funFact: undefined
    };
  }
};