# 判断是否是在App内

## 使用ua进行判读

## 通过全局变量进行判断

## 通过调用jsBridge方法进行判断


对于ios浏览器/wkwebview内的`window.webkit.messageHandlers`
> The window.webkit namespace only appears in webview with script message handlers. Make sure that you have called addScriptMessageHandler method of WKUserContentController.
那么在任意一个App内，如果向webview注入过MessageHandler，那么`window.webkit.messageHandlers`就会存在，所以不能使用这个属性来判断是否是App环境

