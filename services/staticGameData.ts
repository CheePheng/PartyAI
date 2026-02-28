import { TriviaQuestion, CharadePrompt, ForbiddenWordsCard, DebatePrompt, ImpostorScenario, MurderMysteryScenario, PictionaryPrompt, CategoryRushRound, WhoAmIWord, WouldYouRatherPrompt, TwoTruthsPrompt, NeverHaveIEverPrompt } from '../types';

export const FALLBACK_TRIVIA: TriviaQuestion[] = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    answerIndex: 1,
    explanation: "Mars is often called the 'Red Planet' because of its reddish appearance.",
    difficulty: "Easy"
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    answerIndex: 1,
    explanation: "William Shakespeare wrote the famous tragedy Romeo and Juliet.",
    difficulty: "Easy"
  },
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Madrid", "Paris"],
    answerIndex: 3,
    explanation: "Paris is the capital and most populous city of France.",
    difficulty: "Easy"
  },
  {
    question: "What is the chemical symbol for Gold?",
    options: ["Au", "Ag", "Fe", "Cu"],
    answerIndex: 0,
    explanation: "Au comes from the Latin word for gold, 'Aurum'.",
    difficulty: "Medium"
  },
  {
    question: "In which year did the Titanic sink?",
    options: ["1905", "1912", "1918", "1923"],
    answerIndex: 1,
    explanation: "The Titanic sank in the North Atlantic Ocean in 1912.",
    difficulty: "Medium"
  }
];

export const FALLBACK_CHARADES: CharadePrompt[] = [
  { phrase: "Harry Potter", category: "Movies", hint: "Wizard boy", difficulty: "Easy" },
  { phrase: "Playing Tennis", category: "Sports", hint: "Racket and ball", difficulty: "Easy" },
  { phrase: "The Lion King", category: "Movies", hint: "Circle of Life", difficulty: "Easy" },
  { phrase: "Cooking Pasta", category: "Activity", hint: "Boiling water", difficulty: "Easy" },
  { phrase: "Astronaut", category: "Jobs", hint: "Space travel", difficulty: "Medium" }
];

export const FALLBACK_FORBIDDEN: ForbiddenWordsCard[] = [
  { target: "Coffee", forbidden: ["Drink", "Caffeine", "Morning", "Starbucks"], difficulty: "Easy" },
  { target: "Beach", forbidden: ["Sand", "Ocean", "Sun", "Summer"], difficulty: "Easy" },
  { target: "Superman", forbidden: ["Hero", "Cape", "Fly", "Kryptonite"], difficulty: "Medium" },
  { target: "iPhone", forbidden: ["Apple", "Phone", "Call", "Steve Jobs"], difficulty: "Medium" },
  { target: "Guitar", forbidden: ["Music", "Strings", "Instrument", "Play"], difficulty: "Easy" }
];

export const FALLBACK_DEBATE: DebatePrompt[] = [
  { topic: "Cats are better than dogs.", sideA: "Pro-Cats", sideB: "Pro-Dogs" },
  { topic: "Pineapple belongs on pizza.", sideA: "Yes", sideB: "No" },
  { topic: "Summer is better than Winter.", sideA: "Summer", sideB: "Winter" },
  { topic: "Video games are a sport.", sideA: "Sport", sideB: "Not a sport" },
  { topic: "Toilet paper should hang over, not under.", sideA: "Over", sideB: "Under" }
];

export const FALLBACK_IMPOSTOR: ImpostorScenario[] = [
  { location: "Hospital", roles: ["Doctor", "Nurse", "Patient", "Surgeon", "Receptionist"] },
  { location: "Pirate Ship", roles: ["Captain", "Sailor", "Cook", "Prisoner", "Parrot"] },
  { location: "School", roles: ["Teacher", "Student", "Principal", "Janitor", "Coach"] },
  { location: "Restaurant", roles: ["Chef", "Waiter", "Customer", "Manager", "Dishwasher"] },
  { location: "Space Station", roles: ["Astronaut", "Alien", "Engineer", "Commander", "Scientist"] }
];

