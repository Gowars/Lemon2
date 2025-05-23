import React, { createRef } from 'react';
import { scrollIntoCenter } from '@/lemon-tools/domUtil';

import View from '../../View';

import S from './index.module.scss';
import cx from '@/lemon-tools/cx';

// 处理根据年月来矫正日期
function getMaxDay(year, month) {
    let dayLen = 30;
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
        dayLen = 31;
    }
    if (month == 2) {
        dayLen = year % 4 === 0 ? 29 : 28;
    }
    return dayLen;
}

// 小于10的数字前面填充0
function fill0(v) {
    return v > 9 ? v : `0${v}`;
}

// 格式化当前时间
function getTimeStr() {
    const d = new Date();
    return `${d.getFullYear()}-${fill0(d.getMonth() + 1)}-${fill0(d.getDate())}`;
}

function getAllMonths(startStr, endStr) {
    const ranges = (start, end) => {
        const arr = [];
        for (let index = start; index <= end; index++) {
            arr.push(index);
        }
        return arr;
    };

    const [startYear, startMonth] = startStr.split('-').map((i) => Number(i));
    const [endYear, endMonth] = endStr.split('-').map((i) => Number(i));

    const months = [];

    ranges(startYear, endYear).forEach((year, index, arr) => {
        let rangeMonthStart = 1;
        let rangeMonthEnd = 12;
        if (index === 0 && startMonth) {
            rangeMonthStart = startMonth;
        }

        if (index === arr.length - 1 && endMonth) {
            rangeMonthEnd = endMonth;
        }

        ranges(rangeMonthStart, rangeMonthEnd).forEach((month) => {
            months.push({
                title: `${year}年${month}月`,
                date: getMaxDay(year, month),
                id: [year, fill0(month)].join('-'),
                // 前面需要几个空白填充元素
                pre: new Date(year, month - 1, 1, 0, 0, 0).getDay(),
            });
        });
    });

    return months;
}

// interface DatePageProps {
//   /** 表示选中的日期，格式为"YYYY-MM-DD" */
//   value[];
//   /** 表示有效日期范围的开始，字符串格式为"YYYY-MM-DD" */
//   start;
//   /** 表示有效日期范围的结束，字符串格式为"YYYY-MM-DD" */
//   end;
//   /** 禁用 */
//   disabled?: boolean;
//   /** 改变时触发 value 格式为 粒度相对应的 "YYYY-MM-DD" */
//   onChange: (value[]) => void;
//   /** 监听取消事件 */
//   onCancel?: () => void;
//   /** 标题 */
//   headerText?;
//   /** class */
//   className?;
//   /** 点击蒙层是否可关闭 */
//   maskCloseable?: boolean;
// }

export class DatePage extends React.Component {
    constructor(props) {
        super();
        const d = new Date();
        const {
            value,
            start: rangeStart = `${d.getFullYear() - 2}-01-01`,
            end: rangeEnd = `${d.getFullYear() + 1}-01-01`,
        } = props;

        const [startValue = getTimeStr(), endValue = getTimeStr()] = [...value];

        this.state = {
            // 是否选中开始时间按钮
            isSelectStart: false,
            startValue,
            endValue,
            rangeStart,
            rangeEnd,
        };
    }

    componentDidMount() {
        this.scroll();
    }

    handleCancel = () => {
        const { onCancel } = this.props;
        onCancel && onCancel();
    };

    handleSure = () => {
        const { onChange } = this.props;
        onChange && onChange([this.state.startValue, this.state.endValue]);
    };

    scrollRef = createRef();

    renderPickers() {
        const { startValue, endValue, rangeStart, rangeEnd } = this.state;

        const allMonths = getAllMonths(rangeStart, rangeEnd);
        const checkIsIn = (current) => {
            const [a, b, c, rangeStartNum, rangeEndNum] = [current, startValue, endValue, rangeStart, rangeEnd].map(
                (i) => i.replace(/-/g, '')
            );

            return cx([
                a == b && S.selectStart,
                a > b && a < c && S.selectRange,
                a == c && S.selectEnd,
                (a < rangeStartNum || a > rangeEndNum) && S.selectDisable,
            ]);
        };

        return (
            <div className={S.scroll} ref={this.scrollRef}>
                {allMonths.map((item) => {
                    return (
                        <View key={item.title} className={S.month}>
                            <View className={S.monthTitle}>{item.title}</View>
                            <View className={S.monthItems}>
                                {Array.from({ length: item.pre }).map((_, index) => (
                                    <View key={`pre${index}`} className={S.monthItem} />
                                ))}
                                {Array.from({ length: item.date }).map((_, index) => {
                                    const current = [item.id, fill0(index + 1)].join('-');
                                    return (
                                        <View
                                            key={`date${current}`}
                                            className={cx(checkIsIn(current), S.monthItem)}
                                            onClick={this.handleClick}
                                            data-id={current}
                                            id={`date${current}`}
                                        >
                                            {index + 1}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}
            </div>
        );
    }

    handleClick = (event) => {
        const { id } = event.target.dataset;
        const { startValue, isSelectStart } = this.state;
        if (isSelectStart) {
            let [newStart, end] = [startValue, id];
            const [a, b] = [newStart, end].map((i) => Number(String(i).replace(/-/g, '')));
            if (a > b) {
                [newStart, end] = [end, newStart];
            }
            this.setState({ endValue: end, startValue: newStart, isSelectStart: false });
        } else {
            this.setState({
                isSelectStart: true,
                startValue: id,
                endValue: id,
            });
        }
    };

    scroll = () => {
        // start element scroll into view
        const root = this.scrollRef.current;
        const ele = root.querySelector(`#date${this.state.startValue}`);
        if (ele) {
            // ele.scrollIntoView();
            scrollIntoCenter(root, ele);
        }
    };

    render() {
        const { headerText = '' } = this.props;

        return (
            <View className={S.main}>
                <View className={S.pickerButton}>
                    <View className={S.pickerClose} onClick={this.handleCancel}>
                        取消
                    </View>
                    <View className={S.pickerTitle}>
                        {headerText || [this.state.startValue, this.state.endValue].join(' - ')}
                    </View>
                    <View className={cx(S.pickerClose, S.pickerDone)} onClick={this.handleSure}>
                        确定
                    </View>
                </View>
                <View className={S.dates}>
                    {['日', '一', '二', '三', '四', '五', '六'].map((i) => (
                        <View className={S.dateItem} key={i}>
                            {i}
                        </View>
                    ))}
                </View>
                {this.renderPickers()}
            </View>
        );
    }
}
