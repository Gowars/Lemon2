import React, { PureComponent } from 'react';
import { Modal } from '@/snake/main';
import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

const NUM = [
    { text: '1' },
    { text: '2' },
    { text: '3' },
    { text: '4' },
    { text: '5' },
    { text: '6' },
    { text: '7' },
    { text: '8' },
    { text: '9' },
];

function formartPrice(numStr = '') {
    let dottIndex = 0;
    return numStr
        .replace(/^0+/, '0') // 只允许输入单个0
        .replace(/^0+([1-9].*)/, '$1') // 去除012的前置0
        .replace(/^\.*/, '') // 清楚前置点
        .replace(/\./g, ($0) => {
            // 只保留一个点
            if (dottIndex === 0) {
                dottIndex += 1;
                return $0;
            }
            return '';
        })
        .replace(/\.\d+$/, ($0) => $0.slice(0, 3)); // 保留小数点后几位小数
}

const defaultProps = {
    value: '',
    handleChange: (v) => {
        console.log(v);
    },
    handleCPChange: () => {},
    handleAdd: (value, num) => value + num,
    dott: true,
    type: 'price', // price
};

/**
 * @extends {PureComponent<defaultProps, {}>}
 */
export default class InputNum extends PureComponent {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    // 处理滚动切换光标位置
    handleSwipeCursor = () => {
        let distance = 0;
        let start = { x: 0, y: 0 };
        this.dom.addEventListener('touchstart', (e) => {
            distance = 0;
            start = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        });
        this.dom.addEventListener('touchmove', (e) => {
            const { clientX } = e.touches[0];
            distance = clientX - start.x;
            if (distance >= 30) {
                start.x = clientX;
                this.mixProps.handleCPChange(-1);
            } else if (distance <= -30) {
                start.x = clientX;
                this.mixProps.handleCPChange(1);
            }
        });
    };

    value = this.mixProps.value || '';

    add = (num) => () => {
        this.value = this.mixProps.handleAdd(this.value, num);
        if (this.mixProps.type === 'price') {
            this.value = formartPrice(this.value);
        }
        this.mixProps.handleChange(this.value);
    };

    del = () => {
        this.value = this.value.slice(0, -1);
        this.value = this.mixProps.handleChange(this.value) || this.value;
    };

    render() {
        return (
            <div
                className={S.inputNum}
                ref={(d) => {
                    this.dom = d;
                }}
            >
                {NUM.map((i) => (
                    <div key={i.text} onClick={this.add(i.text)}>
                        <span>{i.text}</span>
                    </div>
                ))}
                {this.mixProps.dott ? (
                    <div onClick={this.add('.')}>
                        <span>.</span>
                    </div>
                ) : (
                    <div onClick={this.add('00')}>
                        <span>00</span>
                    </div>
                )}
                <div onClick={this.add('0')}>
                    <span>0</span>
                </div>
                <div onClick={this.del}>
                    <span>x</span>
                </div>
            </div>
        );
    }
}

export class Input extends PureComponent {
    static defaultProps = {
        value: '',
        placeholder: '',
        cursorPosition: 0,
    };

    state = {
        focus: false,
        value: this.mixProps.value,
        cursorPosition: 0,
    };

    componentDidMount() {
        this.focus();
    }

    focus = () => {
        this.setState({
            focus: true,
        });
        Modal.open(
            <InputNum
                value={this.state.value}
                handleChange={(value) => {
                    this.setState({ value });
                }}
                handleCPChange={() => {
                    const { cursorPosition } = this.state;
                    // const newP = Math.min(Math.max(0, cursorPosition + change), this.state.value.length);
                    this.setState({
                        cursorPosition,
                    });
                }}
            />,
            {
                position: 'bottom',
                animationType: 'dd',
            }
        );
    };

    blur = () => {
        this.setState({
            focus: false,
        });
    };

    render() {
        const { placeholder } = this.mixProps;
        const { focus, value, cursorPosition } = this.state;

        let content = placeholder;
        if (focus || value) {
            const sliceEnd = value.length - cursorPosition;
            content = (
                <>
                    {value.slice(0, sliceEnd)}
                    <span className={S.cursor} />
                    {value.slice(sliceEnd)}
                </>
            );
        }

        return (
            <div onClick={this.focus} className={S.input}>
                {content}
            </div>
        );
    }
}
