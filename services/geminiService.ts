import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || 'YOUR_API_KEY_HERE'; // In a real app, this comes from env

const ai = new GoogleGenAI({ apiKey });

export const generatePaymentInsights = async (prompt: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful financial assistant for the NECO Payment Management System. Provide concise, data-driven insights about payment discrepancies, staff payroll trends, and budget forecasting.",
      }
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Unable to generate insights at this time. Please check your API key.";
  }
};
