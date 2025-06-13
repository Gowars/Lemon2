/**
 * 路由匹配
 *
 * /article/:id
 * |--------------------------------
 * | /article           | not match
 * |--------------------------------
 * | /article/          | match
 * |--------------------------------
 * | /article/1         | match
 * |--------------------------------
 * | /article/1/        | not match
 * |-------------------------------
 *
 * /article/* 全部匹配
 * |--------------------------------
 * | /article           | not match
 * |--------------------------------
 * | /article/          | match
 * |--------------------------------
 * | /article/1         | match
 * |--------------------------------
 * | /article/1/111     | match
 * |-------------------------------
 *
 * /article/a*
 * |--------------------------------
 * | /article/a11111    | match
 * |--------------------------------
 * | /article/a         | match
 * |--------------------------------
 * | /article/a1/ss     | not match
 * |--------------------------------
 *
 * /article/:id@[0-9]+
 * |--------------------------------
 * | /article/         | not match
 * |--------------------------------
 * | /article/11111    | match
 * |--------------------------------
 */

const split = (str, char) => {
    const index = str.indexOf(char);
    if (index < 0) {
        return [str, ''];
    }
    return [str.slice(0, index), str.slice(index + char.length)];
};

// 路由匹配
export default function matchRoute(url = '', obj = {}) {
    const urlItems = url.split('/');

    let params = {};
    let router = '';
    const testIncludesVar = /^[^:@]*:/;
    const matched = Object.keys(obj).some((route) => {
        const routeItems = route.split('/');
        router = '';

        // 全局匹配的级别最低，一般用来处理404
        if (route === '*') return false;

        // 长度相等，或者路由以*为结尾并且routeItems不能比urlItems长
        if (
            routeItems.length === urlItems.length ||
            (routeItems[routeItems.length - 1] === '**' && routeItems.length <= urlItems.length)
        ) {
            params = {}; // 获取参数
            router = route; // 匹配到的路由地址

            return routeItems.every((i, index) => {
                let urlItemsItem = urlItems[index];
                // 参数匹配
                if (testIncludesVar.test(i)) {
                    const [prev, rules] = split(i, ':');

                    if (urlItemsItem.startsWith(prev)) {
                        urlItemsItem = urlItemsItem.slice(prev.length);
                        // 对 /:id的支持
                        const [key, reg] = split(rules, '@');
                        params[key] = urlItemsItem;

                        // 对正则表达式的支持 /:name@aa.+
                        if (reg) {
                            return new RegExp(`^${reg}$`).test(urlItemsItem);
                        }
                        return true;
                    }
                }

                // * 匹配所有
                if (i === '*' || i === '**') {
                    return true;
                }

                // 常规性匹配 Abc*
                if (i.includes('*')) {
                    const reg = i.replace('*', '.*');
                    return new RegExp(`^${reg}$`).test(urlItemsItem);
                }

                // 纯文匹配
                return i === urlItemsItem;
            });
        }

        return false;
    });

    if (matched) {
        return {
            params,
            url,
            router,
            value: obj[router],
        };
    }

    if (obj['*']) {
        // 观察是否配置了全局匹配
        // 其实此时应该跳转404
        return {
            params,
            url,
            router: '*',
            value: obj['*'],
        };
    }
    return null;
}
