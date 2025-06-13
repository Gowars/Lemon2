# 目标
```js
import multip from '@/lemon-tools/multip'

// 甚至不需要这些周期，只需要
multip.config({
    appName: 'qb',
    appHost: {
        test: '',
        production: '',
    },
    render() {

    },
    unmount() {

    },
    beforeinit() {

    },
    async beforePush() {

    },
    afterPush() {

    },
    // 统计上报
    visit() {

    }
})

multip.run()

const run = () => {
    loadJSON()
    loadScript()
    render()
}

multip.history.push
```
会跑一个路由映射 json出来
```js
var config = {
    base: ['manifest', 'vendor'],
    router: {
        '/xxx/xxx': {
            path: '/dist/xxx.js'
        }
    }
}
```
每次都会先去请求这个json，拿到之后
```js

```

支持Vue render!!!
