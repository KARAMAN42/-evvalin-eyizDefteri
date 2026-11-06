import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CircleAlert, RefreshCcw } from 'lucide-react';

interface State { hasError: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uygulama hatası', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--background)] p-5 text-center text-[var(--text)]">
        <div className="card max-w-md p-8">
          <CircleAlert size={42} className="mx-auto text-rose-600" />
          <h1 className="mt-4 text-xl font-black">Bir şeyler ters gitti</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Verilerin silinmedi. Sayfayı yenileyip tekrar deneyebilirsin.</p>
          <button type="button" className="btn-primary mx-auto mt-5" onClick={() => window.location.reload()}><RefreshCcw size={18} /> Sayfayı yenile</button>
        </div>
      </main>
    );
  }
}

