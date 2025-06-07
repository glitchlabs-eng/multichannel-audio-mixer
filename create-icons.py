#!/usr/bin/env python3
"""
Create professional audio mixer icons for different platforms
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size=512):
    """Create a professional audio mixer icon"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    bg_color = (26, 26, 26, 255)  # Dark background
    primary_color = (76, 175, 80, 255)  # Green
    secondary_color = (51, 51, 51, 255)  # Dark gray
    white = (255, 255, 255, 255)
    
    # Background circle
    margin = size // 16
    draw.ellipse([margin, margin, size-margin, size-margin], fill=bg_color)
    
    # Outer ring
    ring_width = size // 32
    draw.ellipse([margin*2, margin*2, size-margin*2, size-margin*2], 
                outline=primary_color, width=ring_width)
    
    # Inner circle
    inner_margin = margin * 3
    draw.ellipse([inner_margin, inner_margin, size-inner_margin, size-inner_margin], 
                fill=secondary_color)
    
    # Mixer faders (5 vertical faders)
    fader_count = 5
    fader_width = size // 64
    fader_height = size // 4
    fader_spacing = size // 8
    start_x = size // 2 - (fader_count * fader_spacing) // 2
    fader_y = size // 2 - fader_height // 2
    
    for i in range(fader_count):
        x = start_x + i * fader_spacing
        
        # Fader track
        draw.rectangle([x - fader_width//2, fader_y, 
                       x + fader_width//2, fader_y + fader_height], 
                      fill=(85, 85, 85, 255))
        
        # Fader handle (at different positions)
        handle_height = size // 32
        handle_y = fader_y + (i * fader_height // fader_count)
        draw.rectangle([x - fader_width*2, handle_y, 
                       x + fader_width*2, handle_y + handle_height], 
                      fill=primary_color)
        
        # Knob above fader
        knob_y = fader_y - size // 16
        knob_radius = size // 32
        draw.ellipse([x - knob_radius, knob_y - knob_radius,
                     x + knob_radius, knob_y + knob_radius], 
                    outline=primary_color, width=size//128)
        
        # Knob indicator
        draw.line([x, knob_y, x + knob_radius//2, knob_y - knob_radius//2], 
                 fill=white, width=size//256)
    
    # Sound waves at top
    wave_center_x = size // 2
    wave_y = size // 4
    for i in range(3):
        radius = size // 16 + i * size // 32
        draw.arc([wave_center_x - radius, wave_y - radius//2,
                 wave_center_x + radius, wave_y + radius//2], 
                0, 180, fill=primary_color, width=size//128)
    
    # Sound waves at bottom
    wave_y = size * 3 // 4
    for i in range(3):
        radius = size // 16 + i * size // 32
        draw.arc([wave_center_x - radius, wave_y - radius//2,
                 wave_center_x + radius, wave_y + radius//2], 
                180, 360, fill=primary_color, width=size//128)
    
    # Center musical note
    note_x = size // 2
    note_y = size // 2
    note_radius = size // 20
    
    # Note head
    draw.ellipse([note_x - note_radius, note_y - note_radius,
                 note_x + note_radius, note_y + note_radius], 
                fill=primary_color)
    
    # Note stem
    stem_width = size // 128
    stem_height = size // 8
    draw.rectangle([note_x + note_radius//2, note_y - stem_height,
                   note_x + note_radius//2 + stem_width, note_y], 
                  fill=white)
    
    # Note flag
    flag_points = [
        (note_x + note_radius//2 + stem_width, note_y - stem_height),
        (note_x + note_radius, note_y - stem_height + size//32),
        (note_x + note_radius//2 + stem_width, note_y - stem_height + size//16)
    ]
    draw.polygon(flag_points, fill=white)
    
    return img

def main():
    """Create icons for different platforms"""
    # Create assets directory
    os.makedirs('assets', exist_ok=True)
    
    # Create base icon
    base_icon = create_icon(512)
    
    # Save PNG version
    base_icon.save('assets/icon.png', 'PNG')
    print("Created: assets/icon.png")
    
    # Create different sizes for different platforms
    sizes = {
        'icon-16.png': 16,
        'icon-32.png': 32,
        'icon-48.png': 48,
        'icon-64.png': 64,
        'icon-128.png': 128,
        'icon-256.png': 256,
        'icon-512.png': 512,
        'icon-1024.png': 1024
    }
    
    for filename, size in sizes.items():
        if size <= 512:
            resized = base_icon.resize((size, size), Image.Resampling.LANCZOS)
        else:
            resized = create_icon(size)
        resized.save(f'assets/{filename}', 'PNG')
        print(f"Created: assets/{filename}")
    
    print("\nIcon files created successfully!")
    print("Note: For .icns and .ico files, you'll need to use online converters or specialized tools.")

if __name__ == "__main__":
    main()
