#!/bin/bash

# Create Professional Audio Mixer Icons
# This script creates a simple but professional icon using ImageMagick

echo "Creating Professional Audio Mixer Icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo "Please install ImageMagick manually or use Homebrew"
        exit 1
    fi
fi

# Create a simple but professional icon using ImageMagick
create_base_icon() {
    convert -size 512x512 xc:none \
        \( -size 512x512 xc:"#1a1a1a" -fill "#2a2a2a" \
           -draw "circle 256,256 256,56" \) \
        \( -size 512x512 xc:none -fill none -stroke "#4CAF50" -strokewidth 8 \
           -draw "circle 256,256 200,56" \) \
        \( -size 512x512 xc:none -fill "#333333" \
           -draw "circle 256,256 180,76" \) \
        \( -size 512x512 xc:none -fill none -stroke "#555555" -strokewidth 8 \
           -draw "line 180,180 180,330" \
           -draw "line 230,180 230,330" \
           -draw "line 280,180 280,330" \
           -draw "line 330,180 330,330" \) \
        \( -size 512x512 xc:none -fill "#4CAF50" \
           -draw "rectangle 165,200 195,220" \
           -draw "rectangle 215,220 245,240" \
           -draw "rectangle 265,240 295,260" \
           -draw "rectangle 315,260 345,280" \) \
        \( -size 512x512 xc:none -fill none -stroke "#4CAF50" -strokewidth 4 \
           -draw "circle 180,150 15,135" \
           -draw "circle 230,150 15,135" \
           -draw "circle 280,150 15,135" \
           -draw "circle 330,150 15,135" \) \
        \( -size 512x512 xc:none -fill "#4CAF50" \
           -draw "circle 256,256 25,231" \) \
        \( -size 512x512 xc:none -fill "#ffffff" \
           -draw "rectangle 275,200 279,260" \
           -draw "polygon 279,200 300,190 295,220 279,215" \) \
        -composite -composite -composite -composite -composite -composite -composite \
        assets/icon-512.png

    echo "Created base icon: assets/icon-512.png"
}

# Create different sizes
create_icon_sizes() {
    # Create different sizes for different uses
    sizes=(16 32 48 64 128 256 512 1024)
    
    for size in "${sizes[@]}"; do
        convert assets/icon-512.png -resize ${size}x${size} assets/icon-${size}.png
        echo "Created: assets/icon-${size}.png"
    done
}

# Create Mac ICNS file
create_icns() {
    # Create iconset directory
    mkdir -p assets/icon.iconset
    
    # Copy icons with proper naming for iconset
    cp assets/icon-16.png assets/icon.iconset/icon_16x16.png
    cp assets/icon-32.png assets/icon.iconset/icon_16x16@2x.png
    cp assets/icon-32.png assets/icon.iconset/icon_32x32.png
    cp assets/icon-64.png assets/icon.iconset/icon_32x32@2x.png
    cp assets/icon-128.png assets/icon.iconset/icon_128x128.png
    cp assets/icon-256.png assets/icon.iconset/icon_128x128@2x.png
    cp assets/icon-256.png assets/icon.iconset/icon_256x256.png
    cp assets/icon-512.png assets/icon.iconset/icon_256x256@2x.png
    cp assets/icon-512.png assets/icon.iconset/icon_512x512.png
    cp assets/icon-1024.png assets/icon.iconset/icon_512x512@2x.png
    
    # Create ICNS file
    iconutil -c icns assets/icon.iconset -o assets/icon.icns
    
    echo "Created: assets/icon.icns"
    
    # Clean up
    rm -rf assets/icon.iconset
}

# Create Windows ICO file
create_ico() {
    convert assets/icon-16.png assets/icon-32.png assets/icon-48.png assets/icon-64.png assets/icon-128.png assets/icon-256.png assets/icon.ico
    echo "Created: assets/icon.ico"
}

# Main execution
create_base_icon
create_icon_sizes
create_icns
create_ico

# Copy main icon
cp assets/icon-512.png assets/icon.png

echo ""
echo "✅ All icons created successfully!"
echo "📁 Files created:"
echo "   - assets/icon.png (Linux)"
echo "   - assets/icon.icns (Mac)"
echo "   - assets/icon.ico (Windows)"
echo "   - assets/icon-*.png (Various sizes)"
echo ""
echo "🚀 Ready for app distribution!"
