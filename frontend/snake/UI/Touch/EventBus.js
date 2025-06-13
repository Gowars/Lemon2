export class EventBus {
    _cache = {};

    on(name, callback) {
        const { _cache } = this;
        _cache[name] = _cache[name] || [];
        if (callback) {
            _cache[name].push(callback);
        } else {
            _cache[name].forEach((cb) => cb());
        }
        return this;
    }

    off(name, callback) {
        const { _cache } = this;
        if (!name) {
            this._cache = {};
            return this;
        }

        if (name && callback) {
            _cache[name] = (_cache[name] || []).filter((cb) => cb !== callback);
            return this;
        }

        _cache[name] = [];
        return this;
    }

    trigger(name, ...args) {
        const { _cache } = this;
        (_cache[name] || []).forEach((cb) => cb(...args));
        return this;
    }
}
