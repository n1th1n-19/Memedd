# Memed

A React Native app for browsing memes with swipe gestures and smooth animations. Built with Expo for cross-platform compatibility.

## Features

- 🔄 **Swipe Navigation**: Swipe left/right to browse through memes
- 📱 **Cross-Platform**: Works on iOS, Android, and Web
- ⌨️ **Keyboard Support**: Arrow keys and spacebar navigation (web)
- 🎨 **Smooth Animations**: Fluid swipe gestures with rotation and scaling effects
- 🚀 **Performance Optimized**: Image preloading and efficient meme fetching
- 🔄 **Auto-Loading**: Automatically loads more memes as you scroll
- ⚡ **Error Handling**: Graceful error handling with retry functionality

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **React Native Reanimated** - High-performance animations
- **React Native Gesture Handler** - Native gesture recognition

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/n1th1n-19/Memedd.git
cd Memedd
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Running on Different Platforms

- **iOS Simulator**: `npm run ios`
- **Android Emulator**: `npm run android`
- **Web Browser**: `npm run web`

## Usage

### Gesture Controls

- **Swipe Left**: Next meme
- **Swipe Right**: Previous meme
- **Tap**: View meme details

### Keyboard Controls (Web)

- **Arrow Left**: Previous meme
- **Arrow Right / Spacebar**: Next meme
- **R**: Refresh memes

## Project Structure

```
src/
├── components/
│   └── MemeSwiper.jsx      # Main swiper component
├── hooks/
│   └── useMemes.js         # Meme data management hook
├── services/
│   └── memeApi.js          # API service for fetching memes
└── config/
    └── api.js              # API configuration
```

## Building for Production

### Development Build
```bash
eas build --profile development
```

### Preview Build
```bash
eas build --profile preview
```

### Production Build
```bash
eas build --profile production
```

## API Integration

The app fetches memes from Reddit's API, displaying popular memes from various subreddits with metadata including:
- Subreddit name
- Upvote count
- Meme title
- Image URL

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
