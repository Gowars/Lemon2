import React, { useState } from 'react';
import S from './index.module.scss';
import cx from '@/lemon-tools/cx';

export function TabsCard({ list }) {
    const [name, setName] = useState('');
    const activeName = name || list[0].name;
    const activeItem = list.find((i) => i.name == activeName) || list[0];

    return (
        <div>
            <div className={S.TabsCard}>
                {list.map((i) => (
                    <div
                        className={cx(i.name == activeItem.name && S.active)}
                        key={i.name}
                        onClick={() => setName(i.name)}
                    >
                        {i.name}
                    </div>
                ))}
            </div>
            <div key={activeItem.name}>{activeItem.render(activeItem)}</div>
        </div>
    );
}
