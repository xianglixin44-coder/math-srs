import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="glass-card p-8 text-center space-y-4 m-6">
          <p className="text-lg text-red-700">⚠️ 页面出错了</p>
          <p className="text-sm text-gray-600">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-400 rounded-lg text-sm transition-colors"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
