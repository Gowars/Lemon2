cd ../v2ray-core
rm *.zip
bash release/user-package.sh nosource darwin arm64 nodat
rm -rf vvv/*
unzip v2ray-custom-arm64-*.zip -d vvv
cp vvv/v2ray ../lemon2/frontend/public/v2ray-macos-64
rm -rf vvv/*
