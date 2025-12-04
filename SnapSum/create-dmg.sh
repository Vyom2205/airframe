#!/bin/bash

# SnapSum DMG Creation Script
# This script builds SnapSum and creates a distributable DMG file

set -e

echo "🚀 Building SnapSum..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="SnapSum"
DMG_NAME="${APP_NAME}.dmg"
BUILD_DIR="${PROJECT_DIR}/build"
APP_PATH="${BUILD_DIR}/${APP_NAME}.app"

echo "${BLUE}📦 Step 1: Preparing build environment...${NC}"

# Ensure UI source is in correct location
if [ -d "${PROJECT_DIR}/Sources/SnapSumUI" ] && [ ! -d "${PROJECT_DIR}/Sources/SnapSum" ]; then
    echo "Moving UI sources to correct location..."
    mv "${PROJECT_DIR}/Sources/SnapSumUI" "${PROJECT_DIR}/Sources/SnapSum"
fi

# Update Package.swift if needed
if ! grep -q 'name: "SnapSum"' "${PROJECT_DIR}/Package.swift"; then
    echo "Updating Package.swift..."
    # Package.swift should already be updated, but check anyway
fi

echo "${BLUE}📦 Step 2: Building SnapSum in Release mode...${NC}"

# Create build directory
mkdir -p "${BUILD_DIR}"

# Build with Xcode
xcodebuild clean build \
    -scheme SnapSum \
    -configuration Release \
    -derivedDataPath "${BUILD_DIR}/DerivedData" \
    CONFIGURATION_BUILD_DIR="${BUILD_DIR}" \
    | grep -E '(error|warning|Compiling|Linking|Generating)' || true

if [ ! -d "${APP_PATH}" ]; then
    echo "${RED}❌ Error: App bundle not found at ${APP_PATH}${NC}"
    echo "You may need to build the app manually in Xcode first."
    echo ""
    echo "Steps:"
    echo "1. Open Package.swift in Xcode"
    echo "2. Build the SnapSum scheme (⌘B)"
    echo "3. Run this script again"
    exit 1
fi

echo "${GREEN}✅ Build complete!${NC}"

echo "${BLUE}📦 Step 3: Creating DMG...${NC}"

# Create temporary DMG directory
DMG_TEMP_DIR="${BUILD_DIR}/dmg_temp"
rm -rf "${DMG_TEMP_DIR}"
mkdir -p "${DMG_TEMP_DIR}"

# Copy app to temporary directory
cp -R "${APP_PATH}" "${DMG_TEMP_DIR}/"

# Create Applications symlink for easy installation
ln -s /Applications "${DMG_TEMP_DIR}/Applications"

# Create DMG
echo "Creating disk image..."
rm -f "${PROJECT_DIR}/${DMG_NAME}"

hdiutil create -volname "${APP_NAME}" \
    -srcfolder "${DMG_TEMP_DIR}" \
    -ov -format UDZO \
    "${PROJECT_DIR}/${DMG_NAME}"

# Clean up
rm -rf "${DMG_TEMP_DIR}"

echo "${GREEN}✅ DMG created successfully!${NC}"
echo ""
echo "📦 ${DMG_NAME} is ready for distribution"
echo "📍 Location: ${PROJECT_DIR}/${DMG_NAME}"
echo ""
echo "To install:"
echo "1. Open ${DMG_NAME}"
echo "2. Drag ${APP_NAME} to Applications folder"
echo "3. Launch from Applications"
