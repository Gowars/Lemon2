function toFixed(num = 0, config = 1) {
    return num.toFixed(config).replace(/\.0+$/, '')
}

/**
 * byte to human readable size
 * @param {number} size
 * @returns
 */
export function humanSize(size = 0) {
    const kb = size / 1024;
    if (kb > 999) {
        return toFixed(kb / 1024, 1) + 'M';
    }

    return toFixed(kb, 1) + 'kB';
}
