import React, { useEffect } from 'react';
import S from './index.module.scss';
import cx from '@/lemon-tools/cx';
import { useBetterState } from '@/snake/useLib';
import { getProps } from '@/lemon-tools/getProps';

// https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t

const defaultProps = {
    src: '',
    srcDoc: null,
    className: '',
    style: {},
    referrerPolicy: 'origin-when-cross-origin',
    allowfullscreen: false,
    allow: '',
};

/**
 * @param {defaultProps} props
 * @returns
 */
export function IframeView(props) {
    const mixProps = getProps(props, defaultProps);
    const { state, setState } = useBetterState({
        status: 1, // 1 loading 2 done 3 error
    });

    useEffect(() => {
        setState({ status: 1 });
    }, [mixProps.src]);

    const handleErr = () => {
        setState({ state: 3 });
    };

    const handleLoad = () => {
        setState({ status: 2 });
    };

    return (
        <div className={cx(S.frameBox, mixProps.className, state.status == 1 && S.loading)} style={mixProps.style}>
            <iframe
                key={mixProps.src}
                src={mixProps.src}
                srcDoc={mixProps.srcDoc}
                className={S.frame}
                onLoad={handleLoad}
                onError={handleErr}
                referrerPolicy={mixProps.referrerPolicy}
                allowfullscreen={mixProps.allowfullscreen}
                allow={mixProps.allow}
            />
            {mixProps.children}
        </div>
    );
}