export const FALLBACK_MURDER_MYSTERY: MurderMysteryScenario = {
  title: "The Manor Mystery",
  intro: "A wealthy tycoon has been found dead in his study. Who did it?",
  characters: [
    { name: "Butler Jeeves", role: "Killer", publicBio: "Loyal servant.", secretInfo: "You hated the tycoon." },
    { name: "Detective Holmes", role: "Detective", publicBio: "Famous investigator.", secretInfo: "Solve the case." },
    { name: "Maid Mary", role: "Suspect", publicBio: "Quiet cleaner.", secretInfo: "You stole some silver." },
    { name: "Chef Pierre", role: "Suspect", publicBio: "Angry cook.", secretInfo: "He critiqued your food." },
    { name: "Gardener Sam", role: "Suspect", publicBio: "Loves plants.", secretInfo: "He trampled your roses." }
  ]
};

export const FALLBACK_PICTIONARY: PictionaryPrompt[] = [
  { word: "Eiffel Tower", category: "Landmark", difficulty: "Medium" },
  { word: "Pizza", category: "Food", difficulty: "Easy" },
  { word: "Bicycle", category: "Object", difficulty: "Easy" },
  { word: "Sleeping", category: "Action", difficulty: "Easy" },
  { word: "Dragon", category: "Fantasy", difficulty: "Medium" }
];

export const FALLBACK_SCATTERGORIES: CategoryRushRound[] = [
  { letter: "S", categories: ["Fruits", "Cities", "Animals", "Jobs", "Sports", "Colors"] },
  { letter: "M", categories: ["Movies", "Foods", "Countries", "Names", "Brands", "Songs"] },
  { letter: "C", categories: ["Cars", "Clothing", "Drinks", "Hobbies", "Tools", "Furniture"] },
  { letter: "B", categories: ["Books", "Bands", "Body Parts", "Buildings", "Breakfast Foods", "Birds"] },
  { letter: "P", categories: ["Plants", "Pizza Toppings", "Professions", "Parks", "Phone Apps", "Politicians"] }
];

export const FALLBACK_WHO_AM_I: WhoAmIWord[] = [
  { word: "Mickey Mouse", hint: "Disney mascot" },
  { word: "Albert Einstein", hint: "E=mc2" },
  { word: "Beyoncé", hint: "Singer, Queen B" },
  { word: "Spider-Man", hint: "Web slinger" },
  { word: "Santa Claus", hint: "Ho ho ho" }
];

export const FALLBACK_SECRET_CODE: string[] = [
  "Time", "Year", "People", "Way", "Day", "Man", "Thing", "Woman", "Life", "Child",
  "World", "School", "State", "Family", "Student", "Group", "Country", "Problem", "Hand", "Part",
  "Place", "Case", "Week", "Company", "System", "Book", "Eye", "Job", "Word", "Business"
];

export const FALLBACK_WOULD_YOU_RATHER: WouldYouRatherPrompt[] = [
  { optionA: "Have the ability to fly", optionB: "Be invisible" },
  { optionA: "Always be 10 minutes late", optionB: "Always be 20 minutes early" },
  { optionA: "Speak all languages", optionB: "Speak to animals" },
  { optionA: "Have a rewind button for your life", optionB: "Have a pause button for your life" },
  { optionA: "Live without music", optionB: "Live without movies" }
];

export const FALLBACK_TWO_TRUTHS: TwoTruthsPrompt[] = [
  { statement1: "I have never broken a bone.", statement2: "I have met a celebrity.", statement3: "I can speak three languages.", lieIndex: 2 },
  { statement1: "I once won a hot dog eating contest.", statement2: "I am terrified of spiders.", statement3: "I have never been on an airplane.", lieIndex: 0 },
  { statement1: "I have a twin.", statement2: "I have never eaten sushi.", statement3: "I can juggle.", lieIndex: 1 }
];

export const FALLBACK_NEVER_HAVE_I_EVER: NeverHaveIEverPrompt[] = [
  { statement: "Never have I ever pretended to be sick to get out of something." },
  { statement: "Never have I ever accidentally sent a text to the wrong person." },
  { statement: "Never have I ever fallen asleep in public." },
  { statement: "Never have I ever forgotten someone's name immediately after meeting them." },
  { statement: "Never have I ever eaten food that fell on the floor." }
];
