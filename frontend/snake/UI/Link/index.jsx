import React, { Component } from 'react';
import { urlParse, addQuery } from '@/lemon-tools/url';

import Route from './Route';
import { getRouter } from '@/snake/mpa';
import { getProps } from '@/lemon-tools/getProps';
import { getVCBridge } from '@/src/component/getAppBridge';
import openBlank from '@/lemon-tools/openBlank';
import { getType, isEmpty } from '@/lemon-tools/checkType';
import os from '@/lemon-tools/os';

// 为class组件写props类型声明

const defaultProps = {
    disabled: false,
    data: {},
    animation: true,
    replace: false,
    activeClassName: '',
    className: '',
    style: {},
    // 支持参数对象，以便更好的书写业务逻辑
    query: {},
    // 是否在新标签页打开
    target: false,
    href: '',
    matchBefore: false,
};

/**
 * link导航
 * @extends {Component<defaultProps>}
 */
class Link extends Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    state = {
        active: false,
    };

    matchPrev = false;

    componentDidMount() {
        const { href } = this.mixProps;
        // 监听路由变化，以改变active
        this.listenHistoryChange = ({ url }) => {
            if (this.isUnmount) return;
            const { pathname } = urlParse(url);
            this.setState({
                active: this.matchPrev ? pathname.startsWith(href) : pathname === href,
            });
        };

        getRouter().watch('change', this.listenHistoryChange);
    }

    componentWillUnmount() {
        this.isUnmount = true;
        getRouter().off('change', this.listenHistoryChange);
    }

    push = (/** @type {KeyboardEvent} */ event) => {
        // 浏览器cmd + click，会有新开tab页的默认行为
        if (event.metaKey) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const location = urlParse(getRouter().current.url);
        const { data, disabled, animation, query, target } = this.mixProps;
        let { href } = this.mixProps;
        let { replace } = this.mixProps;

        // 阻止跳转
        if (disabled || !href) return;

        this.mixProps.onClick && this.mixProps.onClick(event);

        const { origin } = urlParse(href);
        if ((origin && origin !== location.origin) || target) {
            if (os.inApp) {
                getVCBridge().callNative({
                    type: 'appSearch',
                    url: href,
                });
                return;
            }
            openBlank(href);
            return;
        }

        if (!isEmpty(query)) {
            href = addQuery(href, query);
        }

        if (href == location.pathname) {
            console.log('路由相同，页面不跳转');
        } else {
            event.stopPropagation();
            if (getType(replace) === 'function') {
                replace = replace(href, location.pathname);
            }
            replace
                ? getRouter().replace(href, data)
                : getRouter().push(href, { animation, ...data, matchBefore: this.mixProps.matchBefore });
        }
    };

    render() {
        const { href, activeClassName, style = {}, className = '' } = this.mixProps;
        const { active } = this.state;

        return (
            <a
                href={href}
                onClick={this.push}
                style={style}
                referrerPolicy={this.mixProps.referrerPolicy ?? 'no-referrer'}
                rel={this.mixProps.rel ?? 'noreferrer'}
                className={[className, active && activeClassName].filter((i) => i).join(' ')}
                target={this.mixProps.target || null}
            >
                {this.mixProps.children}
            </a>
        );
    }
}

class IndexLink extends Link {
    matchPrev = true;
}

export { Link, IndexLink, Route };
