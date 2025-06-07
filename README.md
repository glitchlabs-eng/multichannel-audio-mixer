# 🎵 Professional Audio Mixer

A professional-grade digital audio workstation built with Electron, featuring virtual instruments, MIDI integration, multi-track recording, and advanced audio processing.

![Professional Audio Mixer](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Download

### Latest Release: v1.0.0

| Platform | Architecture | Download | Size |
|----------|-------------|----------|------|
| 🍎 **macOS** | Intel (x64) | [Download ZIP](https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-1.0.0-mac.zip) | 95 MB |
| 🍎 **macOS** | Apple Silicon (ARM64) | [Download ZIP](https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-1.0.0-arm64-mac.zip) | 90 MB |
| 🖥️ **Windows** | x64 | [Download Installer](https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-Setup-1.0.0.exe) | Coming Soon |
| 🐧 **Linux** | x64 | [Download AppImage](https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-1.0.0.AppImage) | 106 MB |

## ✨ Features

### 🎹 Virtual Instruments
- **Professional Synthesizer Engine** - Subtractive synthesis with polyphonic voice management
- **Built-in Presets** - Lead, Pad, Bass, and Pluck sounds ready to use
- **Real-time Parameter Control** - ADSR envelope, filter, oscillator controls
- **16-Voice Polyphony** - Professional voice allocation and management

### 🎛️ MIDI Integration
- **Hardware Controller Support** - Connect any MIDI keyboard or controller
- **MIDI Learn Functionality** - One-click parameter mapping
- **Real-time Control** - Hardware knobs control software parameters
- **Multi-device Support** - Connect multiple MIDI devices simultaneously
- **MIDI Activity Monitoring** - Real-time MIDI message display

### 📹 Recording Studio
- **Multi-track Recording** - Record multiple channels simultaneously
- **Session Management** - Professional project organization with templates
- **Auto-save Functionality** - Never lose your work
- **Export Options** - WAV, MP3, FLAC, AAC with quality settings
- **Real-time Monitoring** - Live recording feedback and duration display

### 🎚️ Professional Mixing
- **Advanced Audio Engine** - Low-latency, high-quality audio processing
- **Real-time Effects** - Professional audio effects and processing
- **EQ and Dynamics** - Advanced equalization and compression
- **Master Section** - Professional master bus processing
- **Level Monitoring** - Real-time audio level meters

## 🖥️ Installation

### macOS
1. **Download** the appropriate ZIP file for your Mac:
   - Intel Macs: Download the `mac.zip` file
   - Apple Silicon Macs (M1/M2/M3): Download the `arm64-mac.zip` file
2. **Extract** the ZIP file by double-clicking it
3. **Drag** "Professional Audio Mixer.app" to your Applications folder
4. **Launch** from Applications folder
5. **Allow permissions** when prompted for microphone and MIDI access

### Windows
1. **Download** the installer (.exe file)
2. **Run** the installer and follow the setup wizard
3. **Launch** from Start Menu or Desktop shortcut

### Linux
1. **Download** the AppImage file
2. **Make it executable**: `chmod +x Professional-Audio-Mixer-1.0.0.AppImage`
3. **Run** the AppImage: `./Professional-Audio-Mixer-1.0.0.AppImage`

## 🎵 Quick Start Guide

### 1. Create Your First Virtual Instrument
1. Look at the **Virtual Instruments** panel on the left
2. Select "Synthesizer" and enter a name like "My Synth"
3. Click **"Create"**
4. Click the virtual keyboard to hear sound!

### 2. Connect a MIDI Keyboard (Optional)
1. Plug in your MIDI keyboard via USB
2. Check the **MIDI Control** panel - you should see your device listed
3. Play your MIDI keyboard - it will control the virtual instruments!

### 3. Use MIDI Learn
1. Click any orange **"M"** button next to a knob or fader
2. Turn a knob on your MIDI keyboard
3. The software control is now mapped to your hardware!

### 4. Record Your Performance
1. Go to the **Recording** panel
2. Enter a session name
3. Click the red **"● REC"** button
4. Play your instruments
5. Click **"■ STOP"** when finished

### 5. Try Different Sounds
1. In the Virtual Instruments panel, click **"Select Preset"**
2. Try different presets:
   - **Lead Synth** - Bright, cutting lead sound
   - **Warm Pad** - Atmospheric background sound
   - **Bass Synth** - Deep, punchy bass
   - **Pluck** - Short, percussive sound

## 🔧 System Requirements

### Minimum Requirements
- **macOS**: 10.14 Mojave or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04 or equivalent
- **RAM**: 4GB minimum
- **Storage**: 200MB free space
- **Audio**: Built-in audio or external audio interface

### Recommended
- **RAM**: 8GB or more
- **Audio Interface**: External audio interface for professional recording
- **MIDI Controller**: MIDI keyboard or control surface
- **Headphones/Monitors**: Quality headphones or studio monitors

## 🎛️ MIDI Controller Compatibility

This application works with any class-compliant MIDI device, including:

- **MIDI Keyboards**: Any USB MIDI keyboard
- **Control Surfaces**: Novation Launchpad, Akai MPK series, etc.
- **Audio Interfaces with MIDI**: Focusrite Scarlett series, etc.
- **Software MIDI**: Virtual MIDI devices and software

## 🆘 Troubleshooting

### No Sound from Virtual Instruments
- ✅ Check your computer's audio output settings
- ✅ Ensure the instrument is enabled (green toggle)
- ✅ Try different presets
- ✅ Check the volume knob on the instrument

### MIDI Keyboard Not Detected
- ✅ Ensure the keyboard is plugged in properly
- ✅ Check the MIDI Control panel for device status
- ✅ Try unplugging and reconnecting the device
- ✅ Restart the application

### Recording Issues
- ✅ Grant microphone permissions when prompted
- ✅ Check your audio input settings
- ✅ Ensure you have sufficient disk space

### macOS Security Warning
If you see "App can't be opened because it is from an unidentified developer":
1. Right-click the app and select "Open"
2. Click "Open" in the security dialog
3. The app will remember this choice for future launches

## 🛠️ Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/glitchlabs-eng/multichannel-audio-mixer.git
cd multichannel-audio-mixer

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build

# Create distributable packages
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

### Tech Stack
- **Electron** - Cross-platform desktop framework
- **React** - User interface framework
- **TypeScript** - Type-safe JavaScript
- **Web Audio API** - Professional audio processing
- **Web MIDI API** - MIDI controller integration
- **Styled Components** - Component styling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/glitchlabs-eng/multichannel-audio-mixer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/glitchlabs-eng/multichannel-audio-mixer/discussions)

## 🎵 Credits

Developed by **GlitchLabs Engineering** with ❤️ for the music production community.

---

**Professional Audio Mixer** - Bringing professional music production to everyone! 🎵✨
