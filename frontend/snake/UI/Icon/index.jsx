import cx from '@/lemon-tools/cx';
import React from 'react';
import './fontface.scss';

/**
 * @type {(props: { name: string } & React.HTMLProps) => React.ReactElement}
 */
export function Icon({ name = '', className = '', ...others }) {
    return <span className={cx(`snake-icon-${name}`, className)} {...others} />;
}

export function IconView({ name, text, space = '', ...others }) {
    return (
        <span {...others}>
            <Icon name={name} style={{ marginRight: space }} />
            {text}
        </span>
    );
}
