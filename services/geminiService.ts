
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TriviaQuestion, CharadePrompt, DebatePrompt, ImpostorScenario, MurderMysteryScenario, ForbiddenWordsCard, PictionaryPrompt, CategoryRushRound, WhoAmIWord, Language, PartySettings, WouldYouRatherPrompt, TwoTruthsPrompt, NeverHaveIEverPrompt } from '../types';
import * as Fallbacks from './staticGameData';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

// --- TYPES & UTILS ---

export type ServiceResponse<T> = 
  | { ok: true; data: T; source: 'ai' | 'cache' | 'fallback'; attempts: number } 
  | { ok: false; errorCode: string; error?: any; attempts: number };

const langInstr = (lang: Language) => lang === 'zh' ? "Respond in Simplified Chinese (zh-CN)." : "Respond in English.";

const getThemeAndIntensityInstr = (settings: PartySettings) => {
  let instr = "";
  if (settings.theme !== 'default') {
    instr += ` Theme: ${settings.theme}.`;
  }
  if (settings.intensity === 'pg13') {
    instr += ` Intensity: PG-13 (mildly edgy but not explicit).`;
  } else if (settings.intensity === 'spicy') {
    instr += ` Intensity: Spicy (adult themes, edgy, mature).`;
  } else {
    instr += ` Intensity: Family-friendly.`;
  }
  return instr;
};

const COMMON_SYSTEM_INSTRUCTION = "You are a fun, creative party game master. Generate engaging content. Output strictly valid JSON matching the requested schema without any markdown formatting or code blocks.";

// Simple cache wrapper
const CACHE_PREFIX = 'gemini_cache_v1_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const memoryCache = new Map<string, any>();

