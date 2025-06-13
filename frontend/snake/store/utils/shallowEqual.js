import getType from './getType';

function is(x, y) {
    if (x === y) {
        return x !== 0 || y !== 0 || 1 / x === 1 / y; // for 0 -0
    }
    return x !== x && y !== y; // for NaN
}

function isSameArray(prev = [], next = []) {
    return prev.length === next.length && prev.every((i, index) => is(i, next[index]));
}

export default function shallowEqual(prev, next) {
    if (is(prev, next)) {
        return true;
    }

    const [prevType, nextType] = [prev, next].map(getType);

    if (prevType === nextType) {
        if (prevType === 'object') {
            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(next);
            return isSameArray(prevKeys, nextKeys) && prevKeys.every((key) => is(prev[key], next[key]));
        }

        if (prevType === 'array') {
            return isSameArray(prev, next);
        }
    }

    return false;
}
