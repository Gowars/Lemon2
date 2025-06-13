/**
 * 向后匹配，直到callback返回true
 * @param {string} str
 * @param {number} start
 * @param {(now: string, next: string, prev: string) => boolean} callback
 * @returns
 */
function getUntil(str, start, callback) {
    let index = start;
    while (index < str.length) {
        if (callback(str[index], str[index + 1], str[index - 1])) {
            break;
        }
        index += 1;
    }
    return str.slice(start, index);
}

/**
 * 将tokens转化为attr对象
 * @param {*} tokens
 * @returns
 */
function toAttr(tokens) {
    let at = 0;
    let attr = {};
    while (at < tokens.length) {
        let item = tokens[at];
        // 合法的属性仅限以下三种情况，否则应当抛出异常
        // property space
        // property equal string
        // property end
        if (item.type === 'property') {
            const [eq, str] = [tokens[at + 1], tokens[at + 2]];
            if (!eq) {
                attr[item.token] = true;
                break;
            }

            if (eq.type === 'equal') {
                if (str) {
                    if (str.type === 'string') {
                        attr[item.token] = str.token.slice(1, -1);
                    }
                    at += 3;
                    continue;
                }
            }

            if (eq.type === 'space') {
                attr[item.token] = true;
                at += 2;
                continue;
            }
        }
        at += 1;
    }
    return attr;
}

/**
 * 解析html属性
 * @param {string} str
 */
export function parseAttr(str) {
    let index = 0;
    let tokens = [];
    let token = '';
    const push = (item) => {
        if (token) {
            tokens.push({ type: 'property', token });
            token = '';
        }
        if (item) {
            tokens.push(item);
            index += item.token.length;
        }
    };
    while (index < str.length) {
        let char = str[index];
        if (/\s/.test(char)) {
            // 直接match后面的所有空格字符
            const nextMatchStr =
                char +
                getUntil(str, index + 1, (now) => {
                    return !/\s/.test(now);
                });
            push({ type: 'space', token: nextMatchStr });
            continue;
        } else if (char === '=') {
            push({ type: 'equal', token: char });
            continue;
        } else if (char === '"') {
            // match一个正常的字符串
            const matched = getUntil(str, index + 1, (now, next, prev) => {
                // 处理转义字符
                if (prev === '\\') {
                    return false;
                }
                return now === '"';
            });
            if (matched) {
                const nextMatchStr = char + matched + '"';
                push({ type: 'string', token: nextMatchStr });
                continue;
            }
        }

        token += char;
        index += 1;
    }
    push();
    const attr = toAttr(tokens);
    // console.log(str, attr)
    return attr;
}

// console.log(parseAttr('avcA-dddd_fds="134" xxx'))
// console.log(parseAttr('avc="134\\"" xxx'))
