'use client';

import React from 'react';

/**
 * Component-level error boundary for the in-place Studio editor on /digital-me.
 *
 * The edit-mode render mounts <DraftClient /> directly; if it throws (e.g. a
 * corrupt persisted draft), the whole /digital-me route would white-screen.
 * This boundary catches that render error and shows a quiet fallback with a way
 * back to Digital Me, instead of taking the page down.
 *
 * Unlike app/global-error.tsx (a Next route boundary that renders its own
 * html/body and must survive a broken CSS load — hence its inline literals),
 * this sits inside an already-styled page, so it reuses design tokens via the
 * .editor-error-boundary CSS class. No hardcoded cyans here.
 */
export class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="editor-error-boundary" role="alert">
          <div className="loom-cosmic-field" aria-hidden />
          <p className="editor-error-boundary__title">Couldn&rsquo;t open this document</p>
          <a className="editor-error-boundary__back" href="/digital-me">
            &larr; Digital Me
          </a>
        </main>
      );
    }
    return this.props.children;
  }
}
