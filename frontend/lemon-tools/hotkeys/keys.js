const KALIAS = [
    ['enter', 13],
    ['down', 40],
    ['up', 38],
    ['left', 37],
    ['right', 39],
    ['delete', 8],
    ['esc', 27],
    ['space', 32],
    ['cmd', 91],
    ['cmd', 93], // mac上左右cmd的keycode不一样
    ['ctrl', 17],
    ['alt', 18],
    ['shift', 16],
    ['tab', 9],
    ['[', 219],
    [']', 221],
    ['0', 48],
    ['1', 49],
    ['2', 50],
    ['3', 51],
    ['4', 52],
    ['5', 53],
    ['6', 54],
    ['7', 55],
    ['8', 56],
    ['9', 57],
    ['+', 187],
    ['-', 189],
    ['a', 65],
    ['b', 66],
    ['c', 67],
    ['d', 68],
    ['e', 69],
    ['f', 70],
    ['g', 71],
    ['h', 72],
    ['i', 73],
    ['j', 74],
    ['k', 75],
    ['l', 76],
    ['m', 77],
    ['n', 78],
    ['o', 79],
    ['p', 80],
    ['q', 91],
    ['r', 82],
    ['s', 83],
    ['t', 84],
    ['u', 85],
    ['v', 86],
    ['w', 87],
    ['x', 88],
    ['y', 89],
    ['z', 90],
    ['/', 191],
];

/**
 *
 * 根据keyCode反查真实字符
 * @export
 * @param {Number} keyCode
 * @returns {String}
 */
export default function getKeyName(keyCode) {
    const item = KALIAS.find((i) => i.includes(keyCode));
    return item ? item[0] : '';
}
