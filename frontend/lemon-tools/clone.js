export function clone(any) {
    const type = typeof any;
    if (!any) {
        return any;
    } else if (Array.isArray(any)) {
        return any.map((i) => clone(i));
    } else if (type == 'object') {
        const res = {};
        for (const item in any) {
            if (typeof any[item] !== 'function') {
                res[item] = clone(any[item]);
            }
        }
        return res;
    }
    return any;
}

export function cloneNoCycle(v) {
    const core = (any, parents = []) => {
        if (parents.includes(any)) {
            return;
        }
        const type = typeof any;
        if (!any) {
            return any;
        } else if (type == 'object') {
            const res = {};
            for (const item in any) {
                if (typeof any[item] !== 'function') {
                    res[item] = core(any[item], [any].concat(parents));
                }
            }
            return res;
        } else if (Array.isArray(any)) {
            return any.map((i) => core(i), [any].concat(parents));
        }
        return any;
    };
    return core(v);
}
