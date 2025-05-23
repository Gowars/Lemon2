import FingerprintJS from './finger_v4'

/**
 * https://openfpcdn.io/fingerprintjs/v4
 * https://github.com/fingerprintjs/fingerprintjs
 */

const callbacks = []
let fingerId = ''
FingerprintJS.load()
    .then(fp => fp.get())
    .then(result => {
      // This is the visitor identifier:
        fingerId = result.visitorId
        callbacks.forEach(fn => fn(fingerId))
    })

/**
 * 获取浏览器指纹
 * @returns
 */
export const getFinger = () => fingerId

export function onFingerLoad(fn) {
    fingerId ? fn(fingerId) : callbacks.push(fn)
}

