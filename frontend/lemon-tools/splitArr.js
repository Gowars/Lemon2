/**
 *
 * @param {Array<any>} arr
 * @param {number} num
 */
export function splitArr(arr, num = 2) {
    if (!(num > 1)) return arr;
    const len = Math.ceil(arr.length / num);
    let start = 0;
    const newArr = [];
    while (start < len) {
        let index = 0;
        const item = [];
        while (index < num) {
            item.push(arr[(start * num + index) % arr.length]);
            index += 1;
        }
        newArr.push(item);
        start += 1;
    }
    return newArr;
}

// splitArr([1,2,3,4,5], 2)
