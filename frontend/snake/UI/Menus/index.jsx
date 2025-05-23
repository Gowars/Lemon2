import React from 'react';
import { IndexLink } from '..//Link';

import S from './index.module.scss';
import cx from '@/lemon-tools/cx';

/**
 *
 * @param {{ data: Array<{key: string, title: string, href: string}> }} param0
 * @returns
 */
export function Menus({ data = [] }) {
    return (
        <div className={S.list}>
            {data.map((item) => {
                const { key, title, href } = item;

                return (
                    <IndexLink
                        className={cx(S.item, 'ui-flex-center')}
                        activeClassName={S.current}
                        href={href}
                        animation={false}
                        key={title}
                    >
                        <div>
                            <i className={`icon-${key}`} />
                            <span>{title}</span>
                        </div>
                    </IndexLink>
                );
            })}
        </div>
    );
}
