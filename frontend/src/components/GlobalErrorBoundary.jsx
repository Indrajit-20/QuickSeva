import React from "react";

/**
 * Global ErrorBoundary — catches any React render error in child components
 * and shows a graceful recovery UI instead of a blank/crashed page.
 *
 * Wraps the entire app in App.jsx to guarantee no white screen ever appears.
 */
export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("💥 GlobalErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 28,
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 8px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                margin: "0 0 24px",
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              An unexpected error occurred. This won't affect your data — please try again.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={this.handleRetry}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                }}
              >
                Reload Page
              </button>
            </div>

            {/* Technical detail (collapsed) */}
            {this.state.error && (
              <details
                style={{
                  marginTop: 20,
                  textAlign: "left",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  padding: "8px 12px",
                }}
              >
                <summary
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  Technical details
                </summary>
                <pre
                  style={{
                    fontSize: 10,
                    color: "#dc2626",
                    marginTop: 8,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 120,
                    overflow: "auto",
                  }}
                >
                  {this.state.error?.message || String(this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
