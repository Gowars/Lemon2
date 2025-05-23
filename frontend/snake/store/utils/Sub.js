export default class Sub {
    list = [];

    execOnListenerClear(fn) {
        if (this.list.length === 0) {
            fn();
        } else {
            this.unmountListener = fn;
        }
    }

    add(fn) {
        if (!this.list.includes(fn)) {
            this.list.push(fn);
        }
        return () => {
            this.list.indexOf(fn) > -1 && this.list.splice(this.list.indexOf(fn), 1);
            if (this.list.length === 0 && this.unmountListener) {
                this.unmountListener();
            }
        };
    }

    trigger(...arg) {
        this.list.forEach((fn) => fn(...arg));
    }
}
