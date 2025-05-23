import React from 'react';

import { PickerView } from '../PickerView';

import S from './index.module.scss';
import cx from '@/lemon-tools/cx';
import { getProps } from '@/lemon-tools/getProps';

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

// 格式化当前时间
function getTimeStr() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
}

// 小于10的数字前面填充0
function fill0(v) {
    return v > 9 ? v : `0${v}`;
}

// 获取时间范围
function getRanges(data, fields) {
    const { year = new Date().getFullYear(), month = 1, day = 1, hour = 0, minute = 0 } = data;

    let ranges = [
        {
            list: Array.from({ length: 200 }).map((_, index) => `${1900 + index}年`),
            type: 'year',
            value: [year - 1900],
            raw: year,
        },
        {
            list: Array.from({ length: 12 }).map((_, index) => `${1 + index}月`),
            type: 'month',
            value: [month - 1],
            raw: month,
        },
        {
            list: Array.from({ length: getMaxDay(year, month) }).map((_, index) => `${1 + index}日`),
            type: 'day',
            value: [day - 1],
            raw: day,
        },
        {
            list: Array.from({ length: 24 }).map((_, index) => `${index}时`),
            type: 'hour',
            value: [hour],
            raw: hour,
        },
        {
            list: Array.from({ length: 60 }).map((_, index) => `${index}分`),
            type: 'minute',
            value: [minute],
            raw: minute,
        },
    ];

    const index = ranges.findIndex((i) => i.type === fields);
    if (index >= 0) {
        ranges = ranges.slice(0, index + 1);
    }

    // 把时间格式化为字符串
    const [value] =
        `${year}-${fill0(month)}-${fill0(day)} ${fill0(hour)}:${fill0(minute)}`.match(
            new RegExp(`^\\d+([^\\d]\\d+){${index}}`)
        ) || [];

    return {
        ranges,
        value,
    };
}

// 把时间字符串转换为日期对象
function getTimeInfo(str) {
    const [year = new Date().getFullYear(), month = 1, day = 1, hour = 0, minute = 0] = str
        .split(/[-: ]/)
        .filter((i) => i.trim())
        .map((i) => Number(i.trim()));
    return {
        year,
        month,
        day,
        hour,
        minute,
    };
}

const defaultProps = {
    value: [],
    fields: 'day',
    mode: 'range', // one two
    onChange: () => {},
    onCancel: () => {},
};

/**
 * @extends {React.Component<defaultProps, {}>}
 */
export class DateRangePicker extends React.Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }
    constructor(props) {
        super(props);

        const { value } = this.mixProps;
        const [start, end] = [...value];
        this.state = {
            // 是否选中开始时间按钮
            isSelectStart: true,
            // 开始时间对象
            startInfo: {
                ...getTimeInfo(start || getTimeStr()),
                changed: !!start,
            },
            // 结束时间对象
            endInfo: {
                ...getTimeInfo(end || getTimeStr()),
                changed: !!end,
            },
        };
    }

    handleTimeChange =
        ({ type, list }) =>
        (index) => {
            let value = list[index];
            value = Number(String(value).match(/\d+/)[0]);
            const newState = { [type]: value };
            const key = this.state.isSelectStart ? 'startInfo' : 'endInfo';
            const timeObj = this.state[key];
            if (type === 'year') {
                const { day, month } = timeObj;
                newState.day = Math.min(day, getMaxDay(value, month));
            } else if (type === 'month') {
                const { day, year } = timeObj;
                newState.day = Math.min(day, getMaxDay(year, value));
            }

            this.setState({
                [key]: {
                    ...timeObj,
                    changed: true,
                    ...newState,
                },
            });
        };

    handleCancel = () => {
        const { onCancel } = this.mixProps;
        onCancel && onCancel();
    };

    handleSure = () => {
        const { onChange, fields } = this.mixProps;
        const start = getRanges(this.state.startInfo, fields).value;
        const end = getRanges(this.state.endInfo, fields).value;

        onChange && onChange(this.isSingleMode ? [start] : [start, end]);
    };

    toggle2Start = (isSelectStart) => () => {
        const key = isSelectStart ? 'endInfo' : 'startInfo';

        this.setState({
            isSelectStart,
            [key]: {
                ...this.state[key],
                changed: true,
            },
        });
    };

    renderPickers({ ranges }) {
        return (
            <div style={{ display: 'flex' }}>
                {ranges.map((item) => {
                    return (
                        <PickerView
                            key={item.type}
                            dataSource={item.list}
                            value={item.value}
                            onChange={this.handleTimeChange(item)}
                        />
                    );
                })}
            </div>
        );
    }

    renderError(start, end) {
        if (this.mixProps.mode == 'one') {
            return null;
        }
        if (Number(start.replace(/[-: ]/g, '')) > Number(end.replace(/[-: ]/g, ''))) {
            return <div className={S.error}>开始时间不能大于结束时间</div>;
        }
        return null;
    }

    get isSingleMode() {
        return this.mixProps.mode === 'one';
    }

    render() {
        const { headerText = '', fields } = this.mixProps;
        const { isSelectStart, startInfo, endInfo } = this.state;
        const { changed: startChanged } = startInfo;
        const { changed: endChanged } = endInfo;
        const startRange = getRanges(startInfo, fields);
        const endRange = getRanges(endInfo, fields);
        const error = this.renderError(startRange.value, endRange.value);

        return (
            <div className={S.main}>
                <div className={S.pickerButton}>
                    <div className={S.pickerClose} onClick={this.handleCancel}>
                        取消
                    </div>
                    <div className={S.pickerTitle}>{headerText}</div>
                    <div
                        className={cx(
                            S.pickerClose,
                            this.isSingleMode || (startChanged && !error) ? S.pickerDone : S.disabled
                        )}
                        onClick={this.handleSure}
                    >
                        确定
                    </div>
                </div>
                {!this.isSingleMode && (
                    <>
                        {error}
                        <div className={S.valueArea}>
                            <div className={cx(S.item, isSelectStart && S.selected)} onClick={this.toggle2Start(true)}>
                                {startChanged ? startRange.value : '开始时间'}
                            </div>
                            <div className={S.split} />
                            <div
                                className={cx(S.item, !isSelectStart && S.selected)}
                                onClick={this.toggle2Start(false)}
                            >
                                {endChanged ? endRange.value : '结束时间'}
                            </div>
                        </div>
                    </>
                )}
                {this.renderPickers(isSelectStart || this.isSingleMode ? startRange : endRange)}
            </div>
        );
    }
}
