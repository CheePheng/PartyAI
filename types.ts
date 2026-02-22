
export type Language = 'en' | 'zh';

export interface PlayerStats {
  wins: number;
  played: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  avatar: string;
  gamesPlayed: number;
  wins: number;
  stats: Partial<Record<GameType, PlayerStats>>;
}

export enum GameType {
  TRIVIA = 'TRIVIA',
  CHARADES = 'CHARADES',
  DEBATE = 'DEBATE',
  IMPOSTOR = 'IMPOSTOR',
  MURDER_MYSTERY = 'MURDER_MYSTERY',
  FORBIDDEN_WORDS = 'FORBIDDEN_WORDS',
  PICTIONARY = 'PICTIONARY',
  SCATTERGORIES = 'SCATTERGORIES',
  WHO_AM_I = 'WHO_AM_I',
  SECRET_CODE = 'SECRET_CODE',
}

export interface GameDefinition {
  id: GameType;
  title: Record<Language, string>;
  description: Record<Language, string>;
  icon: string;
  color: string;
  minPlayers: number;
  rules: Record<Language, string>;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: string;
}

export interface CharadePrompt {
  phrase: string;
  category: string;
  hint: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
}

export interface ForbiddenWordsCard {
  target: string;
  forbidden: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface DebatePrompt {
  topic: string;
  sideA: string;
  sideB: string;
}

export interface ImpostorScenario {
  location: string;
  roles: string[];
}

export interface MurderMysteryCharacter {
  name: string;
  role: 'Killer' | 'Detective' | 'Suspect';
  publicBio: string;
  secretInfo: string;
}

export interface MurderMysteryScenario {
  title: string;
  intro: string;
  characters: MurderMysteryCharacter[];
}

export interface PictionaryPrompt {
  word: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface CategoryRushRound {
  letter: string;
  categories: string[];
}

export interface WhoAmIWord {
  word: string;
  hint: string;
}

export interface SecretCodeWord {
  word: string;
  type: 'RED' | 'BLUE' | 'NEUTRAL' | 'ASSASSIN';
  revealed: boolean;
}
