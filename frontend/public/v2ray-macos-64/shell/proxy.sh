#!/bin/bash

################################################################################
# macOS 上调用 scutil --proxy 查看网络代理；调用 networksetup 设置系统全局代理
# Usage：
#   1. 在命令行 source 导入该脚本，调用相关函数查看、设置、启用、禁用代理
#   2. 请按需自行修改网络服务名（networkservice）、domain 和 port
################################################################################

networkservice='Wi-Fi'

# 查看代理状态
show_proxy() {
    echo '----------------------------------------'
    echo 'scutil --proxy:'
    scutil --proxy
    echo '----------------------------------------'
    echo '1. http proxy:'
    networksetup -getwebproxy $networkservice
    echo '----------------------------------------'
    echo '2. https proxy:'
    networksetup -getsecurewebproxy $networkservice
    echo '----------------------------------------'
    echo '3. socks proxy:'
    networksetup -getsocksfirewallproxy $networkservice
    # cat /Library/Preferences/SystemConfiguration/preferences.plist
}

# 设置系统代理，默认自动启动
# 或只在命令行设定代理：export http_proxy=http://127.0.0.1:1087 https_proxy=http://127.0.0.1:1087 all_proxy=socks5://127.0.0.1:7890
set_proxy() {
    # for Clash
    sudo networksetup -setwebproxy $networkservice 127.0.0.1 1087
    sudo networksetup -setsecurewebproxy $networkservice 127.0.0.1 1087
    sudo networksetup -setsocksfirewallproxy $networkservice 127.0.0.1 7890
    scutil --proxy
}

# 启动代理
enable_proxy() {
    sudo networksetup -setwebproxystate $networkservice on
    sudo networksetup -setsecurewebproxystate $networkservice on
    sudo networksetup -setsocksfirewallproxystate $networkservice on
    scutil --proxy
}

# 停止代理
disable_proxy() {
    sudo networksetup -setwebproxystate $networkservice off
    sudo networksetup -setsecurewebproxystate $networkservice off
    sudo networksetup -setsocksfirewallproxystate $networkservice off
    scutil --proxy
}
