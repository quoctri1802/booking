import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Đã xảy ra lỗi không mong muốn.';
      let isFirebaseError = false;

      try {
        const parsed = JSON.parse(this.state.error?.message || '');
        if (parsed.error && parsed.operationType) {
          isFirebaseError = true;
          errorMessage = `Lỗi hệ thống: ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-rose-100">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Rất tiếc!</h2>
            <p className="text-slate-500 mb-8 font-medium">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100"
            >
              <RefreshCcw className="w-5 h-5" />
              <span>Tải lại trang</span>
            </button>
            {isFirebaseError && (
              <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Mã lỗi: FIREBASE_PERMISSION_DENIED
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
