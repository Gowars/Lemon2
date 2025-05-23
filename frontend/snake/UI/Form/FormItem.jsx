import React, { useContext } from 'react';
import { FormContext } from './helper';
import cx from '@/lemon-tools/cx';
import { pickOthers } from '@/lemon-tools/objectUtil';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    /** 标题 */
    label: '',
    /** 标题宽度 */
    labelWidth: '',
};

/**
 * @param {defaultProps & React.InputHTMLAttributes} props
 * @returns
 */
export function FormItem(props) {
    const mixProps = getProps(props, defaultProps);
    const { labelWidth = mixProps.labelWidth } = useContext(FormContext) || {};
    const labelStyle = {};
    if (labelWidth) {
        labelStyle.width = labelWidth;
        labelStyle.color = '#555';
    }

    const otherProps = pickOthers(mixProps, ['className', 'labelWidth']);

    return (
        <div className={cx('ui-flex-a mb10', mixProps.className)} {...otherProps}>
            {!!mixProps.label && (
                <div className="mr10 tr" style={labelStyle}>
                    {mixProps.label}:
                </div>
            )}
            <div className="ui-flex1 ui-flex">{mixProps.children}</div>
        </div>
    );
}
