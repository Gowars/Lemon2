#!/bin/bash

# 脚本名称：create-dmg.sh
# 功能：将 Wails 3 构建的 .app 文件打包为 DMG 文件
# 使用方法：./create-dmg.sh
# 前提：安装 create-dmg 和 graphicsmagick (brew install create-dmg graphicsmagick)
# 依赖：hdiutil, osascript (macOS 内置)

# 配置变量
APP_NAME="lemon2"                          # 应用名称（与 .app 文件名一致）
APP_PATH="bin/${APP_NAME}.app"      # .app 文件路径
DMG_NAME="bin/$1.dmg"                # 输出 DMG 文件名
DMG_VOLUME_NAME="${APP_NAME} Installer"   # DMG 卷名称
BACKGROUND_IMAGE="background.png"         # 背景图片（可选，640x480，72 DPI）
TEMP_DIR="/tmp/dmg-${APP_NAME}"           # 临时目录
DMG_SIZE="100"                            # DMG 大小（MB，需大于 .app 大小）

rm -r frontend/dist
rm -r bin/*.dmg
mkdir ./release

codesign --force --deep --sign "Apple Development: wang king" $APP_PATH

# 检查依赖
command -v create-dmg >/dev/null 2>&1 || { echo "Error: create-dmg not installed. Run 'brew install create-dmg'."; exit 1; }
# command -v gm >/dev/null 2>&1 || { echo "Error: GraphicsMagick not installed. Run"; exit 1; }
# 检查 .app 文件是否存在
if [ ! -d "$APP_PATH" ]; then
    echo "Error: $APP_PATH not found. Please build your Wails app first."
    exit 1
fi

# 检查背景图片（可选）
if [ ! -f "$BACKGROUND_IMAGE" ]; then
    echo "Warning: $BACKGROUND_IMAGE not found. Proceeding without background."
    BACKGROUND_IMAGE=""
fi

# 创建临时目录
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制 .app 到临时目录
cp -r "$APP_PATH" "$TEMP_DIR/"

# 创建 Applications 链接
unlink "$TEMP_DIR/Applications"

# 复制背景图片（如果存在）
if [ -n "$BACKGROUND_IMAGE" ]; then
    mkdir -p "$TEMP_DIR/.background"
    cp "$BACKGROUND_IMAGE" "$TEMP_DIR/.background/background.png"
fi

# 创建 DMG 文件
create-dmg \
    --volname "$DMG_VOLUME_NAME" \
    --volicon "$APP_PATH/Contents/Resources/icons.icns" \
    --background "${TEMP_DIR}/.background/background.png" \
    --window-pos 200 120 \
    --window-size 600 400 \
    --icon-size 100 \
    --icon "$APP_NAME.app" 175 120 \
    --app-drop-link 425 120 \
    --hide-extension "$APP_NAME.app" \
    "$DMG_NAME" \
    "$TEMP_DIR/"

# 检查 DMG 创建是否成功
if [ $? -eq 0 ]; then
    echo "DMG created successfully: $DMG_NAME"
else
    echo "Error: Failed to create DMG."
    exit 1
fi

# 清理临时目录
rm -rf "$TEMP_DIR"
cp $DMG_NAME ./release

echo "Done."

# xcrun notarytool submit $DMG_NAME --keychain-profile "notary-profile" --wait
# xcrun stapler staple $APP_PATH
# xcrun stapler staple $DMG_NAME
