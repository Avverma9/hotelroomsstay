import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Error boundary caught an exception:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ reset: this.handleReset })
          : this.props.fallback;
      }

      return (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
          <p className="text-sm text-gray-500 mt-2">A hotel card failed to load. Try again.</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
