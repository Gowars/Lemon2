import React, { Component } from 'react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: {},
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return {
            hasError: true,
            error,
        };
    }

    // componentDidCatch(error, errorInfo) {
    //     // You can also log the error to an error reporting service
    //     logErrorToMyService(error, errorInfo);
    // }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ background: 'antiquewhite', color: 'red', padding: '20px', borderRadius: 5 }}>
                    <h1>Oh! Something went wrong.</h1>
                    {this.state.error?.message}
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error?.stack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}
