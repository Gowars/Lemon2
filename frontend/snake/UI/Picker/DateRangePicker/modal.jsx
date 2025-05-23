import React from 'react';
import { open } from '../../Modal';
import View from '../../View';
import { DateRangePicker } from '.';

export function DateRangePickerModal(props) {
    const handleOpen = () => {
        let modal;
        modal = open(
            <DateRangePicker
                onCancel={() => {
                    modal.close();
                }}
                onChange={(value) => {
                    modal.close();
                    props.onChange(value[0]);
                }}
                mode={props.mode}
                value={[props.value]}
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
