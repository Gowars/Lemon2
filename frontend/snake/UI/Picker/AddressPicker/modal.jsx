import React from 'react';
import { open } from '../../Modal';
import View from '../../View';
import AddressPicker from '.';

export function AddressPickerModal(props) {
    const handleOpen = () => {
        let modal;
        modal = open(
            <AddressPicker
                onCancel={() => {
                    modal.close();
                }}
                onChange={(value) => {
                    modal.close();
                    props.onChange(value);
                }}
                address={props.address}
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
