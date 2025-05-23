import React, { useRef } from 'react';
import { getProps } from '@/lemon-tools/getProps';
import { Uploader } from '@/lemon-tools/uploader';


const defaultProps = {
    /** 是否支持多文件上传 */
    multiple: false,
    /** 接受的文件格式 */
    accept: '*',
    uploadCore: null,
};

/**
 * @param {defaultProps} props
 * @returns
 */
export default function Upload(props) {
    const { accept, multiple, uploadCore } = getProps(props, defaultProps);
    const inputRef = useRef();

    const handleClick = () => {
        inputRef.current.click();
    };

    const handleChange = (event) => {
        new Uploader({ uploadCore }).
        uploadFiles(event.target.files, props);
    };

    return (
        <div>
            <input
                type="file"
                ref={inputRef}
                name="file"
                onChange={handleChange}
                accept={accept}
                multiple={multiple}
                className="hide"
            />
            <div onClick={handleClick}>{props.children}</div>
        </div>
    );
}
