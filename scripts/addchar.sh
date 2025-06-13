magick logo.png -channel RGB -fill "#231d21" -colorize 100% +channel -resize 64x64 -bordercolor none -border 10 frontend/public/lemon.systray.png
magick logo.png -fill "#BBBBBB" -colorize 100% +channel -channel A -fx 'a > 0.0 ? 0.5 : 0.0' +channel -resize 64x64 -bordercolor none -border 10 frontend/public/lemon.off.systray.png
magick logo.png -resize 452x452 -bordercolor none -border 30 build/appicon.png
cp logo.png frontend/public/

arr=("G" "P" "D")
for item in "${arr[@]}"; do
    magick frontend/public/lemon.systray.png \
    \( -size 64x64 -gravity center -background none -fill white -font Arial -stroke white -strokewidth 2 -pointsize 36 label:"$item" \) \
    -gravity SouthWest -alpha on -compose DstOut -composite \
    frontend/public/lemon.systray.$item.png
done
