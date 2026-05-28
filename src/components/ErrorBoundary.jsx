import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="loading" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
          <div style={{
            width: 64, height: 64,
            background: '#fff1f2',
            borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#e11d48',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
            Algo deu errado
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 400, textAlign: 'center' }}>
            Ocorreu um erro ao carregar o sistema.
            <br />Tente recarregar a página ou fazer login novamente.
          </span>
          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '0.5rem' }}
          >
            Voltar ao início
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => window.location.reload()}
            style={{ fontSize: '0.82rem' }}
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
