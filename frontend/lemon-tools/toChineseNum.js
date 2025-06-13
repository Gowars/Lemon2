/**
 * 把number类型数字转换为中文数字
 * @param {number} num
 * @returns
 */
function toChineseNum(num) {
    const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const zero = chars[0];
    const littlePers = ['十', '百', '千'];
    const bigPers = ['', '万', '亿', '兆'];
    const list = ('' + num).trim().split('').reverse(); // 从个位数进行排列

    // 避免出现类似十零这样的情况
    const removeEndZero = (result) => {
        if (result.length > 1 && result.slice(-1) === zero) {
            return result.slice(0, -1);
        }
        return result;
    };

    // 对数组按照一定长度进行分割
    const split = (arr, len) => {
        let i = 0;
        let newArr = [];
        let newItem = [];
        while (i < arr.length) {
            newItem.push(arr[i]);
            if (newItem.length >= len) {
                newArr.push(newItem);
                newItem = [];
            }
            i += 1;
        }

        if (newItem.length) {
            newArr.push(newItem);
        }
        return newArr;
    };

    // 按照4位数进行分割
    return removeEndZero(
        split(list, 4)
            .map((nodes, perIndex) => {
                let result = '';
                nodes
                    .map((current, index, eles) => {
                        // 0返回0
                        if (current == 0) {
                            return chars[0];
                        }

                        // 个位数不加单位
                        if (index == 0) {
                            return chars[current];
                        }

                        // 对10-19进行特殊处理
                        if (index === 1 && eles.length === 2 && current == 1) {
                            return '十';
                        }

                        return chars[current] + littlePers[index - 1];
                    })
                    .reverse()
                    .forEach((item) => {
                        // 对连续的0进行合并
                        if (result.slice(-1) === zero && item === zero) {
                            return;
                        }
                        result += item;
                    });

                // 移除最后的0，并添加单位
                return removeEndZero(result) + bigPers[perIndex];
            })
            .reverse()
            .join('')
    );
}

console.log([
    toChineseNum(0),
    toChineseNum(8),
    toChineseNum(10),
    toChineseNum(11),
    toChineseNum(20),
    toChineseNum(99),
    toChineseNum(21),
    toChineseNum(100),
    toChineseNum(999),
    toChineseNum(1000),
    toChineseNum(1010),
    toChineseNum(9999),
    toChineseNum(99999),
    toChineseNum(90000),
    toChineseNum(190009999),
    toChineseNum(909009999),
]);
