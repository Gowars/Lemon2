build_prod:
	- rm -r bin/*
	echo "------------arm----------------"
	wails3 package
	bash dmg.sh lemon2

build_prod_universal:
	echo "------------universal----------------"
	- rm -r bin/*
	wails3 task darwin:package:universal
	bash dmg.sh lemon2-universal

dev:
	wails3 dev

icon:
	magick logo.png -channel RGB -fill "#231d21" -colorize 100% +channel -resize 64x64 -bordercolor none -border 10 frontend/public/lemon.systray.png
	magick logo.png -fill "#BBBBBB" -colorize 100% +channel -channel A -fx 'a > 0.0 ? 0.5 : 0.0' +channel -resize 64x64 -bordercolor none -border 10 frontend/public/lemon.off.systray.png
	magick logo.png -resize 452x452 -bordercolor none -border 30 build/appicon.png
	cp logo.png frontend/public/
