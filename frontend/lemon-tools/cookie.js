function getKeyValue(str = '', splitChar = '') {
    const index = str.indexOf(splitChar);
    if (index < 0 || !splitChar) {
        return [str];
    }
    const key = str.slice(0, index);
    const value = str.slice(index + splitChar.length);
    return [key, value];
}

/**
 * 获取通配符域名，Wildcard domain names
 * @param {string} host
 * @returns
 */
export function getWildcardDomain(host) {
    // 要用正则表达式匹配各个国家的特殊域名（比如.com.cn、.org.cn这种二级ccTLD），得考虑域名体系的特点：国家代码（ccTLD，如.cn、.uk）后接二级分类（com、org等）。
    const [prev, end] = host.split(/(\.(com|org|edu|gov|net|co|biz|ac|mil|info|pro)\.[a-z]{2}$)/);
    let wildDomain = '';
    if (end) {
        const second = prev.split('.').slice(-1)[0];
        wildDomain = second + end;
    } else {
        [wildDomain] = host.match(/[^.]+\.?[^.]+$/) || [''];
    }
    return '.' + wildDomain;
}

// 注意如果服务器设置cookie的时候添加了httponly属性
// js将无法获取到cookie
export class Cookie {
    /**
     * 获取指定cookie，返回string
     * @param {string} key
     * @returns string
     */
    get = (key) => this.getAll()[key];

    /**
     * 获取所有cookie
     * @returns {{ [key: string]: string }}
     */
    getAll = () => {
        const obj = {};
        document.cookie.split(';').forEach((item) => {
            const [key, value = ''] = getKeyValue(item, '=')
                .map((i) => i.trim())
                .map((i) => decodeURIComponent(i));
            if (key) {
                obj[key] = value;
            }
        });
        return obj;
    };

    /**
     * 设置cookie，时间长度为天，domain默认为 .github.com
     * .github.com下的cookie，可供所有二级域名使用
     * 只有与用户信息密切相关的东西，才应该存放到cookie，比如userId，sessionId，platform等
     * 一般性数据应该存在localStorage中，但很多时候我们为了exprieTime的特性才使用cookie
     * 在./storage.js中，我们提供了相关特性
     * @param {string} key cookie name
     * @param {string} value cookie value
     * @param {string|number} expireTime 过期时间
     * @param {string} domain 域名
     * @returns
     */
    set = (key = '', value = '', expireTime = '', domain = '') => {
        const EXPIRES =
            typeof expireTime === 'number' ? new Date(Date.now() + expireTime * 1000).toUTCString() : expireTime;
        const MAX_AGE = expireTime;

        let DOMAINS = [];
        const { hostname } = window.location;
        const commonDomain = getWildcardDomain(hostname);

        if (expireTime < 0 && !domain) {
            // 清空所有能清除的域名下的cookie .github.com gist.github.com ''
            DOMAINS = [commonDomain, hostname, ''];
        } else {
            // 默认为 .github.com
            DOMAINS = [domain || commonDomain];
        }
        DOMAINS.forEach((d) => {
            document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
                value
            )};domain=${d};path=/;expires=${EXPIRES};max-age=${MAX_AGE};`;
        });
        return this;
    };

    /**
     * 删除指定cookie
     *  * @param {string} key
     * @returns
     */
    remove = (key) => {
        this.set(key, '', -1);
        return this;
    };

    /**
     * 删除所有cookie
     */
    removeAll = () => {
        Object.keys(this.getAll()).forEach(this.remove);
        return this;
    };
}

const cookie = new Cookie();

export default cookie;
