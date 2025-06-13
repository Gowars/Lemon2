import React from 'react';
import Touch from '../../core';

// 滚动动画
function animateScroll(targetLeft, { time = 200, fn }) {
    let currentLeft = fn();
    const maxTime = time / 10;
    const PER = (targetLeft - currentLeft) / maxTime;
    let execTime = 1;

    const interval = setInterval(() => {
        currentLeft += PER;
        fn(currentLeft);
        execTime += 1;
        if (execTime > maxTime) {
            window.clearInterval(interval);
        }
    }, 10);
    return interval;
}

export default class Page extends React.PureComponent {
    rootRef = React.createRef();

    componentDidMount() {
        let scrollTop = 0;
        let scrollLeft = 0;

        new Touch(this.rootRef.current, {
            preventDefault: false,
        })
            .on('startv2', () => {
                scrollTop = this.rootRef.current.scrollTop;
                scrollLeft = this.rootRef.current.scrollLeft;
            })
            .on('changev2', ({ state, event }) => {
                const { change } = state;
                event.preventDefault();
                if (state.direction == 'ud') {
                    console.log(scrollTop - change.y);
                    this.rootRef.current.scrollTop = scrollTop - change.y;
                } else if (state.direction == 'lr') {
                    this.rootRef.current.scrollLeft = scrollLeft - change.x;
                }
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                // 判断方向，速度
                console.log(state, state.V.y * 10000);
                done();
                if (state.direction == 'ud') {
                    const target = scrollTop - change.y - state.V.y * 10000 * 50;
                    animateScroll(target, {
                        fn: (value) => {
                            if (value !== undefined) {
                                this.rootRef.current.scrollTop = value;
                            }
                            return this.rootRef.current.scrollTop;
                        },
                    });
                } else if (state.direction == 'lr') {
                    const target = scrollLeft - change.x - state.V.x * 10000 * 50;
                    animateScroll(target, {
                        fn: (value) => {
                            if (value !== undefined) {
                                this.rootRef.current.scrollLeft = value;
                            }
                            return this.rootRef.current.scrollLeft;
                        },
                    });
                }
            });
    }

    render() {
        return (
            <div
                style={{
                    width: '250px',
                    height: '300px',
                    overflow: 'scroll',
                    WebkitOverflowScrolling: 'auto',
                }}
                ref={this.rootRef}
            >
                <table style={{ width: '200vw' }}>
                    <tbody>
                        {Array.from({ length: 1000 }).map((i, index) => (
                            <tr key={[i, index].join('')}>
                                <td>测试自己阶段滚动事件, {Math.random()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}
