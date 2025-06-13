/**
 * 这种方法通过尝试打开应用的URI Scheme来检测应用是否安装。如果应用已安装,页面会失去焦点;如果未安装,则不会发生任何事。
  openAndroid('yourapp://').then(installed => {
    if (installed) {
      console.log('App已安装');
    } else {
      console.log('App未安装');
    }
  });
 * @param {string} scheme
 * @returns
 */
export function openAndroid(scheme) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const timeoutId = setTimeout(() => {
            document.body.removeChild(iframe);
            resolve(false);
        }, 2000);

        window.addEventListener(
            'blur',
            () => {
                clearTimeout(timeoutId);
                document.body.removeChild(iframe);
                resolve(true);
            },
            {
                once: true,
            }
        );

        iframe.src = scheme;
    });
}

/**
 * 这种方法会尝试打开应用。如果应用未安装,用户会被引导到Google Play商店。
 * 优点: 可以直接引导用户安装应用 比URI Scheme更可靠
 * @param {*} packageName
 */
export function checkAndroidApp(packageName) {
    const intent = `intent://scan/#Intent;scheme=https;package=${packageName};end`;
    window.location.replace(intent);
}

export function openIOSApp() {
    // App安装了，使用universal link会直接唤起App
    // 如果没有安装，则会跳转到对应的域名上，这个域名对应的网页应当是一个引导下载App的落地页
    // ios环境直接尝试跳转到对应的App Store上产品地址
    // 安卓则跳转相对应的各个手机厂商的商城地址（是否保留apk下载通道？）
}
