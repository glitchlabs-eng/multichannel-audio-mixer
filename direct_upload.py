#!/usr/bin/env python3
import subprocess
import json
import os
import sys

def upload_to_github():
    print("🚀 UPLOADING PROFESSIONAL AUDIO MIXER TO GITHUB")
    print("=" * 50)
    
    # Check if gh CLI is available and authenticated
    try:
        result = subprocess.run(['gh', 'auth', 'status'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ GitHub CLI not authenticated")
            print("🔧 Please run: gh auth login")
            return False
    except FileNotFoundError:
        print("❌ GitHub CLI not found")
        print("🔧 Please install: brew install gh")
        return False
    
    print("✅ GitHub CLI authenticated")
    
    # Files to upload
    files = [
        "release/Professional-Audio-Mixer-1.0.0-x64-mac.zip",
        "release/Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
    ]
    
    # Check files exist
    for filepath in files:
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return False
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"✅ Found: {os.path.basename(filepath)} ({size_mb:.1f} MB)")
    
    # Upload files
    print("\n📤 Uploading files to GitHub release...")
    success_count = 0
    
    for filepath in files:
        filename = os.path.basename(filepath)
        print(f"\n📤 Uploading {filename}...")
        
        try:
            result = subprocess.run([
                'gh', 'release', 'upload', 'v1.0.0', filepath, '--clobber'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Successfully uploaded: {filename}")
                success_count += 1
            else:
                print(f"❌ Failed to upload {filename}: {result.stderr}")
        except Exception as e:
            print(f"❌ Error uploading {filename}: {str(e)}")
    
    # Summary
    print(f"\n{'=' * 50}")
    if success_count == len(files):
        print("🎉 ALL FILES UPLOADED SUCCESSFULLY!")
        print("\n🌐 Your release is now live at:")
        print("https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/tag/v1.0.0")
        print("\n📥 Download links:")
        print("🍎 Intel Mac: https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-1.0.0-x64-mac.zip")
        print("🍎 Apple Silicon: https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-1.0.0-arm64-mac.zip")
        print("\n🎵 YOUR PROFESSIONAL AUDIO MIXER IS NOW LIVE!")
        return True
    else:
        print(f"❌ Only {success_count}/{len(files)} files uploaded")
        return False

if __name__ == "__main__":
    success = upload_to_github()
    sys.exit(0 if success else 1)