function getFromCache<T>(key: string): T | null {
  if (memoryCache.has(key)) return memoryCache.get(key);
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    memoryCache.set(key, parsed.data);
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function setCache<T>(key: string, data: T) {
  memoryCache.set(key, data);
  try {
    const item = { timestamp: Date.now(), data };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (e) {
    console.warn('Cache write failed', e);
  }
}

// Robust Generation Wrapper
async function generateWithRetry<T>(
  cacheKey: string,
  prompt: string,
  schema: Schema,
  validator: (data: any) => boolean,
  fallbackData: T | null,
  retries = 2,
  systemInstruction?: string
): Promise<ServiceResponse<T>> {
  // 1. Check Cache
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    console.log(`[Gemini] Cache hit for ${cacheKey}`);
    return { ok: true, data: cached, source: 'cache', attempts: 0 };
  }

  // 2. Try AI Generation
  let lastError: any;
  let attempts = 0;
  for (let i = 0; i <= retries; i++) {
    attempts++;
    try {
      console.log(`[Gemini] Attempt ${i + 1}/${retries + 1} for ${cacheKey}`);
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          ...(systemInstruction ? { systemInstruction } : {}),
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response text");

      const data = JSON.parse(text);

      // 3. Validate
      if (!validator(data)) {
        throw new Error("Validation failed for response structure");
      }

      // 4. Success -> Cache & Return
      setCache(cacheKey, data);
      return { ok: true, data, source: 'ai', attempts };

    } catch (err) {
      console.warn(`[Gemini] Attempt ${i + 1} failed:`, err);
      lastError = err;
      
      // Exponential backoff if retrying
      if (i < retries) {
        const delay = 1000 * Math.pow(2, i);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // 5. Fallback
  console.error(`[Gemini] All attempts failed for ${cacheKey}. Using fallback.`, lastError);
  if (fallbackData !== null) {
    return { ok: true, data: fallbackData, source: 'fallback', attempts };
  }
  
  return { ok: false, errorCode: 'GENERATION_FAILED', error: lastError, attempts };
}

// --- VALIDATORS ---

const isNonEmptyString = (s: any) => typeof s === 'string' && s.length > 0;

const validateTrivia = (data: any): boolean => {
  if (!Array.isArray(data)) return false;
  return data.every(q => 
    isNonEmptyString(q.question) &&
    Array.isArray(q.options) && q.options.length === 4 &&
    typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex <= 3
  );
};

const validateCharades = (data: any): boolean => {
  return isNonEmptyString(data.phrase) && isNonEmptyString(data.category);
};

const validateForbidden = (data: any): boolean => {
  return isNonEmptyString(data.target) && 
         Array.isArray(data.forbidden) && 
         data.forbidden.length === 4 &&
         data.forbidden.every(isNonEmptyString);
};

const validateDebate = (data: any): boolean => {
  return isNonEmptyString(data.topic) && isNonEmptyString(data.sideA) && isNonEmptyString(data.sideB);
};

const validateImpostor = (playerCount: number) => (data: any): boolean => {
  return isNonEmptyString(data.location) && 
         Array.isArray(data.roles) && 
         data.roles.length >= playerCount - 1 &&
         data.roles.every(isNonEmptyString);
};

const validateMurderMystery = (playerCount: number) => (data: any): boolean => {
  if (!(isNonEmptyString(data.title) && 
        isNonEmptyString(data.intro) && 
        Array.isArray(data.characters) && 
        data.characters.length === playerCount &&
        data.characters.every((c: any) => isNonEmptyString(c.name) && isNonEmptyString(c.role)))) {
      return false;
  }
  
  const killers = data.characters.filter((c: any) => c.role === 'Killer');
  const detectives = data.characters.filter((c: any) => c.role === 'Detective');
  
  return killers.length === 1 && detectives.length === 1;
};

const validatePictionary = (data: any): boolean => {
  return isNonEmptyString(data.word) && isNonEmptyString(data.category);
};

const validateScattergories = (data: any): boolean => {
  return isNonEmptyString(data.letter) && 
         Array.isArray(data.categories) && 
         data.categories.length > 0;
};

const validateWhoAmI = (data: any): boolean => {
  if (!Array.isArray(data)) return false;
  return data.every(w => isNonEmptyString(w.word));
};

const validateSecretCode = (data: any): boolean => {
  if (!Array.isArray(data) || data.length !== 25 || !data.every(isNonEmptyString)) return false;
  const uniqueWords = new Set(data.map((w: string) => w.toLowerCase()));
  return uniqueWords.size === 25;
};

const validateWouldYouRather = (data: any): boolean => {
  return isNonEmptyString(data.optionA) && isNonEmptyString(data.optionB);
};

const validateTwoTruths = (data: any): boolean => {
  return isNonEmptyString(data.statement1) && 
         isNonEmptyString(data.statement2) && 
         isNonEmptyString(data.statement3) && 
         typeof data.lieIndex === 'number' && 
         data.lieIndex >= 0 && data.lieIndex <= 2;
};

const validateNeverHaveIEver = (data: any): boolean => {
  return isNonEmptyString(data.statement);
};


// --- GENERATORS ---

export const generateTriviaQuestions = async (topic: string, count: number, settings: PartySettings): Promise<ServiceResponse<TriviaQuestion[]>> => {
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
    },
  };

  // Select random fallback subset if needed
  const fallback = Fallbacks.FALLBACK_TRIVIA.slice(0, count);

  return generateWithRetry<TriviaQuestion[]>(
    `trivia_${topic}_${count}_${settings.language}_${settings.theme}_${settings.intensity}`,
    `Generate exactly ${count} engaging trivia questions about "${topic}". ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} Ensure exactly 4 unique options per question, with exactly 1 clearly correct answer. Provide a short, fun explanation. Difficulty must be 'Easy', 'Medium', or 'Hard'.`,
    schema,
    validateTrivia,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateCharades = async (settings: PartySettings, category: string = "random"): Promise<ServiceResponse<CharadePrompt>> => {
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

  const fallback = Fallbacks.FALLBACK_CHARADES[Math.floor(Math.random() * Fallbacks.FALLBACK_CHARADES.length)];

  return generateWithRetry<CharadePrompt>(
    `charades_${category}_${settings.language}_${settings.theme}_${settings.intensity}_${Date.now()}`,
    `Generate a fun charades prompt for the category "${category}". ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} The phrase must be actable, not too long, and require no props. The hint must be helpful but must NOT contain any words from the phrase itself. Difficulty must be 'Easy', 'Medium', 'Hard', or 'Extreme'.`,
    schema,
    validateCharades,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateForbiddenWords = async (settings: PartySettings): Promise<ServiceResponse<ForbiddenWordsCard>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      target: { type: Type.STRING },
      forbidden: { type: Type.ARRAY, items: { type: Type.STRING } },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
    },
    required: ["target", "forbidden", "difficulty"]
  };

  const fallback = Fallbacks.FALLBACK_FORBIDDEN[Math.floor(Math.random() * Fallbacks.FALLBACK_FORBIDDEN.length)];

  return generateWithRetry<ForbiddenWordsCard>(
    `forbidden_${settings.language}_${settings.theme}_${settings.intensity}_${Date.now()}`,
    `Generate a 'Taboo' style game card. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} Provide 1 target word and exactly 4 forbidden words highly associated with it. The forbidden words MUST NOT contain the target word or any exact substring of it. Difficulty must be 'Easy', 'Medium', or 'Hard'.`,
    schema,
    validateForbidden,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateDebateTopic = async (settings: PartySettings): Promise<ServiceResponse<DebatePrompt>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      sideA: { type: Type.STRING },
      sideB: { type: Type.STRING },
    },
    required: ["topic", "sideA", "sideB"]
  };

  const fallback = Fallbacks.FALLBACK_DEBATE[Math.floor(Math.random() * Fallbacks.FALLBACK_DEBATE.length)];

  return generateWithRetry<DebatePrompt>(
    `debate_${settings.language}_${settings.theme}_${settings.intensity}_${Date.now()}`,
    `Generate a hilarious, low-stakes debate topic (e.g., 'Is a hotdog a sandwich?'). ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} The topic should be fun and lighthearted. Provide two distinct, opposing sides (sideA and sideB) for players to argue.`,
    schema,
    validateDebate,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateImpostorScenario = async (playerCount: number, settings: PartySettings): Promise<ServiceResponse<ImpostorScenario>> => {
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

  const fallback = Fallbacks.FALLBACK_IMPOSTOR[Math.floor(Math.random() * Fallbacks.FALLBACK_IMPOSTOR.length)];
  // Ensure we have enough roles in fallback
  if (fallback.roles.length < playerCount) {
      // Pad with generic roles if needed
      while (fallback.roles.length < playerCount) fallback.roles.push("Bystander");
  }

  return generateWithRetry<ImpostorScenario>(
    `impostor_${playerCount}_${settings.language}_${settings.theme}_${settings.intensity}`,
    `Generate a location and exactly ${playerCount - 1} distinct roles for a Spyfall-style game. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} The location should be recognizable and not too niche (e.g., 'Supermarket', 'Pirate Ship'). The roles must be distinct and fit naturally within the location.`,
    schema,
    validateImpostor(playerCount),
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
}

export const generateMurderMystery = async (playerCount: number, settings: PartySettings): Promise<ServiceResponse<MurderMysteryScenario>> => {
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

  // Fallback needs to be adapted for player count if strictly required, but for now we return the static one
  // In a real app we'd have multiple scenarios or dynamic fallback generation
  const fallback = Fallbacks.FALLBACK_MURDER_MYSTERY;

  return generateWithRetry<MurderMysteryScenario>(
    `murder_mystery_${playerCount}_${settings.language}_${settings.theme}_${settings.intensity}`,
    `Create a murder mystery scenario for exactly ${playerCount} players. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} There must be exactly 1 'Killer', exactly 1 'Detective', and the rest must be 'Suspect's. Provide a catchy title and a brief intro. Each character must have a unique name, a public bio, and unique secret info that provides clues or motives.`,
    schema,
    validateMurderMystery(playerCount),
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
}

export const generatePictionaryPrompt = async (settings: PartySettings): Promise<ServiceResponse<PictionaryPrompt>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      category: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
    },
    required: ["word", "category", "difficulty"]
  };

  const fallback = Fallbacks.FALLBACK_PICTIONARY[Math.floor(Math.random() * Fallbacks.FALLBACK_PICTIONARY.length)];

  return generateWithRetry<PictionaryPrompt>(
    `pictionary_${settings.language}_${settings.theme}_${settings.intensity}_${Date.now()}`,
    `Generate a word or phrase suitable for Pictionary (drawing game) in the category "random". ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} It must be a concrete noun, action, or common idiom that is easily drawable within 60 seconds. Difficulty must be 'Easy', 'Medium', or 'Hard'.`,
    schema,
    validatePictionary,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateCategoryRush = async (settings: PartySettings): Promise<ServiceResponse<CategoryRushRound>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      letter: { type: Type.STRING },
      categories: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["letter", "categories"]
  };

  const fallback = Fallbacks.FALLBACK_SCATTERGORIES[Math.floor(Math.random() * Fallbacks.FALLBACK_SCATTERGORIES.length)];

  return generateWithRetry<CategoryRushRound>(
    `scattergories_${settings.language}_${settings.theme}_${settings.intensity}`,
    `Generate a random alphabet letter (A-Z) and exactly 6 distinct, non-overlapping categories for a Scattergories-style game. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} The categories should be fun and broad enough to have multiple possible answers starting with the chosen letter.`,
    schema,
    validateScattergories,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateWhoAmIWords = async (category: string, count: number, settings: PartySettings): Promise<ServiceResponse<WhoAmIWord[]>> => {
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

    const fallback = Fallbacks.FALLBACK_WHO_AM_I.slice(0, count);

    return generateWithRetry<WhoAmIWord[]>(
        `whoami_${category}_${count}_${settings.language}_${settings.theme}_${settings.intensity}`,
        `Generate exactly ${count} popular, highly recognizable entities (people, characters, objects) for a 'Heads Up' style game in the category "${category}". ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} Avoid obscure names. Provide a short, helpful hint for each that does not give away the exact name.`,
        schema,
        validateWhoAmI,
        fallback,
        2,
        COMMON_SYSTEM_INSTRUCTION
    );
}

export const generateSecretCodeWords = async (settings: PartySettings): Promise<ServiceResponse<string[]>> => {
    const schema: Schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };

    const fallback = Fallbacks.FALLBACK_SECRET_CODE;

    return generateWithRetry<string[]>(
        `secretcode_${settings.language}_${settings.theme}_${settings.intensity}`,
        `Generate exactly 25 distinct, single-word common nouns for a Codenames-style association game. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} Avoid proper nouns and overly complex words. The words should be diverse and easy to make associations with.`,
        schema,
        validateSecretCode,
        fallback,
        2,
        COMMON_SYSTEM_INSTRUCTION
    );
}

export const generateWouldYouRather = async (settings: PartySettings): Promise<ServiceResponse<WouldYouRatherPrompt>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      optionA: { type: Type.STRING },
      optionB: { type: Type.STRING }
    },
    required: ["optionA", "optionB"]
  };

  const fallback = Fallbacks.FALLBACK_WOULD_YOU_RATHER[Math.floor(Math.random() * Fallbacks.FALLBACK_WOULD_YOU_RATHER.length)];

  return generateWithRetry<WouldYouRatherPrompt>(
    `would_you_rather_${settings.language}_${settings.theme}_${settings.intensity}_${Date.now()}`, // Add timestamp to avoid caching the same question over and over
    `Generate a fun, thought-provoking "Would You Rather" question. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} Provide two distinct, equally appealing (or unappealing) options.`,
    schema,
    validateWouldYouRather,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateTwoTruths = async (settings: PartySettings): Promise<ServiceResponse<TwoTruthsPrompt>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      statement1: { type: Type.STRING },
      statement2: { type: Type.STRING },
      statement3: { type: Type.STRING },
      lieIndex: { type: Type.INTEGER, description: "0 for statement1, 1 for statement2, 2 for statement3" }
    },
    required: ["statement1", "statement2", "statement3", "lieIndex"]
  };

  const fallback = Fallbacks.FALLBACK_TWO_TRUTHS[Math.floor(Math.random() * Fallbacks.FALLBACK_TWO_TRUTHS.length)];

  return generateWithRetry<TwoTruthsPrompt>(
    `two_truths_${settings.language}_${settings.theme}_${settings.intensity}_${Date.now()}`,
    `Generate a set of "Two Truths and a Lie" about a fictional, interesting persona. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} Provide 3 statements. Exactly 2 must be true for this persona, and exactly 1 must be a lie. Specify the index of the lie (0, 1, or 2).`,
    schema,
    validateTwoTruths,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

export const generateNeverHaveIEver = async (settings: PartySettings): Promise<ServiceResponse<NeverHaveIEverPrompt>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      statement: { type: Type.STRING }
    },
    required: ["statement"]
  };

  const fallback = Fallbacks.FALLBACK_NEVER_HAVE_I_EVER[Math.floor(Math.random() * Fallbacks.FALLBACK_NEVER_HAVE_I_EVER.length)];

  return generateWithRetry<NeverHaveIEverPrompt>(
    `never_have_i_ever_${settings.language}_${settings.theme}_${settings.intensity}_${Date.now()}`,
    `Generate a fun "Never Have I Ever" statement. ${langInstr(settings.language)} ${getThemeAndIntensityInstr(settings)} The statement should start with "Never have I ever..." (or the translated equivalent). It should be relatable and spark conversation.`,
    schema,
    validateNeverHaveIEver,
    fallback,
    2,
    COMMON_SYSTEM_INSTRUCTION
  );
};

