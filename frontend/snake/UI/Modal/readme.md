# Modal

弹窗

## 使用

```js
// Com组件可以调用 this.props.close() 去关闭弹窗
Modal.open(
    <Child
        onClose={() => {
            console.log(弹窗关闭了);
        }}
    />
);

Modal.open(`<div>杜拉拉</div>`, {
    onClose() {
        // 关闭回调
    },
    onShow($dom, close) {
        // 显示回调
        $dom.addEventListener('click', close);
    },
});

Modal.close(); // 关闭当前弹窗
Modal.closeAll(); // 关闭所有弹窗，接受一个【是否关闭动画效果】参数
```
