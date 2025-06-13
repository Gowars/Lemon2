/**
 * template 字符串模板增强版
 * 类似于php的view模板
 * 可通过template.config自定义分隔符
 * <% %> 逻辑包裹
 * <%= %> 值输出
 * 实例:
 *  <% if (a > b) { %>
 *      你好<%= a %>
 *  <% } %>
 *  输出:
 *  var _sss = ''
 *  if (a > b) {
 *     _sss += '你好'
 *     _sss += a
 *  }
 */

let REG_START = '<%';
let REG_END = '%>';
let ECHO = '=';

const reg = {
    // 匹配开始
    start() {
        return new RegExp(`^${REG_START}${ECHO}?`);
    },
    // 匹配输出开始
    echoStart() {
        return new RegExp(`^${REG_START}${ECHO}`);
    },
    // 匹配输出
    echo() {
        return new RegExp(`${REG_START}${ECHO}(((?!(${REG_END})).|\\s)*)${REG_END}`);
    },
    // 匹配逻辑开始
    logicStart() {
        return new RegExp(`^${REG_START}`);
    },
    // 匹配逻辑
    logic() {
        return new RegExp(`${REG_START}(((?!(${REG_END})).|\\s)*)${REG_END}`);
    },
};

// 随机字符串
function uuid(length = 8) {
    const keys = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_';
    return `_${Array.from({ length })
        .map(() => keys[Math.round((keys.length - 1) * Math.random())])
        .join('')}`;
}

/**
 * [template 类php字符串模板]
 * @param  {String} [str='']  [模板字符串]
 * @param  {Object} [data={}] [结构注入字符换模板，或者说是字符串模板的作用域]
 * @return {String}           [返回html字符串]
 */
function template(str = '', data = {}) {
    const VAR = uuid(); // 变量名是一个随机字符串避免与变量同名
    let body = `var ${VAR} = "";\n`;
    let pStr = str;
    let index = 0;

    const addBody = (end) => {
        body += end;
    };
    const replace = (s) => s.replace(/'/g, "\\'");

    function next() {
        // 解析完毕
        if (index >= str.length) return;

        let char = str[index];
        let s = '';

        // 直到遇到开始符，否则都是字符串
        while (!reg.start().test(pStr) && index < str.length) {
            // 处理换行符
            if (char === '\n') {
                addBody(`\n ${VAR} += '${replace(s)}\\n';\n`);
                s = '';
            } else {
                s += char;
            }
            index += 1;
            pStr = pStr.slice(1);
            char = str[index];
        }

        if (s) {
            addBody(`\n ${VAR} += '${replace(s)}';\n`);
        }

        // 处理输出
        if (reg.echoStart().test(pStr)) {
            const match = pStr.match(reg.echo());
            addBody(`\n ${VAR} += ${match[1]};\n`);
            index += match[0].length;
            pStr = pStr.slice(match[0].length);
            next();
            return;
        }

        // 处理逻辑
        if (reg.logicStart().test(pStr)) {
            const match = pStr.match(reg.logic());
            addBody(`\n ${match[1]};\n`);
            index += match[0].length;
            pStr = pStr.slice(match[0].length);
            next();
            return;
        }
        next();
    }

    next();

    addBody(`\n return ${VAR}`);

    const keys = Object.keys(data); // 获取所有的key
    const args = keys.map((key) => data[key]); // 获取对应的value
    return new Function(...keys, body)(...args); // 获取所有的key，然后把其值作为传递，完美
}

/**
 * 替换分隔符号
 */
template.config = function ({ start = REG_START, end = REG_END, echo = ECHO } = {}) {
    REG_START = start;
    REG_END = end;
    ECHO = echo;
};

export default template;

// var a = `
//     <div>
//         <a href="{{= a.name }}/a/sss">啦啦啦</a>
//         {{
//             list.forEach(function(item){
//
//         }}
//             <h1>{{= item.title }}</h1>
//             <li> {{= item.name }} {{= item.title }}</li>
//         {{ }) }}
//     </div>
// `
// template.config({start: '\\{\\{', end: '\\}\\}', echo: '='})
//
// document.body.innerHTML =
//     template(a, {
//         a: {
//             name: 33,
//         },
//         list: [
//             {name: 11, title: '333'},
//             {name: 11, title: '333'},
//             {name: 11, title: '333'},
//             {name: 11, title: '333'},
//         ]
//     })
