/**
 * 矩阵变换计算
 * 参考: http://www.cnblogs.com/graphics/archive/2012/08/08/2609005.html
 * https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-matrices.html
 */
const M = {
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
            x / m[0], y / m[0], 0, 1
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

export default M;
