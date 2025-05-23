/**
 * 目标
 * 1. ios环境下捕获跨域资源错误
 *  - 【错误栈/错误文件】信息，不再是原始文件信息
 *  - 可以通过字符串替换的形式解决
 * 2. 通过fetch形式预加载js，以提升响应速度
 */

function replaceAll(raw = '', str = '', target = '') {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (!str || !raw.includes(str)) {
            break;
        }
        raw = raw.replace(str, target);
    }
    return raw;
}

function once(fn) {
    let isDone = false;
    return (...args) => {
        if (isDone) return;
        isDone = true;
        fn(...args);
    };
}

const blobToRawMap = {};
const canUseBlobAndUrl = !!(window.Blob && window.URL);
const DEFAULT_FN = () => {};

/**
 * 把文本中的blob链接替换为真实的资源地址
 * @param {string} text
 */
export function replaceBlobToRealsource(text = '') {
    Object.keys(blobToRawMap).forEach((blobUrl) => {
        text = replaceAll(text, blobUrl, blobToRawMap[blobUrl]);
    });
    return text;
}

/**
 * 通过xhr加载js资源，并不执行
 * @param {string} [src='']
 * @param {*} fn
 */
function fetchScript(src = '', fn = DEFAULT_FN) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const done = (content) => {
            fn && fn(content);
            resolve(content);
        };
        xhr.open('get', src);
        xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState == 4) {
                done({ loaded: true, content: xhr.responseText });
            }
        });
        xhr.addEventListener('error', () => {
            done({ loaded: false, content: '' });
        });
        xhr.addEventListener('abort', () => {
            done({ loaded: false, content: '' });
        });
        xhr.send();
    });
}

/**
 * 提供远程资源地址，将其转换为blob地址，以便可以capture error info
 * @param {String} src
 * @param {Function} success
 */
function exchangeSrcToBlobUrl(src = '', success = DEFAULT_FN) {
    fetchScript(src, ({ content, loaded }) => {
        if (!loaded) {
            success('');
            return;
        }

        const file = new Blob(content);
        const blobUrl = URL.createObjectURL(file);
        blobToRawMap[blobUrl] = src;
        success(blobUrl);
    });
}

/**
 * 加载script资源
 * 支持ios系统跨域脚本资源的错误捕获，可通过useBlobUrl控制
 * @param {{src: Array<String|{url: String, success: Function }>, success: Function, useBlobUrl: boolean }} [option]
 */
function loadScript(option) {
    const { queue: allSrc = [], success = DEFAULT_FN, useBlobUrl = false } = option;

    const loadResult = [];
    // 格式化操作
    const realSrcs = allSrc
        .filter((i) => i)
        .map((i) => {
            if (typeof i === 'string') {
                return {
                    url: i,
                    success: DEFAULT_FN,
                };
            }
            return i;
        });

    // 迭代器，加载所有资源
    let index = 0;
    const next = () => {
        if (index >= realSrcs.length) {
            success(); // 所有任务执行完毕
            return;
        }

        // 标记下，用来计算加载耗时
        const startTime = Date.now();

        const { url, success: onItemLoaded } = realSrcs[index];
        const addScriptTag = (fileUrl) => {
            const done = once((loaded = false) => {
                onItemLoaded(
                    loadResult.push({
                        url,
                        fileUrl,
                        loaded,
                        time: Date.now() - startTime,
                    })
                );
                next();
            });

            index += 1;
            if (!fileUrl) {
                done();
                return;
            }
            const script = document.createElement('script');
            script.addEventListener('load', () => {
                console.log('加载成功');
                done(true);
            });
            script.addEventListener('error', () => {
                console.log('加载error');
                done();
            });
            script.addEventListener('abort', () => {
                console.log('加载abort');
                done();
            });
            script.src = fileUrl;
            document.body.append(script);
        };

        if (canUseBlobAndUrl && useBlobUrl) {
            exchangeSrcToBlobUrl(url, addScriptTag);
        } else {
            addScriptTag(url);
        }
    };
    next();
}

loadScript({
    src: [{ url: '' }],
});
