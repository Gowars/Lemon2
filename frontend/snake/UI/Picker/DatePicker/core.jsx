import React, { Component, createRef } from 'react';
import { renderDates } from './helper';

import { format as formatTime } from '@/lemon-tools/time';

import HotKey from '@/lemon-tools/hotkeys';
import { getProps } from '@/lemon-tools/getProps';

import './index.module.scss';
import { animationDispatch } from '@/lemon-tools/scroll';

function getRange(length = 0, start = 0) {
    return Array.from({ length }).map((_, index) => index + start);
}

function getNow() {
    const d = new Date();
    const [year, month, date, hours, min, sec] = [
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
    ];
    d.setMinutes(0);
    d.setHours(0);
    d.setSeconds(0);
    d.setMilliseconds(0);

    return {
        year,
        month,
        date,
        hours,
        min,
        sec,
        // x 00:00:00 的时间戳
        time: d.getTime(),
        ymd: [year, month, date].join('-'),
    };
}

function cx(...arr) {
    return arr.filter((i) => i).join(' ');
}

// 获取时间信息
function getInfo(monthFirstDate) {
    const d = new Date(monthFirstDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const list = renderDates(year, month);
    return {
        year,
        month,
        monthFirstDate,
        list,
        d,
    };
}

/**
 * 获取时间戳对应的那一天的开始时间戳
 * @param {*} time
 * @returns
 */
function getDateTime(time) {
    const d = typeof time === 'number' ? new Date(time) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
}

function toArray(any) {
    return Array.isArray(any) ? any : [];
}

// 获取时分秒信息
// 只有显示时分秒的时候，才从初始数据获取，否则默认为0
function getHMS(useHMS, rangeStartTime) {
    if (useHMS) {
        const d = new Date(rangeStartTime);
        return {
            hours: d.getHours(),
            min: d.getMinutes(),
            sec: d.getSeconds(),
        };
    }
    return {
        hours: 0,
        min: 0,
        sec: 0,
    };
}

// const DATES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DATES = ['一', '二', '三', '四', '五', '六', '日'];
const HOUR_RANGE = getRange(24);
const MIN_RANGE = getRange(60);
const SEC_RANGE = getRange(60);

const STEP = {
    one: 'rangeStartTime',
    two: 'rangeEndTime',
};

const defaultProps = {
    /** 支持number和Array<number>类型 */
    value: Date.now(),
    /** 开始时间 */
    startTime: new Date(2000, 1, 1),
    /** 结束时间 */
    endTime: Infinity,
    /** 数据变化回调 */
    onChange: () => null,
    /** 取消弹窗回调 */
    onCancel: () => null,
    /** 显示时分秒 */
    useHMS: true,
    /** 顶部时间显示格式 */
    format: 'YYYY-MM',
    /** 顶部标题 */
    title: null,
    renderItem: (v) => v.date,
    /** 是否禁用底部 */
    disableFooter: false,
    /** 是否使用时间区间 */
    mode: 'range',
    /** 根节点 */
    root: {},
};

/**
 * @extends {Component<{DatePicker.defaultProps}, {}>}
 */
export class DatePicker extends Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    constructor(props) {
        super(props);
        const { value, mode } = this.mixProps;

        let rangeStartTime;
        let rangeEndTime;
        const isRangeMode = mode === 'range';
        this.key = STEP.one;

        if (isRangeMode) {
            const defaultTime = getDateTime();
            [rangeStartTime = defaultTime, rangeEndTime = defaultTime] = toArray(value).map((i) => getDateTime(i));
            if (rangeStartTime !== rangeEndTime) {
                this.key = STEP.two; // 时间不相等，才会进入选择的第二布尔
            }
        } else {
            rangeStartTime = getDateTime(value);
            rangeEndTime = rangeStartTime;
        }

        this.state = {
            // 根据当前时间获取年月日相关信息
            ...getInfo(rangeStartTime),
            // 当前时间戳
            rangeStartTime,
            rangeEndTime,
            isRangeMode,
            // 时分秒相关状态
            showHMS: false,
            ...getHMS(props.useHMS, rangeStartTime),
        };
    }

    componentDidMount() {
        this.addBlurEvent();
    }

    componentWillUnmount() {
        this.removeBlurEvent();
    }

    /**
     * 通过监听根元素的点击事件，以达到模拟blur事件的效果
     */
    addBlurEvent = () => {
        const blur = (e) => {
            if (!this.$root.contains(e.target)) {
                this.mixProps.onCancel();
            }
        };
        const option = { capture: true };

        let timeout = setTimeout(() => {
            document.documentElement.addEventListener('click', blur, option);
        });

        const hk = new HotKey().on('esc', this.handleCancel);

        this.removeBlurEvent = () => {
            clearTimeout(timeout);
            document.documentElement.removeEventListener('click', blur, option);
            hk.unmount();
        };
    };

    // 更新时间
    update(time, shouldUpdateTime = false, callback) {
        const timeReal = getDateTime(Math.min(this.mixProps.endTime, Math.max(this.mixProps.startTime, time)));
        const newData = getInfo(timeReal);

        if (shouldUpdateTime) {
            const { key } = this;
            newData[key] = timeReal;
            if (key === STEP.one) {
                newData.rangeEndTime = timeReal;
            } else {
                const { rangeStartTime } = this.state;
                const timeArr = [rangeStartTime, timeReal].sort((a, b) => a - b);
                newData.rangeStartTime = timeArr[0];
                newData.rangeEndTime = timeArr[1];
            }
        }

        this.setState(newData, callback);
    }

    // 上一月
    handlePrevMonth = () => {
        const d = new Date(this.state.monthFirstDate);
        this.update(d.setMonth(d.getMonth() - 1));
    };

    // 下一月
    handleNextMonth = () => {
        const d = new Date(this.state.monthFirstDate);
        this.update(d.setMonth(d.getMonth() + 1));
    };

    // 上一年
    handlePrevYear = () => {
        const d = new Date(this.state.monthFirstDate);
        this.update(d.setFullYear(d.getFullYear() - 1));
    };

    // 下一年
    handleNextYear = () => {
        const d = new Date(this.state.monthFirstDate);
        this.update(d.setFullYear(d.getFullYear() + 1));
    };

    // 重置到当前时间
    reset = () => {
        const d = getNow();
        if (this.state.showHMS) {
            this.setState(
                {
                    hours: d.hours,
                    min: d.min,
                    sec: d.sec,
                },
                this.scrollToTop
            );
        } else {
            this.key = STEP.one;
            this.setState({
                rangeStartTime: d.time,
                rangeEndTime: d.time,
                ...getInfo(d.time),
            });
        }
    };

    // 只有点击具体日期了才能真正更改时间
    // 其他只算更改月份显示面板
    handleClick = (item) => () => {
        const { isRangeMode } = this.state;
        if (isRangeMode) {
            this.key = this.key == STEP.two ? STEP.one : STEP.two;
        }
        this.update(item.time, true, () => {
            // 如果禁用底部按钮出现，那么在选择了日期之后，应当触发submit事件
            if (this.mixProps.disableFooter) {
                if (isRangeMode) {
                    if (this.key === STEP.two) {
                        this.handleSubmit();
                    }
                } else {
                    this.handleSubmit();
                }
            }
        });
    };

    handleSubmit = (event) => {
        event && event.stopPropagation();
        const { rangeStartTime, rangeEndTime, isRangeMode } = this.state;

        const value = [rangeStartTime, rangeEndTime].map((i) => {
            const { state } = this;
            if (this.mixProps.useHMS) {
                return new Date(i).setHours(state.hours, state.min, state.sec);
            }
            return i;
        });

        this.mixProps.onChange(isRangeMode ? value : value[0]);
    };

    handleCancel = (e) => {
        e && e.stopPropagation();
        this.mixProps.onCancel();
    };

    scrollToTop = () => {
        if (!this.state.showHMS) {
            return;
        }
        Array.from(this.$root.querySelectorAll('.date-hms .current')).map((ele) => {
            const start = ele.parentElement.scrollTop;
            const target =
                start +
                ele.getBoundingClientRect().top -
                ele.parentElement.getBoundingClientRect().top -
                ele.parentElement.clientHeight / 2;
            animationDispatch({
                duration: 300,
                getStart: () => start,
                getEnd: () => target,
                onChange(v) {
                    ele.parentElement.scrollTop = v;
                },
            });
        });
    };

    // 处理时分秒变化
    handleHMSChange = (type, value) => () => {
        this.setState({ [type]: value }, this.scrollToTop);
    };

    // 切换显示年月日
    toggleHMS = (showHMS) => () => {
        this.setState({ showHMS }, this.scrollToTop);
    };

    renderNowSelectTime() {
        if (!this.mixProps.title) {
            return null;
        }

        const { hours, min, sec, rangeStartTime, rangeEndTime, isRangeMode } = this.state;
        const timeStr = [rangeStartTime, isRangeMode && rangeEndTime]
            .filter((i) => i)
            .map((i) => {
                const currentDate = new Date(i).setHours(hours, min, sec);
                return formatTime(currentDate, this.mixProps.format);
            })
            .join(' 至 ');

        return (
            <div>
                {this.mixProps.title}
                {timeStr}
            </div>
        );
    }

    checkIsCurrent(item) {
        const { rangeStartTime, rangeEndTime } = this.state;
        return item.time >= rangeStartTime && item.time <= rangeEndTime;
    }

    rootRef = createRef();

    get $root() {
        return this.mixProps.root?.current || this.rootRef.current;
    }

    render() {
        const { month, hours, min, sec, list, showHMS, d } = this.state;
        const { startTime, endTime, useHMS } = this.mixProps;
        const nowDate = getNow();

        let content = null;
        if (showHMS) {
            content = (
                <div className="date-hms">
                    {[
                        { type: 'hours', current: hours, list: HOUR_RANGE },
                        { type: 'min', current: min, list: MIN_RANGE },
                        { type: 'sec', current: sec, list: SEC_RANGE },
                    ].map((item) => {
                        return (
                            <div className="date-hms-items" key={item.type}>
                                {item.list.map((i) => (
                                    <div
                                        onClick={this.handleHMSChange(item.type, i)}
                                        className={cx(item.current == i ? 'current' : '', 'date-hms-item')}
                                        key={i}
                                    >
                                        {i}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            );
        } else {
            content = (
                <div className="date-items">
                    <div className="date-items-week">
                        {DATES.map((i) => (
                            <div className="date-item data-item-week" key={i}>
                                {i}
                            </div>
                        ))}
                    </div>
                    <div className="date-items-day">
                        {list.map((item) => {
                            const className = cx(
                                'date-item',
                                'date-day-item',
                                item.time >= startTime && item.time < endTime && 'date-item-enable',
                                this.checkIsCurrent(item) && 'date-item-current',
                                item.month > month && 'date-item-next',
                                item.month < month && 'date-item-prev',
                                item.ymd === nowDate.ymd && 'date-item-now'
                            );

                            return (
                                <div
                                    data-time={item.time}
                                    key={item.time}
                                    className={className}
                                    role="button"
                                    tabIndex="0"
                                    onClick={this.handleClick(item)}
                                >
                                    {this.mixProps.renderItem(item)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className={cx('date-picker', this.mixProps.className)} ref={this.rootRef}>
                {this.renderNowSelectTime()}
                <div className="date-ym-jump">
                    <button className="date-btn" onClick={this.handlePrevYear} role="button">
                        {`<<`}
                    </button>
                    <button className="date-btn" onClick={this.handlePrevMonth} role="button">
                        {'<'}
                    </button>
                    <div className="date-year-month">{formatTime(d, this.mixProps.format)}</div>
                    <button className="date-btn" onClick={this.handleNextMonth} role="button">
                        {'>'}
                    </button>
                    <button className="date-btn" onClick={this.handleNextYear} role="button">
                        {'>>'}
                    </button>
                </div>
                {content}
                {!this.mixProps.disableFooter && (
                    <div className="date-btn-container">
                        <button className="date-btn" onClick={this.handleCancel}>
                            取消
                        </button>
                        <button className="date-btn" onClick={this.reset}>
                            当前
                        </button>
                        {useHMS &&
                            (showHMS ? (
                                <button className="date-btn" onClick={this.toggleHMS(false)}>
                                    年月日
                                </button>
                            ) : (
                                <button className="date-btn" onClick={this.toggleHMS(true)}>
                                    时分秒
                                </button>
                            ))}
                        <button className="date-btn" onClick={this.handleSubmit}>
                            确认
                        </button>
                    </div>
                )}
            </div>
        );
    }
}
