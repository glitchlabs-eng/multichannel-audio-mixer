#!/bin/bash

# Verify Release Readiness Script
# This script checks if everything is ready for the macOS release

echo "🔍 Professional Audio Mixer - Release Verification"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
RELEASE_DIR="release"
EXPECTED_FILES=(
    "Professional-Audio-Mixer-1.0.0-mac.zip"
    "Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
)

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_success "Running from project root directory"

# Check if release directory exists
if [ ! -d "$RELEASE_DIR" ]; then
    print_error "Release directory not found: $RELEASE_DIR"
    print_info "Run: npm run dist:mac to build the applications"
    exit 1
fi

print_success "Release directory found"

# Check for expected files
echo ""
print_info "Checking macOS release files..."

all_files_present=true
total_size=0

for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$RELEASE_DIR/$file" ]; then
        size=$(du -h "$RELEASE_DIR/$file" | cut -f1)
        size_bytes=$(du -b "$RELEASE_DIR/$file" | cut -f1)
        total_size=$((total_size + size_bytes))
        print_success "Found: $file ($size)"
    else
        print_error "Missing: $file"
        all_files_present=false
    fi
done

if [ "$all_files_present" = false ]; then
    print_error "Some files are missing. Please build the applications first."
    print_info "Run: npm run dist:mac"
    exit 1
fi

# Calculate total size
total_size_mb=$((total_size / 1024 / 1024))
print_success "All macOS files present (Total: ${total_size_mb} MB)"

# Check file integrity (basic check)
echo ""
print_info "Checking file integrity..."

for file in "${EXPECTED_FILES[@]}"; do
    if file "$RELEASE_DIR/$file" | grep -q "Zip archive data"; then
        print_success "$file is a valid ZIP archive"
    else
        print_warning "$file may not be a valid ZIP archive"
    fi
done

# Check if GitHub release exists
echo ""
print_info "Checking GitHub release status..."

if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        if gh release view v1.0.0 &> /dev/null; then
            print_success "GitHub release v1.0.0 exists"
            
            # Check if assets are already uploaded
            assets=$(gh release view v1.0.0 --json assets --jq '.assets[].name')
            if [ -n "$assets" ]; then
                print_info "Current release assets:"
                echo "$assets" | while read -r asset; do
                    echo "  - $asset"
                done
            else
                print_warning "No assets uploaded yet"
            fi
        else
            print_error "GitHub release v1.0.0 not found"
        fi
    else
        print_warning "GitHub CLI not authenticated"
        print_info "Run: gh auth login"
    fi
else
    print_warning "GitHub CLI not installed"
    print_info "Install with: brew install gh"
fi

# Summary and next steps
echo ""
echo "🎯 SUMMARY"
echo "=========="

if [ "$all_files_present" = true ]; then
    print_success "All macOS release files are ready!"
    echo ""
    print_info "Next steps:"
    echo "1. Go to: https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/tag/v1.0.0"
    echo "2. Click 'Edit'"
    echo "3. Upload these files:"
    for file in "${EXPECTED_FILES[@]}"; do
        echo "   - $RELEASE_DIR/$file"
    done
    echo "4. Click 'Update release'"
    echo ""
    print_info "Or use the automated upload script:"
    echo "   ./upload-release-assets.sh"
    echo ""
    print_success "Your professional audio mixer is ready for release! 🎵"
else
    print_error "Release files are not ready"
    print_info "Please build the applications first: npm run dist:mac"
fi

echo ""
print_info "For detailed instructions, see: UPLOAD_MACOS_RELEASE.md"
