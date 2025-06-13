import React, { PureComponent } from 'react';
import { getRouter } from '@/snake/mpa';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    path: '*',
    component: null,
};

// 这里面还牵扯一个问题就是，页面切换后，路由何以自处
/**
 * link导航
 * @extends {PureComponent<defaultProps>}
 */
export default class Route extends PureComponent {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    state = {
        currentPath: window.location.pathname,
    };

    componentDidMount() {
        getRouter().on(this.historyChangeListener);
    }

    componentWillUnmount() {
        getRouter().off(this.historyChangeListener);
    }

    historyChangeListener = ({ url }) => {
        this.setState({
            currentPath: url,
        });
    };

    render() {
        const { path, component: Comp, ...otherProps } = this.mixProps;
        if (path && Comp) {
            const result = getRouter().match(this.state.currentPath, {
                [path]: 1,
            });
            if (result) {
                return <Comp {...result} {...otherProps} />;
            }
        }
        return null;
    }
}

// // 接管当前页面内的路由变化，如果路由是由他引起的，就不会
// <Router path="/hah/**">
//     <div>
//         <Route path="/xx/:id" Component={xx}></Route>
//         <Route path="/xx/dd/:id" Component={xx}></Route>
//     </div>
// </Router>

// class Router extends PureComponent {

//     render() {
//         return this.props.children
//     }
// }
