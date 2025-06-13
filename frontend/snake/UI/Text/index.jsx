import View from './../View';
import cx from '@/lemon-tools/cx';
import React, { useEffect, useRef, useState } from 'react';
import analyze from './analyze';

import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

/**
 * 实现思路
 * 如果overflow: hidden生效的话，元素的scrollHeight > clientHeight
 * 然后采取二分法查找临界点，start不溢出 end = start + 1 溢出
 * tip:
 * 找到临界点之后，把expandBtn插到最后一行，使用float:right的特性，保证其靠右
 * 直接塞到最后位置，有可能会导致expandBtn被挤掉，显示不出来
 * todo:
 * 如果字符串中包含emoji，可能会导致最后一个emoji无法正常显示
 */

const RIGHT_IDENT = 6;

const defaultProps = {
    content: '',
    children: undefined,
    className: '',
    style: null,
    onClick: undefined,
    /** 展示多少行 */
    line: 0,
    /** 点击文本后自动展开 */
    autoExpand: true,
    /** 展开按钮文案 */
    expandBtn: '展开',
    /** 展开按钮颜色 */
    expandColor: '',
    onStateChange: undefined,
};

/**
 * @param {defaultProps & React.AllHTMLAttributes} props
 * @returns
 */
export default function TextView(props) {
    const mixProps = getProps(props, defaultProps);
    const {
        content = '',
        children = content,
        className,
        style,
        onClick,
        line,
        autoExpand = true,
        expandBtn = '展开',
        expandColor = '',
        onStateChange,
        ...otherProps
    } = mixProps;

    const [state, setState] = useState({ isOverflow: false, start: -1 });
    const [expand, setExpand] = useState(false);
    const textRef = useRef();

    useEffect(() => {
        if (typeof children === 'string') {
            const analyzeResult = analyze(textRef.current, children);
            setState(analyzeResult);
            // 通知更改结果
            onStateChange && onStateChange(analyzeResult);
        }
    }, [children, line, expand]);

    const handleClick = (event) => {
        autoExpand && setExpand(!expand);
        onClick && onClick(event, expand);
    };

    const notExpand = !expand && line > 0;
    const child =
        state.isOverflow && !expand && expandBtn ? (
            <>
                {children.slice(0, state.start - RIGHT_IDENT)}
                {!!expandBtn && (
                    <span className={S.uiTextExpand} style={{ color: expandColor }}>
                        {expandBtn}
                    </span>
                )}
                {children.slice(state.start - RIGHT_IDENT)}
            </>
        ) : (
            children
        );

    return (
        <View
            comp="span"
            {...otherProps}
            className={cx(className, notExpand && S.uiTextLine, line && S.uiTextBlock)}
            style={{
                ...style,
                ...(notExpand && { WebkitLineClamp: line }),
            }}
            onClick={handleClick}
            ref={textRef}
        >
            {child}
        </View>
    );
}
