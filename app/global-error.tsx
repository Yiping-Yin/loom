'use client';

/**
 * global-error.tsx renders its OWN html/body and must survive a broken
 * CSS load. Core token values are inlined so dark bg + cyan accent hold
 * even when globals.css fails to load. Keep it cool-black + signature cyan.
 */
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#030404',
          color: '#e8ecee',
          fontFamily: 'Georgia, "Times New Roman", serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: '#e8ecee',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '0.94rem',
            color: 'rgba(232, 236, 238, 0.58)',
          }}
        >
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.56rem 1.4rem',
            borderRadius: '999px',
            border: '1px solid #4bc5de',
            background: 'transparent',
            color: '#4bc5de',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '0.88rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            outline: 'none',
            transition: 'background 0.18s ease, color 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(75, 197, 222, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px #4bc5de';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
