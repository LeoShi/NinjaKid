# NinjaKid 🎮

A motion-based interactive game for kids that uses pose detection to create an immersive cyberpunk-style experience. Use your body movements to catch falling items and score points!

## ✨ Features

- **Motion Detection**: Real-time pose tracking using MediaPipe Pose
- **Interactive Gameplay**: Catch emojis (🍬, ⭐, 🚀, 💎, 🔥, 🤖) with your body movements
- **AI-Powered Comments**: Get energetic, cyberpunk-style compliments from Google Gemini AI as you play
- **Audio Visualization**: Background music affects visual effects and particle animations
- **Neon Cyberpunk UI**: Beautiful glassmorphism design with neon effects
- **Real-time Scoring**: Track your progress with a live scoreboard

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **MediaPipe Pose** - Body pose detection
- **Google Gemini AI** - AI-powered game commentary
- **Tailwind CSS** - Styling
- **React Webcam** - Camera access

## 📋 Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A webcam
- A modern web browser with camera permissions

## 🚀 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NinjaKid
```

2. Install dependencies:
```bash
npm install
```

3. Configure API Key:
   - Open `src/App.tsx`
   - Replace the `GEMINI_API_KEY` constant with your Google Gemini API key:
   ```typescript
   const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
   ```

## 🎮 Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to the URL shown (typically `http://localhost:5173`)

3. Allow camera permissions when prompted

4. (Optional) Upload background music by clicking "上传背景音乐 (MP3)"

5. Click "INITIATE LINK" to start the game

6. Move your body to catch the falling emojis! The game tracks specific body joints (nose, hands, feet) for collision detection.

## 🎯 How to Play

- **Goal**: Catch as many emojis as possible with your body movements
- **Scoring**: Each caught emoji gives you 10 points
- **AI Comments**: Every 50 points, you'll receive an AI-generated compliment
- **Visual Effects**: The neon skeleton visualization and particles react to your background music

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure

```
NinjaKid/
├── src/
│   ├── App.tsx          # Main game component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json          # Dependencies
└── vite.config.ts        # Vite configuration
```

## 🔧 Configuration

### API Key Setup

To enable AI comments, you need a Google Gemini API key:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update the `GEMINI_API_KEY` in `src/App.tsx`

**Note**: The AI feature has rate limiting (max 5 requests per minute) to prevent API abuse.

### Camera Settings

The game uses a 1280x720 resolution webcam feed. You can adjust this in the `Camera` initialization in `App.tsx`.

## 🎨 Customization

### Game Items

Modify the `GAME_ITEMS` array in `App.tsx` to change the emojis that appear:
```typescript
const GAME_ITEMS = ['🍬', '⭐', '🚀', '💎', '🔥', '🤖'];
```

### Active Joints

The game tracks specific body joints for collision detection. Modify `ACTIVE_JOINTS` to change which body parts can catch items:
```typescript
const ACTIVE_JOINTS = [0, 19, 20, 31, 32]; // nose, left/right hands, left/right feet
```

### Colors

Adjust the `NEON_COLORS` array to change particle explosion colors:
```typescript
const NEON_COLORS = ['#0ff', '#f0f', '#ff0', '#0f0'];
```

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## ⚠️ Notes

- Camera permissions are required for the game to function
- The game works best in a well-lit environment
- Make sure you have enough space to move around
- Audio file upload is optional but enhances the visual experience

**Enjoy playing NinjaKid!** 🎉
