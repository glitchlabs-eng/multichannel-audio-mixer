#!/bin/bash

# Upload Release Assets to GitHub
# This script uploads the built application files to the GitHub release

echo "🚀 Uploading Professional Audio Mixer v1.0.0 Release Assets"
echo "============================================================"

# Configuration
REPO_OWNER="glitchlabs-eng"
REPO_NAME="multichannel-audio-mixer"
RELEASE_TAG="v1.0.0"
RELEASE_DIR="release"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "📥 Install it from: https://cli.github.com/"
    echo "🔧 Or use: brew install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Please authenticate with GitHub CLI:"
    echo "gh auth login"
    exit 1
fi

# Check if release directory exists
if [ ! -d "$RELEASE_DIR" ]; then
    echo "❌ Release directory not found: $RELEASE_DIR"
    echo "🔧 Please run: npm run dist:mac && npm run dist:linux"
    exit 1
fi

# Files to upload
FILES=(
    "Professional-Audio-Mixer-1.0.0-mac.zip"
    "Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
    "Professional-Audio-Mixer-1.0.0.AppImage"
)

echo "📁 Checking files in $RELEASE_DIR..."

# Check if all files exist
for file in "${FILES[@]}"; do
    if [ ! -f "$RELEASE_DIR/$file" ]; then
        echo "❌ File not found: $RELEASE_DIR/$file"
        echo "🔧 Please build the applications first"
        exit 1
    else
        size=$(du -h "$RELEASE_DIR/$file" | cut -f1)
        echo "✅ Found: $file ($size)"
    fi
done

echo ""
echo "🚀 Uploading assets to GitHub release $RELEASE_TAG..."

# Upload each file
for file in "${FILES[@]}"; do
    echo "📤 Uploading $file..."
    
    if gh release upload "$RELEASE_TAG" "$RELEASE_DIR/$file" --repo "$REPO_OWNER/$REPO_NAME"; then
        echo "✅ Successfully uploaded: $file"
    else
        echo "❌ Failed to upload: $file"
        exit 1
    fi
done

echo ""
echo "🎉 All files uploaded successfully!"
echo "🌐 View release: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$RELEASE_TAG"
echo ""
echo "📥 Download links:"
echo "🍎 macOS (Intel): https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$RELEASE_TAG/Professional-Audio-Mixer-1.0.0-mac.zip"
echo "🍎 macOS (Apple Silicon): https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$RELEASE_TAG/Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
echo "🐧 Linux: https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$RELEASE_TAG/Professional-Audio-Mixer-1.0.0.AppImage"
echo ""
echo "✨ Professional Audio Mixer v1.0.0 is now available for download!"
