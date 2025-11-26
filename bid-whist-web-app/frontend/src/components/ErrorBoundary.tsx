import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                    <div className="bg-red-900/20 border-2 border-red-500 rounded-2xl p-8 max-w-2xl w-full text-center">
                        {/* Cat Image */}
                        <div className="mb-6 flex justify-center">
                            <img
                                src="/error-cat.png"
                                alt="Oops! Cat knocked over the cards"
                                className="w-64 h-64 object-contain"
                            />
                        </div>

                        <h1 className="text-3xl font-bold text-red-500 mb-4">
                            🎴 Oops! Something went wrong
                        </h1>
                        <p className="text-white text-lg mb-4">
                            Looks like our cat knocked over the cards! The game encountered an unexpected error.
                        </p>
                        <p className="text-gray-300 text-base mb-6">
                            Please try refreshing the page to start fresh.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 bg-black/30 p-4 rounded-lg text-left">
                                <summary className="text-yellow-400 cursor-pointer font-semibold mb-2">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="text-red-400 text-sm overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all"
                        >
                            🔄 Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
