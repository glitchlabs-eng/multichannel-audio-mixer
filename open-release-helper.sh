#!/bin/bash

# Open Release Helper - Opens everything you need to complete the release

echo "🚀 Opening Professional Audio Mixer Release Helper"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_action() {
    echo -e "${YELLOW}🎯 $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

print_success "Professional Audio Mixer Release Helper"
echo ""

# Show file status
print_info "Checking your release files..."
if [ -f "release/Professional-Audio-Mixer-1.0.0-mac.zip" ]; then
    size1=$(du -h "release/Professional-Audio-Mixer-1.0.0-mac.zip" | cut -f1)
    print_success "Intel Mac version ready: $size1"
else
    echo "❌ Intel Mac version not found"
fi

if [ -f "release/Professional-Audio-Mixer-1.0.0-arm64-mac.zip" ]; then
    size2=$(du -h "release/Professional-Audio-Mixer-1.0.0-arm64-mac.zip" | cut -f1)
    print_success "Apple Silicon version ready: $size2"
else
    echo "❌ Apple Silicon version not found"
fi

echo ""
print_action "Opening release helper tools..."

# Open the release helper HTML page
if [ -f "release-helper.html" ]; then
    print_info "Opening release helper page..."
    if command -v open &> /dev/null; then
        # macOS
        open "release-helper.html"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "release-helper.html"
    else
        print_info "Please open release-helper.html in your browser"
    fi
else
    echo "❌ Release helper HTML not found"
fi

# Open the release folder
if [ -d "release" ]; then
    print_info "Opening release folder..."
    if command -v open &> /dev/null; then
        # macOS
        open "release"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "release"
    else
        print_info "Please navigate to the release/ folder"
    fi
fi

# Open GitHub release page
print_info "Opening GitHub release page..."
if command -v open &> /dev/null; then
    # macOS
    open "https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/tag/v1.0.0"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/tag/v1.0.0"
else
    print_info "Please open: https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/tag/v1.0.0"
fi

echo ""
print_action "Everything is ready! Follow these steps:"
echo ""
echo "1. 🌐 GitHub release page should be opening in your browser"
echo "2. 📁 Release folder should be opening with your ZIP files"
echo "3. 📄 Release helper page should be opening with instructions"
echo ""
echo "📋 Quick Steps:"
echo "   1. On GitHub: Click 'Edit'"
echo "   2. Drag the 2 ZIP files to the upload area"
echo "   3. Click 'Update release'"
echo "   4. Done! Your app is live! 🎉"
echo ""
print_success "Your Professional Audio Mixer is ready for the world! 🎵✨"
