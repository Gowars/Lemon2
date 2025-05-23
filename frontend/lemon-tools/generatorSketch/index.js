// @ts-check
// TODO: 计算是否有覆盖，以删除无价值元素。相同颜色的区块相互叠加无意义

function getSk(rootNode, option) {
    const {
        maxViewHeight = 812, // 视图的最大高度，取iphonex的高度。因为App、微信都有顶部导航，因此此高度够用了
        maxViewWidth = window.innerWidth, // 最大宽度
        MAX_DEEPTH = 8, // 遍历深度，规避过于复杂的场景
        imgColor = '#f2f2f2', // 图片颜色
        textColor = 'rgba(238, 238, 238, 0.8)', // 文本颜色
        varPre = '', // 变量前缀，处理多个骨架图组件共存的case
        endNodeClassName = [], // 指定className，不遍历其子元素
    } = option || {}

    function isBackgroundExsist(color) {
        return !['', 'none', 'rgba(0, 0, 0, 0)'].includes(color)
    }

    // 如果是一个纯色区域（一般指按钮），可以不用再向下递归
    function testIsEndNode(node, style) {
        if (node.tagName == 'SPAN' && isBackgroundExsist(style.backgroundColor)) {
            return true
        }

        // 按钮 轮播 定时器，不处理其内部元素
        return ['btn', 'carouselPage', 'countDown', ...endNodeClassName].some(i => node.className.includes(i))
    }

    function filterEmptyKey(obj) {
        Object.entries(obj).forEach(([key, value]) => {
            if (!value) {
                delete obj[key]
            }
        })

        return obj
    }

    function px2Rem(size) {
        return `${Number(((size * 2) / 100).toFixed(2))}rem`
    }

    /**
     * 文本节点本身获取不到rect，需要借助Range的特性来获取文本的位置
     * @param {Node} node
     * @returns
     */
    function getTextNodePosition(node) {
        let end = node
        // 对于非文本节点，需要特殊操作，选择出最后一个chilNode
        if (node.childNodes && node.childNodes.length) {
            end = node.childNodes[node.childNodes.length - 1]
        }
        const range = document.createRange();
        range.setStart(node, 0);// Start at first character
        range.setEnd(end, end.textContent.length); // End at fifth character
        const {
            x, y, top, left, width, height,
        } = range.getBoundingClientRect()
        return {
            x, y, top, left, width, height,
        }
    }

    /**
     * 获取元素的信息
     * @param {HTMLElement} node
     * @returns
     */
    function getEleInfo(node) {
        // 判断是不是 TEXT_NODE https://developer.mozilla.org/en-US/docs/Web/API/Node
        if (node.nodeType === 3) {
            return {
                ...getTextNodePosition(node),
                isText: true,
                text: node.textContent,
                children: [],
            }
        }

        // 非一般意义上的HTMLElement，则返回
        const style = getComputedStyle(node)
        if (!style) {
            return null
        }

        const {
            opacity,
            backgroundColor,
            display,
            visibility,
            overflow,
            overflowY,
            backgroundSize,
            borderRadius,
            boxShadow,
        } = style
        let { backgroundImage } = style

        const {
            x, y, width, height,
        } = node.getBoundingClientRect()

        // 如果背景图有指定大小，对于太小的size，或者是contain型的size(详情页分类模板的特殊case)，忽略背景图
        if (backgroundImage) {
            if (backgroundSize) {
                // backgroundSize中有一个小于15的
                const isSmallBgd = (backgroundSize.match(/\d{1,2}(\.\d+)?px/g) || ['100px']).some(i => Number(i.replace('px', '')) < 15)

                if (isSmallBgd || ['contain'].includes(backgroundSize)) {
                    backgroundImage = ''
                }
            }
        }

        // 图片加上背景色
        if (node.tagName === 'IMG') {
            backgroundImage = node.src || ''
        }

        return {
            x,
            y,
            width,
            height,
            opacity,
            borderRadius: borderRadius === '0px' ? '' : borderRadius,
            backgroundColor,
            backgroundImage,
            overflow: /hidden|scroll/.test([overflow, overflowY].join(' ')), // 是否剪切？
            children: [],
            hide: display == 'none' || visibility == 'hide' || height == 0 || width == 0, // 隐藏不显示的元素
            className: node.className,
            isEnd: testIsEndNode(node, style),
            boxShadow: ['none'].includes(boxShadow) ? '' : boxShadow,
        }
    }

    /**
     * 生成背景图
     * @param {number} h
     * @returns
     */
    function generatorGradient(h) {
        const [H, SPACE] = [20, 7]
        if (h > 1.6 * H) {
            const realRepeat = Math.round((h + SPACE) / (H + SPACE))
            const realHeight = Math.floor((h + SPACE) / realRepeat) - SPACE
            return `repeating-linear-gradient(${textColor}, ${textColor} ${realHeight}px, rgba(0, 0, 0, 0) ${realHeight}px, rgba(0, 0, 0, 0) ${realHeight + 5}px)`
        }

        return ''
    }

    function getColor(info) {
        let color = ''

        // 保持背景色，需要考虑下颜色是否会有点突兀
        // 或者如果和白色 灰色的色值偏差太大的时候，矫正一下？
        if (isBackgroundExsist(info.backgroundColor)) {
            color = info.backgroundColor
        }

        // info.height 20 25
        if (info.isText) {
            color = generatorGradient(info.height) || textColor
        }

        const { backgroundImage = '' } = info
        if (!['none', ''].includes(backgroundImage)) {
            color = imgColor
            if (/(repeating-)?linear-gradient/.test(backgroundImage)) {
                // [color] = backgroundImage.match(/rgba?\([^)]+\)|#[^#]+/)
                color = backgroundImage
            }
        }

        return color
    }

    /**
     * 获取相对位置，以用来计算相对坐标，用于nestNode
     * @param {*} node
     * @param {*} rootInfo
     * @returns
     */
    function getRelativePos(node, rootInfo) {
        // 去查找上一个标识了color的元素的位置，然后计算出相对位置
        let parent = node._parent
        while (parent) {
            if (parent.render) {
                return [node.x - parent.x, node.y - parent.y]
            }
            parent = parent._parent
        }

        return [node.x - rootInfo.x, node.y - rootInfo.y]
    }

    /**
     * 通过和（overflow: hidden）的父元素，进行相交算方法计算，得出相交区域的坐标信息为node的新坐标
     * 修正x,y,width,height，因为一个节点可能只显示部分
     * 取 [x, y] 最大的值，取[x + width, y + height]最小的值，即为相交的区域
     * @param {*} node
     */
    function checkIsHidden(node) {
        let parent = node._parent

        while (parent) {
            if (parent.overflow) {
                break
            }
            parent = parent._parent
        }

        if (parent) {
            const [newx, newy] = [
                Math.max(node.x, parent.x),
                Math.max(node.y, parent.y),
            ]

            const [newxEnd, newyEnd] = [
                Math.min(node.x + node.width, parent.x + parent.width),
                Math.min(node.y + node.height, parent.y + parent.height),
            ]

            Object.assign(node, {
                x: newx,
                y: newy,
                width: newxEnd - newx,
                height: newyEnd - newy,
            })

            // width height 有一个小于零，则表示元素应当被隐藏
            if (newxEnd - newx <= 0 || newyEnd - newy <= 0) {
                node.hide = true
            }
        }

        // 低于2px的，不渲染
        if (node.width < 2 || node.height < 2) {
            node.hide = true
        }
    }

    class Skeleton {
        currentDeepth = 0

        constructor(rootEle) {
            if (typeof rootEle === 'string') {
                rootEle = document.querySelector(rootEle)
            }

            this.absoluteInfo = [] // 扁平化对定位布局
            this.nestInfo = [] // 嵌套式布局

            this.baseInfo = this.snapshotNodeInfo(rootEle)
            this.nestInfo = this.getUsefulNode(this.baseInfo)
        }

        get4(info) {
            const [x, y] = getRelativePos(info, this.baseInfo)
            return [x, y, info.width, info.height].map(i => px2Rem(i))
        }

        snapshotNodeInfo = (root) => {
            const rootInfo = getEleInfo(root)
            if (rootInfo && !rootInfo.hide && !rootInfo.isEnd && root.children) {
                Array.from(root.childNodes).forEach(item => {
                    const info = this.snapshotNodeInfo(item)
                    info._parent = rootInfo

                    if (info.isText) {
                        info.width = Math.min(info.width, rootInfo.width)
                    }

                    info && rootInfo.children.push(info)
                })
            }
            return rootInfo
        }

        // 生成代码
        getUsefulNode = (info) => {
            checkIsHidden(info)
            // 在视窗之外的，不渲染
            if (
                !info
                || info.hide || info?._parent?.hide
                || (info.y - this.baseInfo.y > maxViewHeight)
                || (info.x - this.baseInfo.x >= maxViewWidth)
                || (info.x + info.width <= 0)
                || this.currentDeepth >= MAX_DEEPTH
            ) return ''

            const color = getColor(info)

            const overflow = info.overflow && 'overflow: hidden;';
            const bgd = color && `background:${color};`;

            // 只有有颜色的才需要画出来
            if (color) {
                info.color = color
            }

            if (bgd || overflow) {
                this.currentDeepth += 1
                const realInfo = this.get4(info)
                info.render = true
                info.deepth = this.currentDeepth // 深度

                if (info.height <= 20 && info.width <= 40) {
                    info.hide = true
                }

                this.absoluteInfo.push(filterEmptyKey({
                    // 需要相对于base的坐标
                    pos: [info.x - this.baseInfo.x, info.y - this.baseInfo.y, info.width, info.height].map(i => px2Rem(i)),
                    b: color,
                    o: info.overflow,
                    bo: info.borderRadius,
                    z: info.zIndex,
                    box: info.boxShadow,
                    className: info.className,
                }))

                const result = filterEmptyKey({
                    pos: realInfo,
                    b: color,
                    o: info.overflow,
                    bo: info.borderRadius,
                    children: info.children.map(this.getUsefulNode).filter(i => i),
                    box: info.boxShadow,
                })

                this.currentDeepth -= 1

                return result;
            }

            return info.children.map(this.getUsefulNode).filter(i => i)
        }

        toHtml() {
            const node = this.absoluteInfo
            let str = node.map(item => {
                const realInfo = item.pos

                return [
                    `<div style="position:absolute;left:${realInfo[0]};top:${realInfo[1]};width:${realInfo[2]};height:${realInfo[3]};`,
                    item.b && `background:${item.b};`,
                    item.bo && `border-radius: ${item.bo};`,
                    item.box && `box-shadow: ${item.box};`,
                    '"></div>',
                ].join('')
            }).join('')

            str = `<div style="width:${px2Rem(this.baseInfo.width)};height:${px2Rem(Math.min(this.baseInfo.height, maxViewHeight))};position:relative;margin:0 auto;overflow:hidden;">
               ${str}
             </div>`

            return str
        }

        toCode() {
            const node = this.absoluteInfo
            const code = `
                // 通过骨架图脚本自动生成，有问题请联系@王勇 @高瞻
                import React from 'react';

                const toStyle = (i) => ({ position: 'absolute', boxShadow: i.box, left: i.pos[0], top: i.pos[1], width: i.pos[2], height: i.pos[3], background: i.b, borderRadius: i.bo, overflow: i.o, });

                const ${varPre}BS = { width: '${px2Rem(this.baseInfo.width)}', height: '${px2Rem(Math.min(this.baseInfo.height, maxViewHeight))}', position: 'relative', margin: '0 auto', overflow: 'hidden' };
                // prettier-ignore
                const ${varPre}list = [
                    ${node.map(i => {
        const { className = '', ...others } = i;
        return `${JSON.stringify(others)}/* ${className.split(/\s/)[0]} */`
    }).join(',\n')}
                ]

                export default function ${varPre}Skeleton() {
                    return <div style={${varPre}BS}>
                        {${varPre}list.map((i, key) => <div style={toStyle(i)} key={key} />)}
                    </div>
                }
            `
            return code
        }

        toCodeByRender() {
            return getSk(this.renderNode, option).toCode()
        }

        toHtmlByRender() {
            return getSk(this.renderNode, option).toHtml()
        }

        toggle() {
            if (getComputedStyle(this.renderNode).pointerEvents === 'none') {
                this.renderNode.style.cssText += '; opacity: 1; pointer-events: all;'
            } else {
                this.renderNode.style.cssText += '; opacity: 0; pointer-events: none;'
            }
        }

        // 既可以使用canvas画出来，也可以生成svg，也可以生成react代码，或者html片段。任君挑选
        // png肯定是不太合适的，最好是还是react代码的size更小一点
        render() {
            const node = this.toHtml()
            const div = document.createElement('div')
            // 借助于在dom上的实时修改，以保存状态
            this.renderNode = div

            div.style.cssText += '; position: fixed; top: 0; left: 0; bottom: 0; right: 0; overflow-y: scroll; z-index: 100;'
            div.addEventListener('click', () => {
                const remove = confirm('确定要终止骨架图设计?')
                remove && div.remove()
            })

            if (typeof node === 'string') {
                div.innerHTML = node
            } else {
                div.appendChild(node)
            }
            document.body.appendChild(div)

            return this
        }
    }

    return new Skeleton(rootNode)
}
