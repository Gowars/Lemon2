import cx from '@/lemon-tools/cx';
import React from 'react';

import './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

/**
 * 数组填充到指定长度
 * @param {Array<any>} arr
 * @param {number} len
 * @returns
 */
function fill(arr, len) {
    const arrLen = arr.length;
    if (arrLen < len) {
        return arr.concat(Array.from({ length: len - arrLen }));
    } else if (arrLen > len) {
        return arr.slice(0, len);
    }
    return arr;
}

const defaultProps = {
    head: [], // 是否显示loading
    body: [], // loading显示文案
    showIndex: false,
    className: '',
    theme: 'even',
};

/**
 * @extends {PureComponent<defaultProps, {}>}
 */
export default function Table(props) {
    const mixProps = getProps(props, defaultProps);
    const { head, body, showIndex, className } = mixProps;

    return (
        <table border={0} className={cx('ui-table', className, 'ui-table-theme' + mixProps.theme)}>
            <thead>
                <tr>
                    {showIndex && <th>序号</th>}
                    {head.map((item, index) => (
                        <th key={index} style={item?.style || null}>
                            {item?.title || item}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {body.map((item, at) => {
                    const list = fill(item, head.length).map((ele, index) => <td key={index}>{ele}</td>);
                    return (
                        <tr key={at}>
                            {showIndex && <td>{at + 1}</td>}
                            {list}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
