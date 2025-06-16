import { en } from "./en"
import { zh } from "./zh"

const is = (obj, type = '') => {
    return type == Object.prototype.toString.call(obj).match(/\s+(.+)\]/)[1].toLowerCase();
}

const isObj = (v) => is(v, 'object')

export function merge(base, sender) {
    if (isObj(base) && isObj(sender)) {
        Object.keys(sender).forEach((k) => {
            if (isObj(base[k] ) && isObj(sender[k] )) {
                base[k] = merge(base[k], sender[k]);
            } else if (base[k] === undefined) {
                base[k] = sender[k];
            }
        });
    }
    return base;
}

function getLang() {
    if (/^zh/i.test(navigator.language)) {
        return zh
    }
    return en
}

/** @type {zh} */
export const language = merge(getLang(), zh)
