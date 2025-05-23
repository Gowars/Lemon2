import { getExif } from './exif';
import zip from './zip';

export function getLocation(exifInfo) {
    if (exifInfo.GPSLatitude && exifInfo.GPSLongitude) {
        // 维度
        const la = exifInfo.GPSLatitude[0] + exifInfo.GPSLatitude[1] / 60 + exifInfo.GPSLatitude[1] / 60 ** 2;
        // 经度
        const lo = exifInfo.GPSLongitude[0] + exifInfo.GPSLongitude[1] / 60 + exifInfo.GPSLongitude[1] / 60 ** 2;
        return [lo, la].map((i) => i.toFixed(6)).join(',');
    }
    return '';
}

/**
 * 获取文件
 * @param {string} [accept='image/*'] 指定文件格式
 * @param {number} [num=1] 指定文件数量
 * @returns
 */
export function getFiles(accept = 'image/*', num = 1) {
    return new Promise((resolve) => {
        // 移除原有的input
        let { input } = getFiles;
        input && document.body.removeChild(input);

        input = getFiles.input = document.createElement('input');
        input.style.cssText = 'position: absolute; top: -100000px; left: 0; visibility: hidden;';
        input.type = 'file';
        input.accept = accept;
        num > 1 && (input.multiple = 'multiple');
        document.body.appendChild(input);

        input.click();
        input.addEventListener('change', () => {
            const files = Array.from(input.files || []).slice(0, num);
            resolve(files);
        });
    });
}

/**
 * 上次处理结果作为下次处理输入
 * @param {Array<(a: T) => Promise<T>} pipes 处理函数
 * @param {Array<any>} target 被处理数组
 * @returns
 */
function handlePipes(pipes, target) {
    return new Promise((resolve) => {
        let index = 0;
        const next = () => {
            if (index >= pipes.length) {
                return resolve(target);
            }
            return Promise.all(target.map(pipes[index])).then((newTarget) => {
                index += 1;
                target = newTarget;
                next();
            });
        };
        next();
    });
}

/**
 * 队列化任务
 * @param {any} [targets=[]] 需被处理数组
 * @param {any} handle 处理函数
 * @param {any} callback 每次处理成功回调
 */
function queue(targets = [], handle) {
    let index = 0;
    const next = () => {
        if (index >= targets.length) return;
        handle(targets[index], () => {
            index += 1;
            next();
        });
    };
    next();
}

export class Uploader {
    /**
     * @param {{ uploadCore: Function }} option
     */
    constructor(option) {
        this.option = option
    }

    /**
     * [upload 文件上传方法]
     * @method upload
     * @param  {String}   [accept='*']          [文件类型]
     * @param  {String}   [multiple='multiple'] [是否允许多图上传]
     * @param  {Object}   option                [description]
     * @return [type]                           [description]
     */
    async upload({ accept = 'image/*', num = 9, ...option } = {}) {
        // 移除原有的
        const files = await getFiles(accept, num)
        // 需要剪切图片
        this.uploadFiles(files, option);
    }

    /**
     * [upload 上传file对象，可对图片文件进行压缩]
     * @method upload
     * @param  {FileList}  [files]   [files]
     * @param  {{ onEnd: Function, onError: Function, onStart: Function, onProgress: Function }} [options={}]
     * @return [type]
     */
    uploadFiles(files = [], options = {}) {
        const { onStart, onEnd, onError } = options;

        // 可以对files做一个过滤
        files = (onStart && onStart(files)) || files;

        let uploadIndex = 0;
        const filenames = {};
        const urls = [];
        const errs = [];
        const info = [];
        // 可以给每个元素加上一个id
        queue(Array.from(files || []), (file, done) => {
            // 上传文件
            this.uploadFile(
                file,
                ({ code, data = {}, err }) => {
                    if (code == 0) {
                        const { url } = data;
                        urls.push(url);
                        const item = {
                            name: file.name,
                            size: file.size,
                            url,
                            serverPath: url,
                        };
                        info.push(item);
                        filenames[url] = item;
                    }
                    err && errs.push(err);
                    uploadIndex += 1;
                    if (uploadIndex === files.length) {
                        onEnd && onEnd({ code: 0, data: { urls, filenames, info }, errs });
                        errs.length && onError && onError(errs);
                    }
                    done();
                },
                (uploadIndex + 1) / files.length,
                options
            );
        });
    }

    /**
     * 上传文件到cdn
     * @param {File} file 文件
     * @param {any} [callback=() => {}] 上传成功回调
     * @param {number} [PERCENT=1] 当前所占所有文件百分比
     * @param {any} [options={}] 其他配置
     */
    async uploadFile(file, callback = () => {}, PERCENT = 1, options = {}) {
        const { onProgress = () => {}, isZip = false, pipe = [] } = options;

        let exifInfo = {};
        let files = [file];
        // 只有图片才有必要获取信息
        const isImg = file.type.includes('image');
        if (isImg) {
            exifInfo = await getExif(file);
            files = await handlePipes(
                [...pipe, isZip && zip].filter((i) => i),
                files
            );
        }

        this.option.uploadCore({
            file: files[0],
            exifInfo,
            onProgress,
            isImg,
            callback,
            PERCENT,
        })
    }
}
