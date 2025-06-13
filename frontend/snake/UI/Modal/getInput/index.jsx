import React, { Component } from 'react';
import { Textarea } from '../../Form';
import S from './index.module.scss';
import Modal from '../index';

class A extends Component {
    static defaultProps = {
        maxLen: Infinity,
        content: '',
    };

    state = {
        content: this.props.content,
        writeNum: this.props.content.length,
    };

    handleChange = (content) => {
        this.setState({
            content,
            writeNum: content.length,
        });
    };

    save = () => {
        alert(this.state.content);
        this.props.close();
    };

    render() {
        const { content, writeNum } = this.state;
        const { maxLen } = this.props;

        return (
            <div className={`flex column ${S.wrap}`}>
                <div>
                    <button className="modal-close">取消</button>
                    <button className="float-right" onClick={this.save}>
                        保存
                    </button>
                </div>
                {maxLen != Infinity && (
                    <div className={S.tongji}>
                        {writeNum}/{maxLen}
                    </div>
                )}
                <div className={`ui-flex1 overflow-y flex column ${S.textarea}`}>
                    <Textarea
                        autoFocus
                        formart
                        value={content}
                        maxLen={maxLen}
                        onChange={this.handleChange}
                        height="100%"
                    />
                </div>
            </div>
        );
    }
}

export default function getText() {
    const { scrollTop } = document.documentElement;
    Modal.open(<A maxLen={20} content="11" />, {
        fullScreen: true,
        animation: false,
        onShow() {
            document.querySelector('#app').classList.add('hide');
        },
        onClose() {
            document.querySelector('#app').classList.remove('hide');
            document.body.scrollTop = scrollTop;
        },
    });
}
