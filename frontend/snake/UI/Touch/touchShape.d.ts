export interface ITouchOption {
    /** 监听触摸点个数（手指个数） */
    finger?: number,
    /** touchend多长时间后强制重置状态，单位为ms */
    forceResetTime: number,
    /** 是否阻止默认事件 */
    preventDefault: boolean,
    /** 是否事件冒泡 */
    stopPropagation: false, // 是否冒泡
    /** 是否监听leave事件 */
    litenLeaveEvent: true, // 是否监听leave事件
    /** 是否忽略从屏幕左右边缘区域的滑动事件，因为可能和系统滑动事件冲突 */
    iosSystemSwipe: true,
    /** x/y轴权重 */
    XYWeight: 1,
    /** 忽略touch事件的元素 */
    ingoreTouchElement: 'ingoreTouchElement', // 忽略touch事件的元素
    /** 可滚动元素，会在滚动结束后触发滑动事件，以避免事件冲突 */
    canScrollElement: 'canScrollElement', // 可滚动元素
    /** addEventListener options 处理capture/passive等 */
    listenerOptions: {}, //
    /** 触摸过程中为$dom添加的class */
    activeClassName: '',
    /** 受影响的元素，会在其dom上添加activeClassName */
    effectElements: [], //
    /** 事件绑定到哪个dom上 */
    $eventDom: null,
    /** 默认忽略鼠标的【中键，右键】 */
    ignoreMouseType: [2, 3],
    /**
    // 对于pc端，在mouse事件触发完毕之后，总还会触发click事件
    // 对于移动端，如果preventDefault了touchstart事件，那么click事件则不会载触发
    // 在需要的时候可以指定dispatchClick，来触发移动端的click事件（没有触发touchmove）
    // 是否在没有move的情况下，触发元素的click事件
     */
    dispatchClick: false,
}
