import React from 'react';
import S from './index.module.scss';

import { PickerView } from '../PickerView';
import cx from '@/lemon-tools/cx';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    /** 地址选择器标题 */
    title: '请选择地址',
    /** 地址数据配置 */
    address: [],
    value: [],
};

/**
 * @extends {React.PureComponent<AddressPicker.defaultProps, {}>}
 */
export default class AddressPicker extends React.PureComponent {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    constructor(props) {
        super(props);
        const { value, address } = this.mixProps;
        const getIndex = (arr, name) => {
            return Math.max(
                arr.findIndex((i) => i.name === name),
                0
            );
        };
        const firstId = getIndex(address, value[0]);
        const secondId = getIndex(address[firstId].children, value[1]);
        const thirdId = getIndex(address[firstId].children[secondId].children, value[2]);

        this.state = {
            firstId,
            secondId,
            thirdId,
        };
    }

    handleChange = (key) => (index) => {
        let { firstId, secondId, thirdId } = this.state;
        if (key == 'firstId' && firstId !== index) {
            secondId = 0;
            thirdId = 0;
        } else if (key == 'secondId' && secondId !== index) {
            thirdId = 0;
        }
        this.setState({
            secondId,
            thirdId,
            [key]: index,
        });
    };

    handleData() {
        const { firstId, secondId } = this.state;
        const city = this.mixProps.address[firstId].children;

        return {
            province: this.mixProps.address,
            city,
            country: city[secondId].children,
        };
    }

    submit = () => {
        const { firstId, secondId, thirdId } = this.state;
        const province = this.mixProps.address[firstId];
        const city = province.children[secondId];
        const country = city.children[thirdId];

        // console.log(firstId, secondId, thirdId, { province, city, country }, [province, city, country]);
        this.mixProps.onChange(
            [province, city, country].map((i) => i.name),
            { province, city, country }
        );
    };

    handleCancel = () => {
        this.mixProps.onCancel();
    };

    renderChild = ({ name }) => (
        <div key={name} style={{ textAlign: 'center' }}>
            {name}
        </div>
    );

    render() {
        const { state } = this;
        const { province, city, country } = this.handleData();

        return (
            <div className={S.main}>
                <div className={S.pickerButton}>
                    <div className={S.pickerClose} onClick={this.handleCancel}>
                        取消
                    </div>
                    <div className={S.pickerTitle}>{this.mixProps.title}</div>
                    <div className={cx(S.pickerClose, S.pickerDone)} onClick={this.submit}>
                        确定
                    </div>
                </div>
                <div className={S.flex}>
                    <PickerView
                        keyName="name"
                        dataSource={province}
                        value={state.firstId}
                        renderChild={this.renderChild}
                        onChange={this.handleChange('firstId')}
                    />
                    <PickerView
                        keyName="name"
                        // key={state.firstId}
                        dataSource={city}
                        value={state.secondId}
                        renderChild={this.renderChild}
                        onChange={this.handleChange('secondId')}
                    />
                    <PickerView
                        keyName="name"
                        // key={`${state.firstId}-${state.secondId}`}
                        dataSource={country}
                        value={state.thirdId}
                        renderChild={this.renderChild}
                        onChange={this.handleChange('thirdId')}
                    />
                </div>
            </div>
        );
    }
}
