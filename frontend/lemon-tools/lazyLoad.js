// 加载图片工具
const loadImageUtil = {
    // 获取懒加载类型，与资源路径
    data($ele) {
        const data = $ele.dataset;
        const src = data.lazyImg;
        if (src) {
            return {
                type: 'img',
                src,
            };
        }

        const bgd = data.lazyBgd;
        if (bgd) {
            return {
                type: 'bgd',
                src: bgd,
            };
        }

        const poster = data.lazyPoster;
        if (poster) {
            return {
                type: 'poster',
                src: poster,
            };
        }
        return {};
    },
    // 设置资源路径
    setSrc($ele, data) {
        const { src } = data;
        // 缓存
        switch (data.type) {
            case 'img':
                $ele.src = src;
                break;
            case 'bgd':
                $ele.style.backgroundImage = `url(${src})`;
                break;
            case 'poster':
                $ele.poster = src;
                break;
            default:
                break;
        }
    },
};
export default function lazyLoad() {
    // 优化
    const $eles = [].slice.call(document.querySelectorAll('.lazy-load-img'));
    if (!$eles.length) {
        return;
    }

    const { innerHeight, innerWidth } = window;
    // 加载图片
    $eles.some(($ele) => {
        const data = loadImageUtil.data($ele);
        const { src } = data;

        if (!src) {
            return false;
        }

        // 默认加载三屏幕 上 中 下
        const { top, left } = $ele.getBoundingClientRect();

        if (
            top < -innerHeight
            || top > innerHeight * 2
            || left < -innerWidth
            || left > innerWidth * 2
        ) {
            return false;
        }

        // 移除掉class，下一次就不加载了
        $ele.classList.remove('lazy-load-img');

        const fn = () => {
            loadImageUtil.setSrc($ele, data);
            lazyLoad.caches.push(src);
        };
        // 已加载
        if (lazyLoad.caches.includes(src)) {
            fn();
            return false;
        }
        // 去加载
        const $img = new Image();
        $img.onload = $img.onerror = $img.onabort = fn;
        // 根据是不是支持webp， 对图片做一些处理，加载图片
        $img.src = src;
        // 图片已经加载过
        if ($img.width || $img.height || $img.complete) {
            fn();
        }
        return false;
    });
}

lazyLoad.caches = [];
