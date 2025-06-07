#!/usr/bin/env python3
"""
Complete upload of macOS release assets to GitHub
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_github_api(path, method="GET", data=None, summary=""):
    """Run GitHub API call using the available github-api tool"""
    try:
        # Prepare the command
        cmd = ["python3", "-c", f"""
import json
import sys
sys.path.append('/opt/augment')
from tools.github_api import github_api_tool

# Call the GitHub API tool
result = github_api_tool({{
    'path': '{path}',
    'method': '{method}',
    'data': {json.dumps(data) if data else 'None'},
    'summary': '{summary}'
}})

print(json.dumps(result))
"""]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd="/mnt/persist/workspace")
        
        if result.returncode == 0:
            try:
                return json.loads(result.stdout.strip())
            except json.JSONDecodeError:
                return {"success": False, "error": "Invalid JSON response", "output": result.stdout}
        else:
            return {"success": False, "error": result.stderr, "output": result.stdout}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def upload_file_to_release(release_id, file_path, file_name):
    """Upload a file to GitHub release using curl"""
    try:
        # Get upload URL from release info
        release_info = run_github_api(f"/repos/glitchlabs-eng/multichannel-audio-mixer/releases/{release_id}")
        
        if not release_info or "upload_url" not in release_info:
            print(f"❌ Could not get upload URL for release {release_id}")
            return False
        
        upload_url = release_info["upload_url"].replace("{?name,label}", f"?name={file_name}")
        
        print(f"📤 Uploading {file_name}...")
        print(f"   File size: {os.path.getsize(file_path) / (1024*1024):.1f} MB")
        
        # Use curl to upload the file
        curl_cmd = [
            "curl",
            "-X", "POST",
            "-H", "Accept: application/vnd.github.v3+json",
            "-H", "Content-Type: application/zip",
            "--data-binary", f"@{file_path}",
            upload_url
        ]
        
        # Try to get GitHub token from environment
        github_token = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
        if github_token:
            curl_cmd.insert(4, f"Authorization: token {github_token}")
            curl_cmd.insert(4, "-H")
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            try:
                response = json.loads(result.stdout)
                if "browser_download_url" in response:
                    print(f"✅ Successfully uploaded: {file_name}")
                    print(f"   📥 Download URL: {response['browser_download_url']}")
                    return True
                else:
                    print(f"❌ Upload failed: {result.stdout}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid response: {result.stdout}")
                return False
        else:
            print(f"❌ Upload failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error uploading {file_name}: {str(e)}")
        return False

def main():
    print("🚀 Completing macOS Release Upload")
    print("=" * 50)
    
    # Configuration
    release_id = "223797539"  # Your existing release ID
    release_dir = Path("release")
    
    files_to_upload = [
        "Professional-Audio-Mixer-1.0.0-mac.zip",
        "Professional-Audio-Mixer-1.0.0-arm64-mac.zip"
    ]
    
    # Check if files exist
    print("📁 Checking release files...")
    missing_files = []
    for file_name in files_to_upload:
        file_path = release_dir / file_name
        if file_path.exists():
            size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"✅ Found: {file_name} ({size_mb:.1f} MB)")
        else:
            print(f"❌ Missing: {file_name}")
            missing_files.append(file_name)
    
    if missing_files:
        print(f"❌ {len(missing_files)} files are missing!")
        return False
    
    # Check release exists
    print(f"\n📋 Checking release {release_id}...")
    release_info = run_github_api(f"/repos/glitchlabs-eng/multichannel-audio-mixer/releases/{release_id}")
    
    if not release_info or "name" not in release_info:
        print("❌ Could not access release information")
        return False
    
    print(f"✅ Found release: {release_info['name']}")
    
    # Upload files
    print(f"\n📤 Uploading {len(files_to_upload)} files...")
    success_count = 0
    
    for file_name in files_to_upload:
        file_path = release_dir / file_name
        if upload_file_to_release(release_id, str(file_path), file_name):
            success_count += 1
        print()  # Add spacing between uploads
    
    # Summary
    print("=" * 50)
    if success_count == len(files_to_upload):
        print("🎉 All files uploaded successfully!")
        print(f"\n🌐 Your release is now live at:")
        print(f"https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/tag/v1.0.0")
        print(f"\n📥 Direct download links:")
        print(f"🍎 macOS (Intel):        https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-1.0.0-mac.zip")
        print(f"🍎 macOS (Apple Silicon): https://github.com/glitchlabs-eng/multichannel-audio-mixer/releases/download/v1.0.0/Professional-Audio-Mixer-1.0.0-arm64-mac.zip")
        print(f"\n✨ Your Professional Audio Mixer is now available for download!")
        return True
    else:
        print(f"❌ Only {success_count}/{len(files_to_upload)} files uploaded successfully")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
