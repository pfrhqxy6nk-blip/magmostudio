import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Something went wrong</h1>
          <p style={{ opacity: 0.75, marginTop: 12 }}>
            Open the browser console to see the error and refresh the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

