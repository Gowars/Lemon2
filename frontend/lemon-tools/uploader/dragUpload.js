/**
 * 拖拽上传
 * @param {HTMLElement} $ele
 * @param {{ accept: string, callback: Function, matchAll: boolean }} param1
 */
export default function dragUpload($ele, { accept = 'image', callback, matchAll = false }) {
    if (accept === '*') {
        accept = '.*';
    } else {
        accept = `(${accept})/`;
    }
    const acceptReg = new RegExp(accept);

    const filter = (item) => {
        if (
            item instanceof File // 是一个文件
            && item.type // 如果文件类型为空，则应该是一个文件夹，可以通过拖拽一个文件夹来测试
            && acceptReg.test(item.type || '') // 文件类型需要判断
            && item.size > 0 // 文件大小
        ) {
            return item;
        }
        return null;
    };

    $ele.addEventListener('dragenter', (event) => {
        event.preventDefault();
    });

    // 处理拖拽
    $ele.addEventListener('drop', (event) => {
        event.preventDefault();
        let files = [];
        Array.from(event.dataTransfer.files).forEach((item) => {
            if (item instanceof FileList) {
                item.forEach((ele) => {
                    files.push(filter(ele));
                });
            } else {
                files.push(filter(item));
            }
        });
        files = files.filter((i) => i);
        files.length && callback(files);
    });

    $ele.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    // 处理剪切板
    $ele.addEventListener('paste', (event) => {
        // Stop data actually being pasted into div
        // Get pasted data via clipboard API
        const clipboardData = event.clipboardData || window.clipboardData;

        const items = Array.from(clipboardData.items);
        const allTypesIsRight = items.every((i) => acceptReg.test(i.type));

        if (matchAll && !allTypesIsRight) return;

        // 只有当所有item类型都满足条件的时候，才会上传，这是为了避免和其他监听paste的事件冲突
        // 此能力如果仅用在图片上传的场景，其逻辑是可以放开的
        const files = [];
        items.forEach((item) => {
            const isMatch = acceptReg.test(item.type);
            if (isMatch) {
                const file = item.getAsFile();
                filter(file) && files.push(file);
            }
        });
        if (files.length) {
            event.stopPropagation();
            event.preventDefault();
            callback(files, items);
        }
    });
}
