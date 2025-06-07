#!/usr/bin/env python3
"""
Create basic icons for the audio mixer app
"""

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available, creating placeholder files...")

import os

def create_placeholder_icon(size, filename):
    """Create a simple placeholder icon"""
    if PIL_AVAILABLE:
        # Create with PIL
        img = Image.new('RGBA', (size, size), (26, 26, 26, 255))
        draw = ImageDraw.Draw(img)
        
        # Simple design
        # Outer circle
        margin = size // 8
        draw.ellipse([margin, margin, size-margin, size-margin], 
                    outline=(76, 175, 80, 255), width=max(1, size//64))
        
        # Inner circle
        inner_margin = size // 4
        draw.ellipse([inner_margin, inner_margin, size-inner_margin, size-inner_margin], 
                    fill=(51, 51, 51, 255))
        
        # Simple mixer representation
        center = size // 2
        fader_width = max(1, size // 32)
        
        # 3 vertical lines (faders)
        for i in range(3):
            x = center - size//8 + i * size//8
            y1 = center - size//6
            y2 = center + size//6
            draw.rectangle([x-fader_width//2, y1, x+fader_width//2, y2], 
                         fill=(76, 175, 80, 255))
        
        # Center circle (musical note representation)
        note_size = size // 8
        draw.ellipse([center-note_size, center-note_size, center+note_size, center+note_size], 
                    fill=(76, 175, 80, 255))
        
        img.save(filename, 'PNG')
        print(f"Created: {filename}")
    else:
        # Create empty file as placeholder
        with open(filename, 'w') as f:
            f.write('')
        print(f"Created placeholder: {filename}")

def main():
    # Create assets directory
    os.makedirs('assets', exist_ok=True)
    
    # Create different sizes
    sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
    
    for size in sizes:
        create_placeholder_icon(size, f'assets/icon-{size}.png')
    
    # Create main icon
    create_placeholder_icon(512, 'assets/icon.png')
    
    # Create placeholder ICNS and ICO files
    with open('assets/icon.icns', 'w') as f:
        f.write('')
    print("Created placeholder: assets/icon.icns")
    
    with open('assets/icon.ico', 'w') as f:
        f.write('')
    print("Created placeholder: assets/icon.ico")
    
    print("\n✅ Basic icons created!")
    if not PIL_AVAILABLE:
        print("⚠️  PIL not available - created placeholder files")
        print("📝 To create proper icons:")
        print("   1. Open assets/simple-icon.html in your browser")
        print("   2. Download the generated icons")
        print("   3. Use online converters for .icns and .ico files")

if __name__ == "__main__":
    main()
