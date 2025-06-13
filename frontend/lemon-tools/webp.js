let isSupport = false;
let isTested = false;

function webp(callback) {
    if (isTested) {
        callback(isSupport);
    } else {
        let $img = new Image();
        $img.onload = function () {
            isTested = true;
            isSupport = true;
            $img = null;
            callback(isSupport);
        };
        $img.onerror = function () {
            isTested = true;
            $img = null;
            callback(isSupport);
        };

        $img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vlAAAA=';
    }
}

export default webp;

// promise版
