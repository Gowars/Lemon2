// https://stackoverflow.com/questions/47112393/getting-the-iphone-x-safe-area-using-javascript

function addStyle(content) {
    const s = document.createElement('style');
    s.textContent = content;
    document.head.appendChild(s);
    return s;
}

addStyle(`
:root {
    --js-get-safearea-top: env(safe-area-inset-top);
    --js-get-safearea-right: env(safe-area-inset-right);
    --js-get-safearea-bottom: env(safe-area-inset-bottom);
    --js-get-safearea-left: env(safe-area-inset-left);
}
`);

class Safearea {
    constructor() {
        this.state = this.get();
        this.listeners = [];

        window.addEventListener('resize', () => {
            this.state = this.get();
        });
    }

    get() {
        const value = getComputedStyle(document.documentElement);
        const toNum = (v) => {
            return v.match(/^\d+/)?.[0] || 0;
        };

        return {
            top: toNum(value.getPropertyValue('--js-get-safearea-top')),
            bottom: toNum(value.getPropertyValue('--js-get-safearea-bottom')),
            right: toNum(value.getPropertyValue('--js-get-safearea-right')),
            left: toNum(value.getPropertyValue('--js-get-safearea-left')),
        };
    }

    watch = (fn) => {
        fn(this.state);
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter((i) => i !== fn);
        };
    };
}

export const safearea = new Safearea();
