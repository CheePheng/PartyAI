
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TriviaQuestion, CharadePrompt, DebatePrompt, ImpostorScenario, MurderMysteryScenario, ForbiddenWordsCard, PictionaryPrompt, CategoryRushRound, WhoAmIWord, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

// Helper to append language instruction
const langInstr = (lang: Language) => lang === 'zh' ? "Respond in Simplified Chinese (zh-CN)." : "Respond in English.";

// --- TRIVIA ---
export const generateTriviaQuestions = async (topic: string, count: number, lang: Language): Promise<TriviaQuestion[] | null> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        answerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING },
        difficulty: { type: Type.STRING },
      },
      required: ["question", "options", "answerIndex", "explanation", "difficulty"],
      propertyOrdering: ["question", "options", "answerIndex", "explanation", "difficulty"]
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate ${count} engaging trivia questions about "${topic}". ${langInstr(lang)} Make them fun. 4 options per question.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Trivia Gen Error", error);
    return null;
  }
};

// --- CHARADES ---
export const generateCharades = async (lang: Language, category: string = "random"): Promise<CharadePrompt | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      phrase: { type: Type.STRING },
      category: { type: Type.STRING },
      hint: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard", "Extreme"] }
    },
    required: ["phrase", "category", "hint", "difficulty"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a fun charades prompt. Category: ${category}. Range from Easy to Hard. ${langInstr(lang)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Charades Gen Error", error);
    return null;
  }
};

// --- FORBIDDEN WORDS (TABOO) ---
export const generateForbiddenWords = async (lang: Language): Promise<ForbiddenWordsCard | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      target: { type: Type.STRING },
      forbidden: { type: Type.ARRAY, items: { type: Type.STRING } },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
    },
    required: ["target", "forbidden", "difficulty"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a 'Taboo' style game card. One target word and 4 forbidden words that are highly associated with it. ${langInstr(lang)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Forbidden Words Gen Error", error);
    return null;
  }
};

// --- DEBATE ---
export const generateDebateTopic = async (lang: Language): Promise<DebatePrompt | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      sideA: { type: Type.STRING },
      sideB: { type: Type.STRING },
    },
    required: ["topic", "sideA", "sideB"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a hilarious, low-stakes debate topic (e.g., 'Is a hotdog a sandwich?'). ${langInstr(lang)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Debate Gen Error", error);
    return null;
  }
};

// --- IMPOSTOR (SPYFALL) ---
export const generateImpostorScenario = async (playerCount: number, lang: Language): Promise<ImpostorScenario | null> => {
   const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING },
      roles: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
      },
    },
    required: ["location", "roles"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a location and ${playerCount - 1} distinct roles for Spyfall. ${langInstr(lang)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Impostor Gen Error", error);
    return null;
  }
}

// --- MURDER MYSTERY ---
export const generateMurderMystery = async (playerCount: number, lang: Language): Promise<MurderMysteryScenario | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      intro: { type: Type.STRING },
      characters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING, enum: ['Killer', 'Detective', 'Suspect'] },
            publicBio: { type: Type.STRING },
            secretInfo: { type: Type.STRING }
          },
          required: ["name", "role", "publicBio", "secretInfo"]
        },
      }
    },
    required: ["title", "intro", "characters"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a murder mystery scenario for ${playerCount} players. 1 Killer, 1 Detective. ${langInstr(lang)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Murder Mystery Gen Error", error);
    return null;
  }
}

// --- PICTIONARY (QUICK DRAW) ---
export const generatePictionaryPrompt = async (lang: Language): Promise<PictionaryPrompt | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      category: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
    },
    required: ["word", "category", "difficulty"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a word or phrase suitable for Pictionary (drawing game). Concrete nouns, actions, or common idioms. ${langInstr(lang)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Pictionary Gen Error", error);
    return null;
  }
};

// --- SCATTERGORIES (CATEGORY RUSH) ---
export const generateCategoryRush = async (lang: Language): Promise<CategoryRushRound | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      letter: { type: Type.STRING },
      categories: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["letter", "categories"]
  };

  try {
    // Explicitly ask for A-Z letter to support Chinese Pinyin play
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a random alphabet letter (A-Z) and 6 distinct, fun categories for a Scattergories-style game. ${langInstr(lang)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Scattergories Gen Error", error);
    return null;
  }
};

// --- WHO AM I (HEADS UP) ---
export const generateWhoAmIWords = async (category: string, count: number, lang: Language): Promise<WhoAmIWord[] | null> => {
    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                word: { type: Type.STRING },
                hint: { type: Type.STRING },
            },
            required: ["word", "hint"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate ${count} popular words/people for a 'Heads Up' game. Category: ${category}. ${langInstr(lang)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (error) {
        console.error("Who Am I Gen Error", error);
        return null;
    }
}

// --- SECRET CODE (CODENAMES) ---
export const generateSecretCodeWords = async (lang: Language): Promise<string[] | null> => {
    const schema: Schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate 25 distinct, common, diverse nouns for a Codenames-style association game. Single words only. ${langInstr(lang)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        
        const words = JSON.parse(response.text || "[]");
        return words.length >= 25 ? words.slice(0, 25) : null;
    } catch (error) {
        console.error("Secret Code Gen Error", error);
        return null;
    }
}
