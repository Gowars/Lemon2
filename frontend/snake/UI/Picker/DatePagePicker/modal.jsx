import React from 'react';
import { open } from '../../Modal';
import View from '../../View';
import { DatePage } from '.';

export function DatePageModal(props) {
    const handleOpen = () => {
        // eslint-disable-next-line no-unused-vars
        const { children, ...others } = props;
        let modal;
        modal = open(
            <DatePage
                {...others}
                onCancel={() => {
                    modal.close();
                }}
                onChange={(value) => {
                    modal.close();
                    props.onChange(value);
                }}
                value={props.value}
            />,
            { animationType: 'dd', position: 'bottom', escClose: true }
        );
    };

    return (
        <View onClick={handleOpen} className={props.className} style={props.style}>
            {props.children}
        </View>
    );
}
