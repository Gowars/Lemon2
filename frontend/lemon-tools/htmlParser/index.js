/* eslint-disable no-continue */
import { BLOCK_ELES } from './block';
import { decodeHTMLChar } from './decodeHtmlChar';
import { parseAttr } from './parseAttr';

const selfCloseTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];

class ParserForHTML {
    /**
     *
     * @param {string} str
     */
    constructor(str) {
        this.str = str;
        this.buffer = '';
        this.index = 0;
        this.root = {
            children: [],
            end: true,
            attr: '',
        };
        this.currentNode = this.root;
        this.loop();
    }

    nodeStack = [];

    getNode(tag = '', isSelfClose) {
        const [tagName] = tag.match(/[A-z][A-z0-9:]*/) || ['fragment'];
        const node = {
            tagName,
            attr: parseAttr(tag.slice(tagName.length + 1, isSelfClose ? -2 : -1)),
            children: [],
            value: '',
            raw: '',
            parent: this.currentNode,
            end: false,
            isSelfClose,
        };
        this.push(node);

        if (selfCloseTags.includes(tagName)) {
            node.end = true;
            delete node.children;
            return node;
        }

        if (['script', 'style'].includes(tagName)) {
            node.noChildren = tagName;
        }

        this.currentNode = node;
        return node;
    }

    push(node) {
        const { children } = this.currentNode;
        const lastItem = children[children.length - 1];
        if (typeof lastItem === 'string' && typeof node === 'string') {
            children[children.length - 1] += node;
        } else {
            children.push(node);
        }
    }

    /**
     * @return {Array<string>}
     */
    getToken(len = 1) {
        if (len === 1) {
            return [this.str[this.index], this.str[this.index] + (this.str[this.index + 1] || '')];
        }
        return [this.str.slice(this.index, this.index + len)];
    }

    checkIsEndTag(token2) {
        if (token2 === '</') {
            const lookAfter = this.str.slice(this.index, this.index + 2 + 100);
            const [, endTagName] = lookAfter.match(/^<\/([A-z][A-z0-9-_]*)\s*>/) || [];
            if (this.currentNode.tagName === endTagName) {
                return true;
            }
        }
        return false;
    }

    loop() {
        while (this.index < this.str.length) {
            // eslint-disable-next-line prefer-const
            let [token, token2] = this.getToken();

            if (this.buffer === '' && token == '\n') {
                this.index += 1;
                continue;
            }

            if (!this.currentNode.noChildren) {
                //   处理html注释语句
                if (token2 === '<!') {
                    const [commentStartToken, commentEndToken] = ['<!--', '-->'];
                    const isCommentStart = this.getToken(4)[0] === commentStartToken;
                    // 处理文档声明标签
                    // <!DOCTYPE html>
                    const result = this.str.slice(this.index, 100).match(/^<!DOCTYPE[^>]+>/);
                    if (result) {
                        this.index += result[0].length;
                        continue;
                    }
                    if (isCommentStart) {
                        const commentEndIndex = this.str
                            .slice(this.index + commentStartToken.length)
                            .indexOf(commentEndToken);
                        if (commentEndIndex > -1) {
                            this.index += +commentStartToken.length + commentEndIndex + commentEndToken.length;
                        } else {
                            this.index = this.str.length;
                        }
                        continue;
                    }
                }
            }

            // 对于style和script的特殊处理，因为其内部皆为文本，所以直接匹配到closeTag即可
            if (this.currentNode.noChildren && !this.maybeEnd && !this.checkIsEndTag(token2)) {
                // 直接去查询下一个闭合标签的开始</
                const nextIndex = this.str.slice(this.index, 100).indexOf('</');
                if (nextIndex > 0) {
                    this.buffer += this.str.slice(this.index, this.index + nextIndex);
                    this.index += nextIndex;
                } else {
                    this.buffer += token2;
                    this.index += token2.length;
                }
                continue;
            }

            // 判断其是否是闭合标签
            if (this.checkIsEndTag(token2)) {
                this.maybeOpen = false;
                // 闭合标签和开始标签必须相同
                if (!this.currentNode.end) {
                    this.maybeEnd = true;
                    this.push(this.buffer);
                    this.buffer = '';
                    this.maybeEndInex = this.index;
                }
                token = token2;
            } else if (token === '<' && /<[A-z]/.test(token2)) {
                // 需要满足< <a-z
                this.push(this.buffer);
                this.buffer = '';
                this.maybeOpen = true;
            }

            if (token2 === '/>' && this.maybeOpen) {
                token = token2;
                this.maybeOpen = false;
                this.buffer += token;
                const node = this.getNode(this.buffer, true);
                node.startIndex = this.index - this.buffer.length;
                if (!node.end) {
                    this.currentNode.end = true;
                    this.currentNode = this.currentNode.parent;
                }

                this.buffer = '';
                this.index += token.length;
                continue;
            }

            if (token === '>') {
                if (this.maybeOpen) {
                    this.maybeOpen = false;
                    // 如果父节点是script/style之类的节点，那么要求此处必须要是闭合标签
                    this.buffer += token;
                    const node = this.getNode(this.buffer);
                    node.startIndex = this.index - this.buffer.length;
                    this.buffer = '';
                    this.index += token.length;
                    continue;
                } else if (this.maybeEnd) {
                    this.maybeEnd = false;
                    this.buffer += token;
                    this.index += token.length;
                    this.currentNode.end = true;
                    this.currentNode.endIndex = this.index;
                    this.currentNode.endName = this.buffer;
                    this.buffer = '';
                    this.currentNode = this.currentNode.parent;
                    continue;
                }
            }

            this.buffer += token;
            this.index += token.length;
        }
        this.buffer && this.push(this.buffer);
        this.buffer = '';
    }

    toMarkdown() {
        let str = '';
        const next = (node) => {
            if (typeof node === 'string') {
                // 解码比较耗费性能，应该是一个可选项
                str += decodeHTMLChar(node);
                return;
            }
            // 忽略不渲染文本元素
            if (
                ['style', 'script', 'meta', 'title', 'video', 'audio', 'textarea', 'head', 'comment', 'link'].includes(
                    node.tagName
                )
            ) {
                return;
            }

            if (BLOCK_ELES.includes(node.tagName)) {
                str += '\n';
            } else if (node.tagName === 'img') {
                str += `![图片](${node.attr.match(/src="([^"]+)"/)[1]})`;
            }

            node.children && node.children.forEach(next);
        };

        next(this.root);
        return str;
    }
}

export function parseHTML(str) {
    return new ParserForHTML(str);
}
