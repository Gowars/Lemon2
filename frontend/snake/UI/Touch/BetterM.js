/**
 * 矩阵变换计算
 * 参考: http://www.cnblogs.com/graphics/archive/2012/08/08/2609005.html
 * https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-matrices.html
 *
 * https://react-photo-view.vercel.app/docs/getting-started
 * https://github.com/DominicTobias/react-image-crop
 */

export const M = {
    // 矩阵 相乘计算
    mm(M1, M2, LEN = 4) {
        const m = [];
        for (let i = 0; i < LEN; i++) {
            for (let j = 0; j < LEN; j++) {
                let ele = 0;
                for (let z = 0; z < LEN; z++) {
                    ele += M1[i * LEN + z] * M2[j + LEN * z];
                }
                m.push(ele);
            }
        }
        return m.map((i) => +i.toFixed(4));
    },
    mms(...args) {
        return args.reduce((prev, current) => M.mm(current, prev));
    },
    // 旋转
    rotate(R, m) {
        // x轴旋转
        // const RM = [
        //     1, 0, 0, 0,
        //     0, Math.cos(R), Math.sin(R), 0,
        //     0, -Math.sin(R), Math.cos(R), 0,
        //     0, 0, 0, 1,
        // ]

        // y轴旋转
        // const RM = [
        //     Math.cos(R), 0, -Math.sin(R), 0,
        //     Math.sin(R), 0, Math.cos(R), 0,
        //     0, 0, 1, 0,
        //     0, 0, 0, 1,
        // ]

        // z轴旋转
        // prettier-ignore
        const RM = [
            Math.cos(R), -Math.sin(R), 0, 0,
            Math.sin(R), Math.cos(R), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];

        return M.mm(RM, m);
    },
    // 缩放
    scale(S, m) {
        // prettier-ignore
        const RM = [
            S, 0, 0, 0,
            0, S, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];

        return M.mm(RM, m);
    },
    // 位移
    translate(x, y, m) {
        // const newM = [...m]
        // newM[12] += x
        // newM[13] += y
        // return newM
        // prettier-ignore
        const RM = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, 0, 1
        ];
        return M.mm(RM, m);
    },
    // 缩放位移矫正
    trans(SCALE, current, origin, m) {
        // 在这里，我们设置transform-origin: 0 0;然后所有的计算以图片的左上角为基准，这样方便计算位置变换后的位移
        // 1. 计算出current中点相对于左上角的坐标
        // 2. 根据缩放比例，计算出中点坐标的相对位移
        // 3. 矩阵 -> 缩放后矩阵 -> 位移矫正
        const p = {
            x: (current.x + current.x1) / 2 - (origin.left + m[12]),
            y: (current.y + current.y1) / 2 - (origin.top + m[13]),
        };

        // 计算位移
        const newP = {
            x: -p.x * (SCALE - 1),
            y: -p.y * (SCALE - 1),
        };
        return M.translate(newP.x, newP.y, m);
    },
};

export class Transform {
    state = {
        scale: 1,
        rotate: 0,
        x: 0,
        y: 0,
    };

    constructor(m) {
        // prettier-ignore
        this.m = m || [
            // 初始状态
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]
    }

    snap() {
        return {
            ...this.state,
        };
    }

    reset() {
        this.state = {
            scale: 1,
            rotate: 0,
            x: 0,
            y: 0,
        };
    }

    toM() {
        const initM = this.m;
        const state = this.state;
        // const m = M.translate(state.x/state.scale, state.y/state.scale, M.rotate(state.rotate, M.scale(state.scale, initM)))
        // 先位移，再放在，再旋转
        const m = M.rotate(state.rotate, M.scale(state.scale, M.translate(state.x, state.y, initM)));
        return m;
    }

    toCss() {
        return `;transform: matrix3D(${this.toM().join(',')});`;
    }

    translate(x, y, snap) {
        if (snap) {
            this.state.x = x + snap.x;
            this.state.y = y + snap.y;
        } else {
            this.state.x += x;
            this.state.y += y;
        }
        return this.toM();
    }

    getTranslate() {
        return [this.state.x, this.state.y];
    }

    rotate(R, origin) {
        const baseR = this.state.rotate;
        this.state.rotate = baseR + R;
        this.fixRotate(origin, baseR, R);
        return this.toM();
    }

    fixRotate(origin, baseR, rotate) {
        // 在这里，我们设置transform-origin: 0 0;然后所有的计算以图片的左上角为基准，这样方便计算位置变换后的位移
        // 1. 计算出center中点相对于左上角的坐标
        // 2. 根据缩放比例，计算出中点坐标的相对位移
        // 3. 矩阵 -> 缩放后矩阵 -> 位移矫正
        const { x: TX, y: TY } = this.state;
        const p = {
            x: origin.width / 2 + origin.left - (origin.left + TX),
            y: origin.height / 2 + origin.top - (origin.top + TY),
        };

        const len = Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2));
        let ang = Math.atan(p.y / p.x) + rotate;
        if (baseR % (Math.PI * 2) >= Math.PI) {
            ang += Math.PI;
        }

        let X = Math.sin(ang) * len;
        let Y = Math.cos(ang) * len;

        // 因为每次修改都是90°，所以x,y的坐标需要交换
        [X, Y] = [Y, X];

        // 计算位移
        const newX = p.x - X;
        const newY = -(p.y - Y); // 为什么y要取负数呢？

        return this.translate(newY, newX);
    }

    scale(S, center, origin, snap) {
        if (snap) {
            this.state.scale = snap.scale * S;
            this.fixScale(center, origin, S - 1, snap);
        } else {
            this.state.scale *= S;
            // 根据变化的缩放比例进行位置校正
            this.fixScale(center, origin, S - 1);
        }
        return this.toM();
    }

    fixScale(center, origin, scale, snap) {
        // 在这里，我们设置transform-origin: 0 0;然后所有的计算以图片的左上角为基准，这样方便计算位置变换后的位移
        // 1. 计算出center中点相对于左上角的坐标
        // 2. 根据缩放比例，计算出中点坐标的相对位移
        // 3. 矩阵 -> 缩放后矩阵 -> 位移矫正
        const { x: TX, y: TY } = snap || this.state;
        const p = {
            x: (center.x + center.x1) / 2 - (origin.left + TX),
            y: (center.y + center.y1) / 2 - (origin.top + TY),
        };

        // 计算位移
        const newX = -p.x * scale;
        const newY = -p.y * scale;

        return this.translate(newX, newY, snap);
    }

    getScale() {
        return this.state.scale;
    }
}

/**
 * 始终相对左上角进行变换
 * 需要按照 scale rotate translate 的形式进行变换
 * 但当进行scale/rotate的时候期望是能够按照双指的中心位置进行
 *     本质上是需要在相对左上角的变换结束之后，进行位移矫正
 */
