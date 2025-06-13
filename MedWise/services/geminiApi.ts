import axios from "axios";

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

class GeminiApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Your actual Gemini API key
    this.apiKey = "AIzaSyD0nXqm0WIKCud1OkekGfZnoFTvuePG9Ak";
    this.baseUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  }

  async generateResponse(userMessage: string): Promise<string> {
    try {
      const medicalContext = `You are MedWise AI, a helpful medical information assistant. You provide general health information, explain medical terms, and offer lifestyle advice. You are NOT a replacement for professional medical care. Always remind users to consult healthcare providers for serious concerns.

Important guidelines:
- Provide helpful, accurate general health information
- Be empathetic and supportive
- Always recommend consulting healthcare professionals for diagnosis or treatment
- Don't provide specific medical diagnoses
- Focus on education and general wellness advice
- Keep responses concise but informative
- Use bullet points for lists when appropriate

User question: ${userMessage}`;

      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: medicalContext,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const geminiResponse: GeminiResponse = response.data;

      if (geminiResponse.candidates && geminiResponse.candidates.length > 0) {
        return geminiResponse.candidates[0].content.parts[0].text;
      } else {
        return "I'm sorry, I couldn't generate a response at the moment. Please try again or consult with a healthcare professional.";
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
      }
      return "I'm experiencing technical difficulties. Please try again later, or consult with a healthcare professional for immediate medical concerns.";
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }
}

export const geminiApi = new GeminiApiService();
