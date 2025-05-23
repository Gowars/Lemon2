import { EventBus } from '../router/EventBus';

/**
 * 调用页面的生命周期
 * @param {HTMLElement} dom
 * @param {string} name
 */
export function callLifecycle(dom, name) {
    dom.pageLifecycle.status = name;
    dom.pageLifecycle.trigger('change', name);
    dom.pageLifecycle.instances.forEach((i) => i[name] && i[name]);
}

export class PageLifecycle extends EventBus {
    status = '';
    instances = [];
    watch(fn) {
        fn(this.status);
        const handler = () => {
            fn(this.status);
        };
        this.on('change', handler);
        return () => {
            this.off('change', handler);
        };
    }
    push(item) {
        this.instances.push(item);
    }
    remove(item) {
        this.instances = this.instances.filter((i) => i !== item);
    }
}
