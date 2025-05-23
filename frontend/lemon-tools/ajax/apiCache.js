export class Cache {
    static enable = Boolean(window.caches);

    constructor(verison = 'v1') {
        this.verison = verison;
    }

    get = async (url) => {
        if (!Cache.enable) {
            return null;
        }

        const cache = await caches.open(this.verison);
        const res = await cache.match(url);
        if (res instanceof Response) {
            const str = await res.text();
            return JSON.parse(str);
        }
        return null;
    };

    set = async (url, response) => {
        if (!Cache.enable) {
            return;
        }
        const cache = await caches.open(this.verison);
        await cache.put(url, new Response(JSON.stringify(response)));
    };

    delete = async (url) => {
        if (!Cache.enable) {
            return;
        }

        const cache = await caches.open(this.verison);
        await cache.delete(url);
    };
}

export const apiCache = new Cache('v1');
