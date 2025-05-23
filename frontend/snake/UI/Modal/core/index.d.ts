type AT = 'lr' | 'ud' | 'du' | 'uu' | 'dd' | 'll' | 'rr' | 'rl' | 'lr' | 'sb' | 'bb' | 'ss' | 'bs';

interface openOption {
    /**
     * 动画类型
     * @type {string}
     * @memberof openOption
     */
    animationType?: AT;
    /** 是否执行动画 */
    animation?: boolean;
    /** 动画长度 */
    animationTime?: number;
    /** 是否显示layer */
    layer?: boolean;
    /** 点击layer关闭弹窗 */
    layerClose?: boolean;
    /** 是否全屏 */
    fullScreen?: boolean;
    /** 弹窗层级 */
    zIndex?: number;
    /** 弹窗位置 */
    position?: string;
    onShow?: () => void;
    onClose?: () => void;
    /** 弹窗自动关闭时间，单位毫秒 */
    autoClose?: number;
    /** pc端esc关闭弹窗，默认为false */
    escClose?: boolean
}

function open(child: string | JSX.Element, option?: openOption);

function close();

function closeAll();

export { open, close, closeAll };

export default {
    open,
    close,
    closeAll,
};
