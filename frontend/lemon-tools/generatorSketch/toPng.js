
function skeletonToPng(rootInfo) {
    class DrawEle {
        constructor(info, dpi = 1) {
            const canvas = document.createElement('canvas')
            canvas.id = 'testBgd'
            canvas.width = info.width * dpi
            canvas.height = Math.min(info.height, maxViewHeight) * dpi
            canvas.style.cssText += `
                position: fixed;
                top: 0;
                left: 0;
                z-index: 1000;
                background: #fff;
                opacity: 1.7;
            `
            this.ctx = canvas.getContext('2d')
            this.baseInfo = info
            this.dpi = dpi

            document.body.appendChild(canvas)
            this.draw(info)
        }

        get4(info) {
            return [info.x - this.baseInfo.x, info.y - this.baseInfo.y, info.width, info.height].map(i => i * this.dpi)
        }

        draw = (info) => {
            // TODO: 相对于父节点是隐藏的 -info.height > top > parent.height || -infow.width > left > parent.width
            if (!info || info.hide || (info.y - this.baseInfo.y > maxViewHeight)) return
            this.ctx.save();

            // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip
            // 避免溢出
            if (info.overflow) {
                const region = new Path2D();
                region.rect(...this.get4(info));
                this.ctx.clip(region, 'evenodd');
            }

            const color = getColor(info)

            // 只有有颜色的才需要画出来
            if (color) {
                info.color = color
                info.render = true
                this.ctx.fillStyle = color
                this.ctx.fillRect(...this.get4(info));
            }

            // 向下递归一下
            (info.children || []).forEach(item => {
                this.draw(item)
            })

            this.ctx.restore();
        }
    }

    return new DrawEle(rootInfo).baseInfo
}

// 嵌套类型
// start = [
//     `<div style="position:absolute;left:${realInfo[0]};top:${realInfo[1]};width:${realInfo[2]};height:${realInfo[3]};`,
//     bgd,
//     overflow,
//     info.borderRadius && `border-radius: ${info.borderRadius};`,
//     '">',
// ].filter(i => i).join('')

// const children = info.children.map(this.draw).filter(i => i).join('')

// this.currentDeepth -= 1
// const result = [start, children, start ? '</div>' : ''].filter(i => i).join('')
// if (result) {
//     return `\n${result}\n`.replace(/\n+/g, '\n')
// }
// return result
