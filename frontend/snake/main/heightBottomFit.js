import os from "@/lemon-tools/os";

export function getIsNeedBottomFit() {
    const { availHeight, availWidth } = window.screen;

    if (window.navigator.userAgent.match(/iphone/i)) {
        return ['375-812', '414-896', '414-896', '360-780', '390-844', '428-926', '393-852', '430-932'].includes(
            `${availWidth}-${availHeight}`
        );
    }

    return false;
}

if (os.ios) {
    let windowSize = window.innerHeight;
    const needBottomFitClass = getIsNeedBottomFit() ? 'needBottomFit' : 'noNeedBottomFit';
    const $html = document.querySelector('html');

    const addBottomFit = () => {
        $html.classList.toggle(needBottomFitClass, window.innerHeight >= 724); // 大于724的需要底部适配
    };

    addBottomFit();

    const setSize = (max, min) => {
        $html.setAttribute('maxInnerHeight', max);
        $html.setAttribute('minInnerHeight', min);
    };

    const handler = () => {
        const { innerHeight: newHeight, innerWidth: IW } = window;

        // 如果高度比宽度小，移除适配，【特指屏幕旋转】
        if (newHeight <= IW) {
            $html.classList.remove(needBottomFitClass);
            return;
        }

        if (newHeight > windowSize) {
            addBottomFit();
            setSize(newHeight, windowSize);
        } else if (newHeight < windowSize) {
            $html.classList.remove(needBottomFitClass);
            setSize(windowSize, newHeight);
        }
        windowSize = newHeight;
    };

    window.addEventListener('resize', handler);

    // 微信回退会出现导航条
    window.addEventListener('popstate', () => {
        handler();
        setTimeout(handler, 200);
    });
}

// https://stackoverflow.com/questions/47112393/getting-the-iphone-x-safe-area-using-javascript
// var style = `
// :root {
//     --safeBottom: env(safe-area-inset-bottom);
// }
// `

// const node =document.createElement('style')
// node.textContent = style
// document.head.appendChild(node)

// setInterval(() => {
//     Modal.tips(
//         getComputedStyle(document.documentElement).getPropertyValue('--safeBottom')
//     )
// }, 1000)
