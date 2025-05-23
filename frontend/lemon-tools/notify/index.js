// https://stackoverflow.com/questions/30302636/clients-openwindow-not-allowed-to-open-a-window-on-a-serviceworker-google-c

export function getWebIcon() {
    return Array.from(document.querySelectorAll('link') || []).filter((i) => i.rel == 'icon')[0]?.href;
}

/**
 * 通过浏览器发送消息通知
 * 需要注意的是，此方法需要和service-worker配合，才能达到定位到浏览器指定tab的目的
 * 可参考index.ejs/sw.js中相关逻辑
 * notify({ data: { url: location.href }, title: 'test' });
 * @param {{ title: string, data: any, body: string, image: string, icon: string}} props
 */
export function notify(props) {
    const { title, body, image, icon, data } = props;
    const core = () => {
        const option = {
            body,
            image,
            icon,
            data,
        };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                // registration.active.postMessage({ action: "focusTab", url: location.href });
                registration.showNotification(title, option);
            });
        }
    };
    if (!('Notification' in window)) {
        // Check if the browser supports notifications
        console.warn('This browser does not support desktop notification');
    } else if (Notification.permission === 'granted') {
        // Check whether notification permissions have already been granted;
        // if so, create a notification
        core();
        // …
    } else if (Notification.permission !== 'denied') {
        // We need to ask the user for permission
        Notification.requestPermission().then((permission) => {
            // If the user accepts, let's create a notification
            if (permission === 'granted') {
                core();
            }
        });
    } else if (Notification.permission == 'denied') {
        // 可以提示用户开启消息通知权限
    }
}
