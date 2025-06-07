#!/usr/bin/env python3
"""
Upload macOS release assets to GitHub Release
"""

import os
import requests
import sys
from pathlib import Path

# Configuration
REPO_OWNER = "glitchlabs-eng"
REPO_NAME = "multichannel-audio-mixer"
RELEASE_TAG = "v1.0.0"
RELEASE_DIR = "release"

# Files to upload (only macOS files for now)
FILES_TO_UPLOAD = [
    "Professional-Audio-Mixer-1.0.0-mac.zip",
    "Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
]

def get_github_token():
    """Get GitHub token from environment or return None"""
    return os.environ.get('GITHUB_TOKEN')

def get_release_info(token):
    """Get release information"""
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/tags/{RELEASE_TAG}'
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Failed to get release info: {response.status_code}")
        print(response.text)
        return None

def upload_asset(token, release_id, file_path, file_name):
    """Upload a single asset to the release"""
    headers = {
        'Authorization': f'token {token}',
        'Content-Type': 'application/zip'
    }
    
    # Check if asset already exists and delete it
    release_info = get_release_info(token)
    if release_info and 'assets' in release_info:
        for asset in release_info['assets']:
            if asset['name'] == file_name:
                print(f"🗑️  Deleting existing asset: {file_name}")
                delete_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/assets/{asset['id']}"
                delete_response = requests.delete(delete_url, headers={'Authorization': f'token {token}'})
                if delete_response.status_code != 204:
                    print(f"⚠️  Warning: Could not delete existing asset: {delete_response.status_code}")
    
    # Upload new asset
    url = f'https://uploads.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/{release_id}/assets?name={file_name}'
    
    with open(file_path, 'rb') as f:
        response = requests.post(url, headers=headers, data=f)
    
    if response.status_code == 201:
        asset_info = response.json()
        print(f"✅ Successfully uploaded: {file_name}")
        print(f"   📥 Download URL: {asset_info['browser_download_url']}")
        return True
    else:
        print(f"❌ Failed to upload {file_name}: {response.status_code}")
        print(response.text)
        return False

def main():
    print("🚀 Uploading macOS Release Assets to GitHub")
    print("=" * 50)
    
    # Get GitHub token
    token = get_github_token()
    if not token:
        print("❌ GitHub token not found in environment variables")
        print("💡 This script needs a GITHUB_TOKEN environment variable")
        return False
    
    print("✅ GitHub token found")
    
    # Get release information
    print(f"📋 Getting release information for {RELEASE_TAG}...")
    release_info = get_release_info(token)
    if not release_info:
        return False
    
    release_id = release_info['id']
    print(f"✅ Found release: {release_info['name']} (ID: {release_id})")
    
    # Check if files exist
    print(f"📁 Checking files in {RELEASE_DIR}...")
    missing_files = []
    for file_name in FILES_TO_UPLOAD:
        file_path = Path(RELEASE_DIR) / file_name
        if file_path.exists():
            size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"✅ Found: {file_name} ({size_mb:.1f} MB)")
        else:
            print(f"❌ Missing: {file_name}")
            missing_files.append(file_name)
    
    if missing_files:
        print(f"❌ {len(missing_files)} files are missing. Please build the applications first.")
        return False
    
    # Upload files
    print(f"\n📤 Uploading {len(FILES_TO_UPLOAD)} files...")
    success_count = 0
    
    for file_name in FILES_TO_UPLOAD:
        file_path = Path(RELEASE_DIR) / file_name
        print(f"\n📤 Uploading {file_name}...")
        
        if upload_asset(token, release_id, file_path, file_name):
            success_count += 1
        else:
            print(f"❌ Failed to upload {file_name}")
    
    # Summary
    print(f"\n{'='*50}")
    if success_count == len(FILES_TO_UPLOAD):
        print("🎉 All files uploaded successfully!")
        print(f"\n🌐 Release URL: https://github.com/{REPO_OWNER}/{REPO_NAME}/releases/tag/{RELEASE_TAG}")
        print(f"\n📥 Download Links:")
        print(f"🍎 macOS (Intel):        https://github.com/{REPO_OWNER}/{REPO_NAME}/releases/download/{RELEASE_TAG}/Professional-Audio-Mixer-1.0.0-mac.zip")
        print(f"🍎 macOS (Apple Silicon): https://github.com/{REPO_OWNER}/{REPO_NAME}/releases/download/{RELEASE_TAG}/Professional-Audio-Mixer-1.0.0-arm64-mac.zip")
        print(f"\n✨ Your macOS apps are now available for download!")
        return True
    else:
        print(f"❌ Only {success_count}/{len(FILES_TO_UPLOAD)} files uploaded successfully")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