// --- PREFETCH PIPELINE ---

export const prefetchGame = async (gameId: string, settings: PartySettings, options?: any) => {
  const qKey = `prefetch_${gameId}_${settings.language}_${settings.theme}_${settings.intensity}_${JSON.stringify(options || {})}`;
  let queue = getFromCache<any[]>(qKey) || [];
  if (queue.length >= 1) return; // Already prefetched

  let res;
  switch (gameId) {
    case 'charades': res = await generateCharades(settings, options?.category); break;
    case 'pictionary': res = await generatePictionaryPrompt(settings); break;
    case 'would_you_rather': res = await generateWouldYouRather(settings); break;
    case 'forbidden_words': res = await generateForbiddenWords(settings); break;
    case 'debate': res = await generateDebateTopic(settings); break;
    case 'two_truths': res = await generateTwoTruths(settings); break;
    case 'never_have_i_ever': res = await generateNeverHaveIEver(settings); break;
  }

  if (res && res.ok) {
    queue = getFromCache<any[]>(qKey) || [];
    queue.push(res.data);
    setCache(qKey, queue);
    console.log(`[Prefetch] Cached 1 item for ${gameId}`);
  }
};

export const consumePrefetch = <T>(gameId: string, settings: PartySettings, options?: any): T | null => {
  const qKey = `prefetch_${gameId}_${settings.language}_${settings.theme}_${settings.intensity}_${JSON.stringify(options || {})}`;
  let queue = getFromCache<any[]>(qKey) || [];
  if (queue.length > 0) {
    const item = queue.shift();
    setCache(qKey, queue);
    console.log(`[Prefetch] Consumed 1 item for ${gameId}`);
    return item as T;
  }
  return null;
};

