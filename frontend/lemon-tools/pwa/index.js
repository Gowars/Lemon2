// 检测pwa是否已经被安装
// 触发安装pwa
// 监听安装事件
// 安装后提示打开PWA

// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Display_badge_on_app_icon
// https://stackoverflow.com/questions/70925950/how-to-open-pwa-from-a-button-within-the-web-app

// Trigger installation from your PWA
// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt
export const PWAInstallerStatus = {
    init: 'init',
    canInstall: 'canInstall',
    installing: 'installing',
    userDeny: 'useDeny',
    installed: 'installed',
    pwaMode: 'pwaMode', // 当前模式即为pwa模式
};

class PhoneLog {
    constructor() {
        this.list = [];
        this.root = document.createElement('div');
    }

    enable() {
        this.root.style.cssText += `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 200px;
            overflow: scroll;
            background: #fff;
            z-index: 100001;
            color: #000;
        `;
        document.body.appendChild(this.root);
    }

    log(v) {
        this.list.push(v);
        const ele = document.createElement('div');
        ele.textContent = JSON.stringify(v);
        ele.className = 'log-item';
        ele.style.cssText += `
            padding: 10px;
            border-bottom: 1px solid #eee;
        `;
        this.root.appendChild(ele);
    }
}

export const logger = new PhoneLog();
// logger.enable()

function createStorage(key) {
    return {
        set(v) {
            if (v === undefined) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, v);
            }
        },

        // 判断一下是否已经加载成功
        get() {
            return localStorage.getItem(key);
        },
    };
}

class PWAInstaller {
    constructor(config) {
        this.watchSubs = [];
        this.config = config || {};
        this.storage = createStorage('pwa-installed-v1');

        this.status = {
            type: this.storage.get() ? PWAInstallerStatus.installed : PWAInstallerStatus.init, // init installing userDeny installed
            value: {},
        };

        if (this.checkIsPWAMode()) {
            this.status.type = PWAInstallerStatus.pwaMode;
        }

        this.promptRef = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            this.promptRef = e;
            // Update UI notify the user they can install the PWA
            // Optionally, send analytics event that PWA install promo was shown.
            logger.log(`'beforeinstallprompt' event was fired.`);
            this.changeStatus(PWAInstallerStatus.canInstall);
            this.storage.set(); // 清空已缓存状态
        });

        window.addEventListener('appinstalled', () => {
            // Hide the app-provided install promotion
            // Clear the deferredPrompt so it can be garbage collected
            this.promptRef = null;
            // Optionally, send analytics event to indicate successful install
            logger.log('PWA was installed');
            // 确保app install 被最后触发
            // 在App上看起来，切换到此状态，也不代表pwa已经安装到桌面
            // pwa的安装看起来会经历：下载 -> 手机应用校验 -> 打开
            // 因此需要做一个假的进度条来改善下用户体验
            // 状态替换到此时：进度条仍然需要再走10s 90% - 100%
            this.storage.set('success');
            setTimeout(() => {
                this.changeStatus(PWAInstallerStatus.installed);
            }, this.config.appinstalledDelay || 1000);
        });

        this.checkIsIntsall();
    }

    /**
     * 设置配置
     * @param {{ appinstalledDelay: number }} config
     */
    setConfig(config) {
        Object.assign(this.config, config);
    }

    checkIsPWAMode() {
        return !!window.matchMedia('(display-mode: standalone)').matches;
    }

    /**
     * 此方法的兼容性实在很差
     * https://caniuse.com/mdn-api_navigator_getinstalledrelatedapps
     */
    checkIsIntsall() {
        if (!navigator.getInstalledRelatedApps) return;
        navigator.getInstalledRelatedApps().then((relatedApps) => {
            logger.log({ relatedApps });
            // Search for a specific installed platform-specific app
            const psApp = relatedApps.find((app) => app.id === 'com.example.myapp');

            if (psApp) {
                this.changeStatus(PWAInstallerStatus.installed);
                // Update UI as appropriate
            }
        });
    }

    // 当检测到pwa可安装后
    // UI层可以显示一个可install按钮，其点击事件调用install方法
    install = async () => {
        if (!this.promptRef) {
            return;
        }
        // Hide the app provided install promotion
        // Show the install prompt
        // Wait for the user to respond to the prompt
        const result = await this.promptRef.prompt();
        // We've used the prompt, and can't use it again, throw it away
        this.promptRef = null;
        const { outcome } = result;
        // Optionally, send analytics event with outcome of user choice
        logger.log(`User response to the install prompt: ${outcome}`);
        if (outcome == 'accepted') {
            // 触发一个虚假的进度条
            this.changeStatus(PWAInstallerStatus.installing);
        } else {
            this.changeStatus(PWAInstallerStatus.userDeny);
        }
    };

    changeStatus(type, value = {}) {
        this.status = { type, value };
        this.watchSubs.forEach((fn) => fn(this.status));
    }

    /**
     * 监听状态变化
     * @param {(v: { type: String }) => void} fn
     * @returns
     */
    watch(fn) {
        fn(this.status);
        this.watchSubs.push(fn);
        return () => {
            this.watchSubs = this.watchSubs.filter((i) => i !== fn);
        };
    }
}

export const pwa = new PWAInstaller();
