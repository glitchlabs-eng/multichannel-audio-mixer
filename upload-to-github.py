#!/usr/bin/env python3
"""
Upload release assets to GitHub using the GitHub API
"""

import os
import sys
import requests
import json
from pathlib import Path

# Configuration
REPO_OWNER = "glitchlabs-eng"
REPO_NAME = "multichannel-audio-mixer"
RELEASE_TAG = "v1.0.0"
RELEASE_DIR = "release"

# Files to upload
FILES = [
    "Professional-Audio-Mixer-1.0.0-mac.zip",
    "Professional-Audio-Mixer-1.0.0-arm64-mac.zip",
    "Professional-Audio-Mixer-1.0.0.AppImage"
]

def get_github_token():
    """Get GitHub token from environment or user input"""
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("❌ GitHub token not found in environment")
        print("🔑 Please set GITHUB_TOKEN environment variable")
        print("   or get a token from: https://github.com/settings/tokens")
        print("   Required scopes: repo")
        return None
    return token

def get_release_info(token):
    """Get release information from GitHub API"""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/tags/{RELEASE_TAG}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Failed to get release info: {response.status_code}")
        return None

def upload_asset(token, upload_url, file_path, filename):
    """Upload a single asset to the release"""
    # Remove the {?name,label} template from upload_url
    upload_url = upload_url.split('{')[0]
    
    # Determine content type
    if filename.endswith('.zip'):
        content_type = 'application/zip'
    elif filename.endswith('.AppImage'):
        content_type = 'application/octet-stream'
    else:
        content_type = 'application/octet-stream'
    
    headers = {
        "Authorization": f"token {token}",
        "Content-Type": content_type
    }
    
    params = {"name": filename}
    
    print(f"📤 Uploading {filename}...")
    
    try:
        with open(file_path, 'rb') as f:
            response = requests.post(
                upload_url,
                headers=headers,
                params=params,
                data=f
            )
        
        if response.status_code == 201:
            print(f"✅ Successfully uploaded {filename}")
            return True
        else:
            print(f"❌ Failed to upload {filename}: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error uploading {filename}: {e}")
        return False

def main():
    print("🚀 Professional Audio Mixer - GitHub Release Upload")
    print("===================================================")
    
    # Check if we're in the right directory
    if not os.path.exists("package.json"):
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    # Check if release directory exists
    if not os.path.exists(RELEASE_DIR):
        print(f"❌ Release directory not found: {RELEASE_DIR}")
        print("🔧 Please build the applications first:")
        print("   npm run dist:mac")
        print("   npm run dist:linux")
        sys.exit(1)
    
    # Check if all files exist
    print("📁 Checking release files...")
    for filename in FILES:
        file_path = os.path.join(RELEASE_DIR, filename)
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            sys.exit(1)
        else:
            size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            print(f"✅ Found: {filename} ({size:.1f} MB)")
    
    # Get GitHub token
    token = get_github_token()
    if not token:
        sys.exit(1)
    
    # Get release information
    print("🔍 Getting release information...")
    release_info = get_release_info(token)
    if not release_info:
        sys.exit(1)
    
    upload_url = release_info.get('upload_url')
    if not upload_url:
        print("❌ Upload URL not found in release info")
        sys.exit(1)
    
    print(f"✅ Found release: {release_info['name']}")
    
    # Upload files
    print("\n📤 Uploading assets...")
    success_count = 0
    
    for filename in FILES:
        file_path = os.path.join(RELEASE_DIR, filename)
        if upload_asset(token, upload_url, file_path, filename):
            success_count += 1
    
    print(f"\n📊 Upload Results: {success_count}/{len(FILES)} files uploaded successfully")
    
    if success_count == len(FILES):
        print("🎉 All files uploaded successfully!")
        print(f"\n🌐 Release URL: https://github.com/{REPO_OWNER}/{REPO_NAME}/releases/tag/{RELEASE_TAG}")
        print("\n📥 Download Links:")
        print(f"🍎 macOS (Intel):        https://github.com/{REPO_OWNER}/{REPO_NAME}/releases/download/{RELEASE_TAG}/Professional-Audio-Mixer-1.0.0-mac.zip")
        print(f"🍎 macOS (Apple Silicon): https://github.com/{REPO_OWNER}/{REPO_NAME}/releases/download/{RELEASE_TAG}/Professional-Audio-Mixer-1.0.0-arm64-mac.zip")
        print(f"🐧 Linux:                https://github.com/{REPO_OWNER}/{REPO_NAME}/releases/download/{RELEASE_TAG}/Professional-Audio-Mixer-1.0.0.AppImage")
        print("\n✨ Professional Audio Mixer v1.0.0 is now available for download!")
    else:
        print("❌ Some files failed to upload")
        print("🔧 Please check the errors above and try again")
        sys.exit(1)

if __name__ == "__main__":
    main()
