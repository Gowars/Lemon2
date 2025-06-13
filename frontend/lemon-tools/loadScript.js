/**
 * [fileCache js资源状态缓存]
 * @type {Object}
 */
const fileCache = {};

function sendXHR(url, option = {}) {
    const xhr = new XMLHttpRequest()
    xhr.open('get', url)
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            option.success && option.success(xhr)
        }
    })
    xhr.addEventListener('error', (e) => {
        option.fail && option.fail(e)
    })
    xhr.addEventListener('abort', (e) => {
        option.fail && option.fail(e)
    })
    xhr.timeout = 10 * 1000
    xhr.send()
}

/**
 * [stopUnloadResolve 在js加载成功后，不执行回调函数]
 * @return {[type]} [description]
 */
function stopUnloadResolve() {
    Object.keys(fileCache).forEach((src) => {
        const cache = fileCache[src];
        cache.isResolve = cache.done;
    });
    return fileCache;
}

/**
 * [loadScript 加载单个js资源]
 * @param  {string|string[]}         src [资源地址]
 * @param  {{ useBlob: boolean }}         option [资源地址]
 * @return {Promise}             [description]
 */
function loadScript(src, option = {}) {
    if (Array.isArray(src)) {
        return Promise.all(src.map(i => loadScript(i, option)))
    }
    // 如果加载成功，就返回缓存的promise
    let cache = fileCache[src];
    if (cache) {
        return cache.promise;
    }

    cache = fileCache[src] = {};

    cache.promise = new Promise((resolve, reject) => {
        const a = document.createElement('a');
        a.hostname;
        a.href = src;
        const { pathname } = a;

        const handleLoad = () => {
            cache.done = true;
            resolve();
        };

        if (pathname.endsWith('.css')) {
            const script = document.createElement('link');
            script.onload = handleLoad;
            script.onerror = script.onabort = () => {
                delete fileCache[src]; // 加载失败则删除缓存
                document.head.removeChild(script);
                reject(new Error(`${src}加载失败`));
            };
            script.type = 'text/css';
            script.rel = 'stylesheet';
            script.charset = 'utf-8';
            script.href = src;
            document.head.appendChild(script);
        } else {
            const addScript = (src) => {
                const script = document.createElement('script');
                script.onload = handleLoad;
                script.onerror = script.onabort = () => {
                    delete fileCache[src]; // 加载失败则删除缓存
                    reject(new Error(`${src}加载失败`));
                };
                script.async = 'true';
                script.defer = 'true';
                script.type = 'text/javascript';
                script.src = src;
                // 添加crossOrigin https://github.com/LingYanSi/blog/issues/84 进行错误监控收集
                script.crossOrigin = 'anonymous';
                document.head.appendChild(script);
            }

            if (option.useBlob) {
                sendXHR(src, {
                    success: (xhr) => {
                        addScript(URL.createObjectURL(new Blob([xhr.responseText])))
                    },
                    error() {
                        addScript(src)
                    },
                })
            } else {
                addScript(src)
            }
        }
    });

    return cache.promise;
}

/**
 * [loadScriptInQueue 按顺序加载资源]
 * @method loadScript
 * @param  {string[]}  source [接受多个资源地址]
 * @return {Promise}       [description]
 */
function loadScriptInQueue(source) {
    return new Promise((resolve, reject) => {
        let index = 0;
        function load(src) {
            loadScript(src).then(
                () => {
                    index += 1;
                    if (index >= source.length) {
                        resolve();
                    } else {
                        load(source[index]);
                    }
                },
                () => {
                    reject();
                    console.error(`${src}加载失败`);
                },
            );
        }
        load(source[index]);
    });
}

export {
    loadScriptInQueue, loadScript, stopUnloadResolve,
};
