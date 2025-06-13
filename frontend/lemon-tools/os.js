function toVersion(arr) {
    const ver = (arr || [])[1] || '';
    const versions = [];
    if (ver) {
        ver.split(/[_.]/g).forEach((i, index, arr) => {
            versions.push(arr.slice(0, index + 1).join('_'));
        });
    }
    return versions;
}

function getOS() {
    const UA = window.navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // https://developer.mozilla.org/en-US/docs/Web/API/NavigatorID/platform
    // 对于iphone来说为 iphone ipad为ipad
    // mac为macintel
    // win为Win32
    // 因此可以通过platform区分是浏览器的移动模式，还是真机
    // 还可以支持系统版本

    const phone = Boolean(UA.match(/phone|ios|android|ipad|ipod/i));
    const os = {
        /** 是否是移动触摸设备 */
        phone,
        /** 是否是pc(非移动触摸)设备 */
        pc: !phone || !!UA.match(/Electron/i),
        /** 是不是iphone设备 */
        iphone: Boolean(UA.match(/iphone/i)),
        /** 是不是ipad设备 */
        ipad: Boolean(UA.match(/ipad/i)),
        /** 是不是ios系统 */
        ios: Boolean(UA.match(/ios|iphone|ipad/i)),
        /** 是不是safari系统 */
        safari: Boolean(UA.match(/safari/i)),
        /** 是不是android系统 */
        android: Boolean(UA.match(/android/i)),
        /** 是不是微信环境 */
        wechat: Boolean(UA.match(/micromessenger/i)),
        /** 是不是webkit内核 */
        webkit: Boolean(UA.match(/webkit/i)),
        /** 是不是pc模拟的h5环境 */
        isPCSimulator: phone && platform.match(/mac|win/i),
        pwa: (() => {
            const mqStandAlone = '(display-mode: standalone)';
            if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
                return true;
            }
            return false;
        })(),
        /** window系统 */
        windows: Boolean(platform.match(/win/i)),
        /** 是不是mac系统 */
        mac: Boolean(platform.match(/mac/i)),
        inApp: Boolean(UA.match(/id\//i)) || !!window.webkit?.messageHandlers?.nativeLog,
        /** 是不是全屏webview */
        appFullView: Boolean(UA.match(/bestBrowser|videoCat/i) || location.search.includes('fullScreen')), // 全屏渲染
        /** 是不是视网膜屏幕，一般用来设置border 0.5px */
        retina: window.devicePixelRatio > 1,
        iosVersion: '0.0.0',
        androidVersion: '0.0.0',
        chromeVersion: '',
    };

    /**
     * iphone系统版本
     * Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1
     */
    toVersion(UA.match(/iPhone os (\d+([_.]\d+)*)/i)).forEach((ver) => {
        os['iosVer' + ver] = true;
        os.iosVersion = ver.replace(/_/g, '.');
    });
    /**
     * android系统版本
     * Mozilla/5.0 (Linux; Android 6.0.1; OPPO R9s Build/MMB29M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3224 MMWEBSDK/20220402 Mobile Safari/537.36 MMWEBID/5926 MicroMessenger/8.0.22.2140(0x28001654) WeChat/arm32 Weixin NetType/WIFI Language/zh_CN ABI/arm64
     * Mozilla/5.0 (Linux; Android 10; V1965A Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.106 Mobile Safari/537.36 secretKey/secretKey NetType/NETWORK_WIFI Language/zh_CN WptMessenger/5.1.3 Channel/baiduxxl_29210759_143738540_5399754712_219619967153 wptAid/baiduxxl_29210759_143738540_5399754712_219619967153 DeviceIdType/oaid os/android oVersion/10 cVersion/5.1.3 ua/V1965A PhoneModel/V1965A brand/vivo identity/bcbae76ff0acf3cdef853ae57ccdf81e Ar/1 wifiName/TUVSQ1VSWV9DMzU4 model/V1965A dno/YmNhMjQxNjU1YWViOTcyMDYyMTczNzQ5Y2YwMzJhNWY0ZGNiMGZhNjRjNjQyNWMzMTFiMDg0ZGRkZjUzMTBkOQ== plook/newUi wptfullscreen/true statusBarHeight/99 instance/3 wptbigsize/false
     */
    toVersion(UA.match(/\(Linux; Android (\d+([_.]\d+)*);/i)).forEach((ver) => {
        os['androidVer' + ver] = true;
        os.androidVersion = ver.replace(/_/g, '.');
    });

    toVersion(UA.match(/Chrome\/(\d+([_.]\d+)*)/i)).forEach((ver) => {
        os['chromeVer' + ver] = true;
        os.chromeVersion = ver.replace(/_/g, '.');
    });

    /**
     * 微信版本
     * UA: Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.22(0x18001623) NetType/WIFI Language/zh_CN
     */
    toVersion(UA.match(/MicroMessenger\/(\d+([_.]\d+)*);/i)).forEach((ver) => {
        os['wechatVer' + ver] = true;
    });

    return os;
}

const os = getOS();

export default os;

export { getOS, os };

export function setDeviceClass() {
    const os = getOS();
    Object.keys(os).forEach((k) => {
        document.querySelector('html').classList.toggle(`device-${k}`, os[k]);
    });
}
