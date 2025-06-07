# Multichannel Audio Mixer

A professional-grade multichannel audio mixer built with Electron, TypeScript, and React. This application provides real-time audio mixing capabilities with a modern, intuitive interface designed for audio engineers and content creators.

## Features

### Core Audio Features
- **Real-time Audio Processing**: Low-latency audio mixing using Web Audio API
- **Multichannel Support**: Add unlimited audio channels with individual controls
- **Professional EQ**: 3-band parametric EQ on each channel (High, Mid, Low)
- **Audio Level Metering**: Real-time peak and RMS level monitoring with clipping detection
- **Master Limiter**: Built-in limiter with adjustable threshold and ratio
- **Pan Control**: Stereo positioning for each channel
- **Solo/Mute**: Individual channel solo and mute functionality

### User Interface
- **Modern Design**: Dark theme with professional audio equipment aesthetics
- **Responsive Controls**: Smooth faders, knobs, and interactive elements
- **Visual Feedback**: Real-time audio meters with color-coded level indication
- **Intuitive Layout**: Channel strips with master section layout familiar to audio engineers

### File Management
- **Project Save/Load**: Save and restore complete mixer configurations
- **Audio Import**: Support for WAV, MP3, FLAC, AAC, and OGG audio files
- **Cross-platform**: Works on Windows, macOS, and Linux

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Desktop Framework**: Electron 28
- **Audio Processing**: Web Audio API
- **Styling**: Styled Components
- **Build System**: Webpack 5
- **Package Manager**: npm

## Installation

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/glitchlabs-eng/multichannel-audio-mixer.git
   cd multichannel-audio-mixer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Development

### Available Scripts

- `npm start` - Start the development environment
- `npm run build` - Build the application for production
- `npm run package` - Package the app for distribution
- `npm run package:win` - Package for Windows
- `npm run package:mac` - Package for macOS
- `npm run package:linux` - Package for Linux
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
src/
├── components/          # React components
│   ├── AudioMeter.tsx   # Audio level meter component
│   ├── Fader.tsx        # Vertical/horizontal fader control
│   ├── Knob.tsx         # Rotary knob control
│   ├── MasterSection.tsx # Master output controls
│   ├── MixerChannel.tsx # Individual channel strip
│   └── Toolbar.tsx      # Top toolbar with controls
├── services/            # Core services
│   └── AudioEngine.ts   # Audio processing engine
├── types/               # TypeScript type definitions
│   └── audio.ts         # Audio-related types
├── utils/               # Utility functions
│   └── defaults.ts      # Default values and helpers
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
└── index.html           # HTML template

electron/
├── main.ts              # Electron main process
└── preload.ts           # Preload script for secure IPC
```

### Architecture

The application follows a modular architecture with clear separation of concerns:

1. **Audio Engine**: Handles all audio processing using Web Audio API
2. **React Components**: Provide the user interface with real-time updates
3. **Electron Integration**: Manages desktop app functionality and file operations
4. **Type Safety**: Full TypeScript coverage for robust development

### Audio Processing Pipeline

```
Audio Input → Channel Processor → EQ → Effects → Pan → Gain → Master Bus → Output
                     ↓
                Audio Analyzer → Level Meter → UI Updates
```

## Usage

### Basic Operation

1. **Adding Channels**: Click the "Add Channel" button in the toolbar
2. **Importing Audio**: Use File → Import Audio to load audio files
3. **Mixing**: Adjust faders, EQ, and pan controls for each channel
4. **Monitoring**: Watch the level meters to avoid clipping
5. **Master Control**: Use the master section for overall output control

### Keyboard Shortcuts

- `Ctrl/Cmd + N` - New Project
- `Ctrl/Cmd + O` - Open Project
- `Ctrl/Cmd + S` - Save Project
- `Ctrl/Cmd + I` - Import Audio
- `Ctrl/Cmd + E` - Export Mix

### Audio Settings

The mixer automatically detects available audio devices and uses optimal settings:
- Sample Rate: 44.1 kHz
- Buffer Size: 512 samples
- Latency: Interactive mode for real-time performance

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use SOLID principles for class design
- Write comprehensive tests for new features
- Maintain consistent code formatting with ESLint
- Document public APIs and complex algorithms

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Web Audio API for real-time audio processing
- Electron team for the desktop framework
- React community for the UI framework
- Audio engineering community for inspiration and feedback

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check the documentation
- Review existing issues for solutions

---

Built with ❤️ by [glitchlabs-eng](https://github.com/glitchlabs-eng)
