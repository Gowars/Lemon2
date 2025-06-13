/**
 * @template T
 * @param {*} props
 * @param {T} defaultV
 * @returns {T}
 */
export function getProps(props, defaultV) {
    return Object.assign({}, defaultV, props);
}
