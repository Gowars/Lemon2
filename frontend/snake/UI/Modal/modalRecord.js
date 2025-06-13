/**
 * @template T
 * @param {Object} obj
 * @param {string} key
 * @param {T} defaultV
 * @returns {T}
 */
function getValue(obj, key, defaultV) {
    obj[key] = obj[key] || defaultV;
    return obj[key];
}

function getLast(arr) {
    return arr[arr.length - 1];
}

class Record {
    value() {
        return getValue(document.documentElement, '$modal_current_key', []);
    }
    push(item) {
        this.value().push(item);
    }
    pop() {
        this.value().pop();
    }
    check(key) {
        return getLast(this.value()) == key;
    }
}

export const modalRecord = new Record();
