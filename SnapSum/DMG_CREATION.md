# Creating a DMG for SnapSum

This guide explains how to create a distributable DMG (disk image) file for SnapSum.

## Quick Method (Recommended)

Use the provided script:

```bash
./create-dmg.sh
```

This script will:
1. Build SnapSum in Release configuration
2. Package it into a DMG file
3. Create an Applications symlink for easy installation

## Manual Method

If you prefer to create the DMG manually:

### Prerequisites

- macOS development environment
- Xcode 15.0 or later
- Command Line Tools installed

### Step 1: Build the App

1. Open the project in Xcode:
```bash
open Package.swift
```

2. Select the SnapSum scheme from the scheme selector

3. Choose **Product > Build For > Running** (or press ⌘B)

4. Archive the app: **Product > Archive**

5. Export the app from the Organizer:
   - Click **Distribute App**
   - Choose **Copy App**
   - Save to a location (e.g., `~/Desktop/SnapSum.app`)

### Step 2: Create DMG Structure

```bash
# Create a temporary directory
mkdir -p ~/Desktop/SnapSum-dmg

# Copy the app
cp -R ~/Desktop/SnapSum.app ~/Desktop/SnapSum-dmg/

# Create Applications symlink
ln -s /Applications ~/Desktop/SnapSum-dmg/Applications
```

### Step 3: Create the DMG

```bash
# Create the DMG
hdiutil create -volname "SnapSum" \
  -srcfolder ~/Desktop/SnapSum-dmg \
  -ov -format UDZO \
  ~/Desktop/SnapSum.dmg
```

### Step 4: Customize (Optional)

For a more polished DMG with custom background and icons:

1. Create a writable DMG first:
```bash
hdiutil create -volname "SnapSum" \
  -srcfolder ~/Desktop/SnapSum-dmg \
  -ov -format UDRW \
  ~/Desktop/SnapSum-temp.dmg
```

2. Mount it:
```bash
hdiutil attach ~/Desktop/SnapSum-temp.dmg
```

3. Customize the appearance:
   - Open the mounted DMG in Finder
   - View > Show View Options
   - Set icon size, background, etc.
   - Position the app icon and Applications symlink

4. Unmount and convert to compressed format:
```bash
hdiutil detach /Volumes/SnapSum
hdiutil convert ~/Desktop/SnapSum-temp.dmg \
  -format UDZO \
  -o ~/Desktop/SnapSum.dmg
rm ~/Desktop/SnapSum-temp.dmg
```

## Advanced: Notarization

For distribution outside the Mac App Store, you should notarize your app:

### Requirements

- Apple Developer account
- Developer ID Application certificate

### Steps

1. Sign the app:
```bash
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  ~/Desktop/SnapSum.app
```

2. Create and sign the DMG:
```bash
hdiutil create -volname "SnapSum" \
  -srcfolder ~/Desktop/SnapSum-dmg \
  -ov -format UDZO \
  ~/Desktop/SnapSum.dmg

codesign --sign "Developer ID Application: Your Name (TEAM_ID)" \
  ~/Desktop/SnapSum.dmg
```

3. Notarize:
```bash
xcrun notarytool submit ~/Desktop/SnapSum.dmg \
  --apple-id "your-email@example.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait
```

4. Staple the notarization:
```bash
xcrun stapler staple ~/Desktop/SnapSum.dmg
```

## Distribution

Once you have the DMG:

1. Test installation on a clean macOS system
2. Upload to GitHub Releases
3. Share the download link

Users can then:
1. Download `SnapSum.dmg`
2. Open the DMG
3. Drag SnapSum to Applications
4. Launch from Applications

## Troubleshooting

### "SnapSum.app is damaged and can't be opened"

This usually happens when the app isn't properly signed. Users can work around this by:

```bash
xattr -cr /Applications/SnapSum.app
```

However, proper code signing is recommended for distribution.

### DMG creation fails

Ensure you have enough disk space and proper permissions. Try cleaning the build folder:

```bash
rm -rf build/
xcodebuild clean
```

## Automated Building with GitHub Actions

For automated builds, see `.github/workflows/build-dmg.yml` (if available).

## References

- [Apple Developer Documentation - Distributing Apps](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
