/**
 * 动态添加样式
 * @param {string} content
 * @returns
 */
export function addStyle(content, className) {
    var st = document.createElement('style');
    st.textContent = content;
    if (className) {
        st.className = className;
    }
    (document.head || document.documentElement).appendChild(st);
    return st;
}

export function checkIsIn(pos1, pos2) {
    return (
        pos1.left < pos2.left + pos2.width &&
        pos1.left + pos1.width > pos2.left &&
        pos1.top < pos2.top + pos2.height &&
        pos1.height + pos1.top > pos2.top
    );
}

/**
 * 鼠标拖拽选中元素
 */
export class MouseSelect {
    constructor(option = {}) {
        this.option = option;
        this.$eventDom = document.documentElement;
        this.state = {
            active: {
                down: false,
                move: false,
            },
            start: { x: 0, y: 0 },
            move: { x: 0, y: 0 },
            end: { x: 0, y: 0 },
        };
        this.listenEvent();

        addStyle(`
            .selectBorder { border: 1px solid red; }
        `);
    }

    createSelectDom() {
        const d = document.createElement('div');
        this.selectDom = d;
        document.documentElement.appendChild(d);
        return d;
    }

    setStyle({ from }) {
        const { start, move } = this.state;
        const pos = {
            top: Math.min(start.y, move.y),
            left: Math.min(start.x, move.x),
            width: Math.abs(move.x - start.x),
            height: Math.abs(move.y - start.y),
        };

        this.selectDom.style.cssText += `
            position: fixed;
            z-index: 100001;
            top: ${pos.top}px;
            left: ${pos.left}px;
            width: ${pos.width}px;
            height: ${pos.height}px;
            background: rgba(255,0,0,.2);
            pointer-events: none;
        `;

        if (from == 'move') {
            this.option.onMove?.({ pos, checkIsIn });
        } else {
            this.option.onEnd?.({ pos, checkIsIn });
        }
    }

    listenEvent = () => {
        this.$eventDom.addEventListener(
            'mousedown',
            (event) => {
                const { state } = this;
                this.option.onStart?.();
                state.active.down = true;
                state.start = {
                    x: event.clientX,
                    y: event.clientY,
                };
                this.createSelectDom();
            },
            { capture: true }
        );

        this.$eventDom.addEventListener(
            'mousemove',
            (event) => {
                const { state } = this;
                if (!state.active.down) return;
                state.active.move = true;
                state.move = {
                    x: event.clientX,
                    y: event.clientY,
                };
                this.setStyle({ from: 'move' });
            },
            { capture: true }
        );

        this.$eventDom.addEventListener(
            'mouseup',
            (event) => {
                const { state } = this;
                if (state.active.move) {
                    state.end = state.move = {
                        x: event.clientX,
                        y: event.clientY,
                    };
                    state.active = {
                        down: false,
                        move: false,
                    };
                    this.setStyle({ from: 'end' });
                }
                this.selectDom.remove();
            },
            { capture: true }
        );
    };
}

// new MouseSelect({
//     onStart() {
//         document.querySelectorAll('.layout-cell').forEach((item) => {
//             item.classList.toggle('selectBorder', false);
//         });
//     },
//     onMove({ pos, checkIsIn }) {
//         document.querySelectorAll('.layout-cell').forEach((item) => {
//             item.classList.toggle('selectBorder', checkIsIn(pos, item.getBoundingClientRect()));
//         });
//     },
// });
