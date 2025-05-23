import { EventBus } from './EventBus';

export class MemoryHistory extends EventBus {
    list = [];

    forwardList = [];

    push(url, state) {
        this.list.push({
            url,
            state,
        });
        this.forwardList = [];
        this.trigger('change', url, state, { type: 'push' });
    }

    replace(url, state) {
        const { length } = this.list;
        if (length > 0) {
            this.list.pop();
            this.list.push({
                url,
                state,
            });
            this.trigger('change', url, state, { type: 'replace' });
        }
    }

    go(index = 0) {
        // 后退
        if (index < 0 && this.list.length + index > 0) {
            this.list = this.list.slice(0, index);
            this.forwardList = this.list.slice(index).concat(this.forwardList);
            const { url, state } = this.list[this.list.length - 1];
            this.trigger('change', url, state, { type: 'back' });
            // 前进
        } else if (index > 0 && this.forwardList.length > index) {
            this.list.push(...this.forwardList.slice(0, index));
            const { url, state } = this.list[this.list.length - 1];
            this.trigger('change', url, state, { type: 'forward' });
        }
    }

    goBack() {
        this.go(-1);
    }

    goForward() {
        this.go(1);
    }
}

export default function (option = {}) {
    return new MemoryHistory(option);
}
