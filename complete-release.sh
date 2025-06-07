#!/bin/bash

# Complete Release Automation Script
# This script completes the GitHub release by uploading all assets

echo "🚀 Professional Audio Mixer - Complete Release Automation"
echo "=========================================================="

# Configuration
REPO_OWNER="glitchlabs-eng"
REPO_NAME="multichannel-audio-mixer"
RELEASE_TAG="v1.0.0"
RELEASE_DIR="release"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if release directory exists
if [ ! -d "$RELEASE_DIR" ]; then
    print_error "Release directory not found. Building applications..."
    
    print_status "Building Mac applications..."
    npm run dist:mac
    
    print_status "Building Linux application..."
    npm run dist:linux
    
    if [ ! -d "$RELEASE_DIR" ]; then
        print_error "Build failed. Please check the build process."
        exit 1
    fi
fi

# Files to upload
FILES=(
    "Professional-Audio-Mixer-1.0.0-mac.zip"
    "Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
    "Professional-Audio-Mixer-1.0.0.AppImage"
)

print_status "Checking release files..."

# Check if all files exist and get their sizes
for file in "${FILES[@]}"; do
    if [ ! -f "$RELEASE_DIR/$file" ]; then
        print_error "File not found: $RELEASE_DIR/$file"
        print_warning "Please ensure all applications are built correctly"
        exit 1
    else
        size=$(du -h "$RELEASE_DIR/$file" | cut -f1)
        print_success "Found: $file ($size)"
    fi
done

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed."
    echo ""
    echo "📥 Install options:"
    echo "   macOS: brew install gh"
    echo "   Or download from: https://cli.github.com/"
    echo ""
    echo "🔧 Alternative: Manual upload via web interface"
    echo "   1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$RELEASE_TAG"
    echo "   2. Click 'Edit'"
    echo "   3. Drag files to 'Attach binaries' section:"
    for file in "${FILES[@]}"; do
        echo "      - $RELEASE_DIR/$file"
    done
    echo "   4. Click 'Update release'"
    exit 1
fi

# Check authentication
print_status "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    print_error "Not authenticated with GitHub CLI"
    echo ""
    echo "🔐 Please authenticate:"
    echo "   gh auth login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

print_success "GitHub CLI authenticated"

# Check if release exists
print_status "Checking if release exists..."
if ! gh release view "$RELEASE_TAG" --repo "$REPO_OWNER/$REPO_NAME" &> /dev/null; then
    print_error "Release $RELEASE_TAG not found"
    print_warning "Please ensure the release was created properly"
    exit 1
fi

print_success "Release $RELEASE_TAG found"

# Upload files
echo ""
print_status "Uploading release assets..."
echo ""

upload_success=true

for file in "${FILES[@]}"; do
    echo -n "📤 Uploading $file... "
    
    if gh release upload "$RELEASE_TAG" "$RELEASE_DIR/$file" --repo "$REPO_OWNER/$REPO_NAME" --clobber 2>/dev/null; then
        print_success "✓"
    else
        print_error "✗"
        upload_success=false
    fi
done

echo ""

if [ "$upload_success" = true ]; then
    print_success "🎉 All files uploaded successfully!"
    echo ""
    echo "🌐 Release URL: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$RELEASE_TAG"
    echo ""
    echo "📥 Download Links:"
    echo "🍎 macOS (Intel):        https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$RELEASE_TAG/Professional-Audio-Mixer-1.0.0-mac.zip"
    echo "🍎 macOS (Apple Silicon): https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$RELEASE_TAG/Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
    echo "🐧 Linux:                https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$RELEASE_TAG/Professional-Audio-Mixer-1.0.0.AppImage"
    echo ""
    echo "✨ Professional Audio Mixer v1.0.0 is now available for download!"
    echo ""
    echo "🧪 Next Steps - Test Your App:"
    echo "1. Go to the release page above"
    echo "2. Download the appropriate file for your Mac"
    echo "3. Extract and install in Applications folder"
    echo "4. Launch and test the features"
    echo ""
    echo "🎵 Congratulations! You've successfully released professional audio software!"
else
    print_error "Some files failed to upload"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check your internet connection"
    echo "2. Verify GitHub CLI authentication: gh auth status"
    echo "3. Try uploading manually via web interface"
    exit 1
fi
