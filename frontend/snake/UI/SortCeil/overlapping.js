/**
 * 获取重叠面积
 * @param {{ xMin: number, xMax: number, yMin: number, yMax: number }} info1
 * @param {{ xMin: number, xMax: number, yMin: number, yMax: number }} info2
 * @returns {number}
 */
export function getOverlappingArea(info1, info2) {
    const xMin = Math.max(info1.xMin, info2.xMin);
    const yMin = Math.max(info1.yMin, info2.yMin);
    const xMax = Math.min(info1.xMax, info2.xMax);
    const yMax = Math.min(info1.yMax, info2.yMax);

    return Math.max(xMax - xMin, 0) * Math.max(yMax - yMin, 0);
}

export function getOverlappingAreaByPos(pos1, pos2) {
    return getOverlappingArea(
        ...[pos1, pos2].map((i) => {
            return {
                xMin: i.x,
                xMax: i.x + i.width,
                yMin: i.y,
                yMax: i.y + i.height,
            };
        })
    );
}
