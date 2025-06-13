export default function getType(any) {
    return Object.prototype.toString.call(any).toLowerCase().split(/\s+/)[1].slice(0, -1);
}
