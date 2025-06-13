if [ -n "$1" ]; then
    echo "开启代理$1"
    networksetup -setautoproxyurl "Wi-Fi" $1
else
    echo "关闭代理"
    networksetup -setautoproxystate "Wi-Fi" off
    networksetup -setautoproxyurl "Wi-Fi" "(null)"
fi
