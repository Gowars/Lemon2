// https://github.com/TehShrike/deepmerge
// 可能需要处理array的merge，目前暂时没有需求
const is = (obj, type) => {
    return (
        type ==
        Object.prototype.toString
            .call(obj)
            .match(/\s+(.+)\]/)[1]
            .toLowerCase()
    );
};
const isObj = (any) => is(any, 'object');

function merge(base, sender) {
    if (isObj(base) && isObj(sender)) {
        Object.keys(sender).forEach((k) => {
            if (isObj(base[k]) && isObj(sender[k])) {
                base[k] = merge(base[k], sender[k]);
            } else {
                base[k] = sender[k];
            }
        });
    }
    return base;
}
// merge({ a: { b: { name: 1 }}}, { a: { b: { nameX: 1 }, c: 1 }})

export { merge };
