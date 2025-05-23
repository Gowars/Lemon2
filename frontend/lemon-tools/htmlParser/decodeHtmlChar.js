const maps = [
    ['&quot;', '"'],
    ['&apos;', "'"],
    ['&amp;', '&'],
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&nbsp;', ' '],
    ['&iexcl;', '¡'],
    ['&cent;', '¢'],
    ['&pound;', '£'],
    ['&curren;', '¤'],
    ['&yen;', '¥'],
    ['&brvbar;', '¦'],
    ['&sect;', '§'],
    ['&uml;', '¨'],
    ['&copy;', '©'],
    ['&ordf;', 'ª'],
    ['&laquo;', '«'],
    ['&not;', '¬'],
    ['&shy;', '­'],
    ['&reg;', '®'],
    ['&macr;', '¯'],
    ['&deg;', '°'],
    ['&plusmn;', '±'],
    ['&sup2;', '²'],
    ['&sup3;', '³'],
    ['&acute;', '´'],
    ['&micro;', 'µ'],
    ['&para;', '¶'],
    ['&middot;', '·'],
    ['&cedil;', '¸'],
    ['&sup1;', '¹'],
    ['&ordm;', 'º'],
    ['&raquo;', '»'],
    ['&frac14;', '¼'],
    ['&frac12;', '½'],
    ['&frac34;', '¾'],
    ['&iquest;', '¿'],
    ['&times;', '×'],
    ['&divide;', '÷'],
    ['&Agrave;', 'À'],
    ['&Aacute;', 'Á'],
    ['&Acirc;', 'Â'],
    ['&Atilde;', 'Ã'],
    ['&Auml;', 'Ä'],
    ['&Aring;', 'Å'],
    ['&AElig;', 'Æ'],
    ['&Ccedil;', 'Ç'],
    ['&Egrave;', 'È'],
    ['&Eacute;', 'É'],
    ['&Ecirc;', 'Ê'],
    ['&Euml;', 'Ë'],
    ['&Igrave;', 'Ì'],
    ['&Iacute;', 'Í'],
    ['&Icirc;', 'Î'],
    ['&Iuml;', 'Ï'],
    ['&ETH;', 'Ð'],
    ['&Ntilde;', 'Ñ'],
    ['&Ograve;', 'Ò'],
    ['&Oacute;', 'Ó'],
    ['&Ocirc;', 'Ô'],
    ['&Otilde;', 'Õ'],
    ['&Ouml;', 'Ö'],
    ['&Oslash;', 'Ø'],
    ['&Ugrave;', 'Ù'],
    ['&Uacute;', 'Ú'],
    ['&Ucirc;', 'Û'],
    ['&Uuml;', 'Ü'],
    ['&Yacute;', 'Ý'],
    ['&THORN;', 'Þ'],
    ['&szlig;', 'ß'],
    ['&agrave;', 'à'],
    ['&aacute;', 'á'],
    ['&acirc;', 'â'],
    ['&atilde;', 'ã'],
    ['&auml;', 'ä'],
    ['&aring;', 'å'],
    ['&aelig;', 'æ'],
    ['&ccedil;', 'ç'],
    ['&egrave;', 'è'],
    ['&eacute;', 'é'],
    ['&ecirc;', 'ê'],
    ['&euml;', 'ë'],
    ['&igrave;', 'ì'],
    ['&iacute;', 'í'],
    ['&icirc;', 'î'],
    ['&iuml;', 'ï'],
    ['&eth;', 'ð'],
    ['&ntilde;', 'ñ'],
    ['&ograve;', 'ò'],
    ['&oacute;', 'ó'],
    ['&ocirc;', 'ô'],
    ['&otilde;', 'õ'],
    ['&ouml;', 'ö'],
    ['&oslash;', 'ø'],
    ['&ugrave;', 'ù'],
    ['&uacute;', 'ú'],
    ['&ucirc;', 'û'],
    ['&uuml;', 'ü'],
    ['&yacute;', 'ý'],
    ['&thorn;', 'þ'],
    ['&yuml;', 'ÿ'],
];

/**
 *
## 背景
需要对`<span>&nbsp;&#x56E2;&#x961F;&#x7BA1;&#x7406;&#x4E0A;<span>`进行解码

字符串 | 解释
------|--------
`&#x56E2;` | 其编码后的格式是 【&#x + 16进制编码 + ;】可通过copy mac note上的内容获得
`&#123;` | 则是【&# + 16进制unicode编码 + ;】
`&nbsp;` | 是【& + alias + ;】alias文档参考 <https://www.html.am/reference/html-special-characters.cfm>

 js的String提供了两个静态方法用来进行解码
 - `String.fromCharCode` 解析unicode编码值，unicode编码有上线为0-65536
 - `String.fromCodePoint` 解析16进制编码值，此处应选择此方法解码

### 参考
- 浏览器提供了 DOMParser API来处理类似需求，但是不能处理经典的&nbsp;
- https://www.web2generators.com/html-based-tools/online-html-entities-encoder-and-decoder
- https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
- https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
- 开源解决方案 https://github.com/mdevils/html-entities/blob/master/src/index.ts
 */
function decodeAppleNoteChar(str) {
    return str
        .replace(/&#x([^;]+);?/g, ($0, $1) => String.fromCodePoint(parseInt($1, 16)))
        .replace(/&#(\d+);?/g, ($0, $1) => String.fromCharCode($1));
}

export function decodeHTMLChar(str) {
    str = decodeAppleNoteChar(str);
    // 还需要对一般意义上的html特殊字符进行解码
    maps.forEach((item) => {
        str = str.replace(new RegExp(`${item[0]}?`, 'g'), item[1]);
    });
    return str;
}
