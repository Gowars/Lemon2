/**
 * expireTime类似于cookie的有效期
 * 对象存储
 */
export class Storage {
    /**
     * Creates an instance of Storage.
     * @param {string} [namespace='']
     * @param {any} [nativeStorage=window.localStorage]
     * @memberof Storage
     */
    constructor(namespace = '', nativeStorage) {
        this.namespace = namespace;
        this.nativeStorage = nativeStorage;
    }

    /**
     * 获取指定key,可指定默认值
     * @template T
     * @param {string} [key='']
     * @param {T} defaultValue 默认值，避免返回null
     * @returns {T}
     */
    getItem(key = '', defaultValue = null) {
        key = this.namespace + key;
        const { nativeStorage } = this;
        if (!nativeStorage) return defaultValue;
        let json = nativeStorage.getItem(key);
        // 不存在直接返回
        if (!json) return defaultValue;
        // 尝试解析，解析失败直接返回，解析成功对比时间戳
        try {
            json = JSON.parse(json);
            if (json.t === undefined || json.t >= Date.now() / 1000) {
                return json.v;
            }
            // 过期直接删除
            nativeStorage.removeItem(key);
            return defaultValue;
        } catch (err) {
            return json;
        }
    }

    /**
     * 设置storage
     * @param {string} [key='']
     * @param {string} [value='']
     * @param {number} [expireTime=0]
     * @returns
     */
    setItem(key = '', value = '', expireTime = 'Infinity') {
        key = this.namespace + key;
        const { nativeStorage } = this;
        if (nativeStorage) {
            const data = { v: value };
            if (expireTime !== 'Infinity') {
                data.t = Math.round(Date.now() / 1000) + expireTime;
            }
            nativeStorage.setItem(key, JSON.stringify(data));
        }
        return value
    }

    /**
     * 清楚指定key
     * @param {string} key
     * @returns
     */
    removeItem(key = '') {
        key = this.namespace + key;
        const { nativeStorage } = this;
        nativeStorage && nativeStorage.removeItem(key);
    }

    /**
     * 清空所有
     * @returns
     */
    clearAll() {
        const { nativeStorage } = this;
        nativeStorage && nativeStorage.clearAll();
    }
}

export const storage = new Storage('', window.localStorage);
export const sessionStorage = new Storage('', window.sessionStorage);
