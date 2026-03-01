# 🎈 PartyAI: The Ultimate Game Night Experience

Welcome to **PartyAI**, an open-source, AI-powered party game suite designed to make your game nights unforgettable! 

Powered by the Gemini API, PartyAI generates endless, context-aware, and highly creative party games on the fly. No more repeating the same trivia questions or running out of charades prompts—PartyAI creates fresh content every single time you play.

## 🎮 What is PartyAI?

PartyAI is a web-based collection of classic and modern party games, supercharged by Generative AI. It acts as your virtual game master, generating prompts, scenarios, and questions tailored to your group's preferences.

### How it Plays at Home
PartyAI is designed exclusively for **Single Device (Pass & Play)**. Perfect for small groups! Gather around a single phone or tablet, set up your players, and pass the device around when it's your turn. The app includes built-in "Pass the Phone" screens to keep secrets hidden!

## 🎲 Supported Games

PartyAI currently features **10+ unique games**, all generated dynamically:

*   **🧠 AI Trivia:** Endless trivia tailored to any category you can imagine.
*   **🎭 Charades:** Act out AI-generated prompts ranging from easy to impossible.
*   **🤐 Forbidden Words:** Describe the target word without using the forbidden list (like Taboo).
*   **⚖️ Debate Club:** Hilarious, absurd debate topics where players must argue for or against.
*   **🕵️ Impostor (Spyfall):** One player is the impostor. Ask questions to figure out who it is before time runs out!
*   **🩸 Murder Mystery:** A mini-RPG where players get unique roles, secrets, and bios. Find the killer!
*   **🎨 Pictionary:** Draw AI-generated prompts while others guess.
*   **⚡ Category Rush (Scattergories):** Name items in a category starting with a specific letter.
*   **🤔 Who Am I?:** Hold the phone to your forehead and guess the character based on your friends' clues.
*   **🕵️‍♂️ Secret Code (Codenames):** Spymasters give one-word clues to help their team guess the right words.
*   **🤷 Would You Rather:** Absurd, AI-generated dilemmas.
*   **🤥 Two Truths & A Lie:** Spot the AI's lie, or enter your own to fool your friends!
*   **🫣 Never Have I Ever:** Family-friendly, AI-generated prompts to learn more about your friends.

## 🚀 How to Run Locally

Want to host your own version of PartyAI or contribute to the code? It's easy!

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn
*   A Gemini API Key (see below)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/partyai.git
   cd partyai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your Environment Variables:**
   Copy the example environment file and add your API key.
   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 🔑 Setting the `GEMINI_API_KEY`

PartyAI relies on Google's Gemini API to generate game content. 

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account and click **"Get API Key"**.
3. Create a new API key.
4. Open the `.env` file in your project root and add your key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: Never commit your `.env` file to version control!)*

## 🛠️ Troubleshooting

*   **"API Key Missing" Error:** Ensure you have created a `.env` file in the root directory and that `GEMINI_API_KEY` is spelled correctly. Restart your dev server after changing `.env`.
*   **Port 3000 is in use:** If another app is using port 3000, Vite might fail or pick a different port. You can kill the process using port 3000 or change the port in `vite.config.ts`.

## 🍕 Party-Night Tips

To get the most out of PartyAI during your game night:
*   **Cast to the Big Screen:** Cast your phone screen to your TV so everyone can see the timer and scores!
*   **Adjust the Intensity:** Use the Settings menu (⚙️) to change the "Prompt Intensity" from Family Friendly to Chaotic for wilder prompts.
*   **Accessibility:** Playing in a dimly lit room? Turn on **High Contrast Mode** in the settings for better readability.
*   **Turn on Sound & Haptics:** The app features sound effects and haptic feedback (vibrations) for a more immersive experience. Make sure your phone isn't on silent!

## 🗺️ Roadmap

We are constantly looking to improve PartyAI. Here's what's coming next:
- [ ] **Custom Avatars:** Let players upload their own selfies instead of using emojis.
- [ ] **More Languages:** Expand beyond English and Chinese (Spanish, French, etc.).
- [ ] **Game History:** Save your funniest moments and debates to a "Hall of Fame".

## 🤝 Contributing

We love contributions! Whether it's adding a new game, fixing a bug, or improving the UI, your help is welcome.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please ensure your code follows the existing style (Tailwind CSS, React Functional Components) and that you test your changes locally before submitting.

---
*Built with ❤️ and AI.*
