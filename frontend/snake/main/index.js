import Modal from '@/snake/UI/Modal';
import { rootContext, getRouter } from '../mpa';
// 检测是否支持webp
import webp from '@/lemon-tools/webp';
// 复制文本到剪切板
import lazyLoad from '@/lemon-tools/lazyLoad';
import { copyToClipboard } from '@/lemon-tools/copyToClipboard';
import { scroll } from '@/lemon-tools/scroll';
import { setDeviceClass } from '@/lemon-tools/os';

import '@/lemon-tools/touchEffect';
import './heightBottomFit';


// 获取设备类型，进行css fix
setDeviceClass();

if (process.env.NODE_ENV === 'development') {
    window.addEventListener('resize', setDeviceClass);
}

// webp检测回调
webp(() => {
    scroll.listen('lazy-load-img', lazyLoad);
});
// fix ios input focus blur导致页面输入问题
window.addEventListener(
    'blur',
    () => {
        const value = scroll.top;
        scroll.top = value;
    },
    { capture: true }
);

function getSrc(url) {
    return window.appFileMaps[url] || url;
}

/**
 * [copyToClipboard 复制字符串到剪贴板 https://github.com/zenorocha/clipboard.js]
 * 注意这个操作必须是要用户行为触发，不然无法复制
 * @param  {string} [str=''] [需要复制的字符串]
 * @param  {string} [tipText] [复制成功文案提示]
 */
function fastCopy(str = '', tipText = '复制成功') {
    copyToClipboard(str);
    tipText && Modal.tips(tipText);
}

const utilMain = {
    Modal,
    lazyLoad, // 图片懒加载
    getSrc,
    rootContext,
    getRouter,
    fastCopy,
};

export default utilMain;

export {
    Modal,
    lazyLoad, // 图片懒加载
    getSrc,
    rootContext,
    getRouter,
    fastCopy,
};

// 监听全局的获取焦点事件
// document.body.addEventListener('focusin', (e) => {
//     // console.log('获取焦点', e.target)
// })

// document.body.addEventListener('focusout', (e) => {
//     // console.log('失去焦点', e.target)
// })
