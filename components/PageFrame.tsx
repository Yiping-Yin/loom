'use client';
/**
 * PageFrame · canonical page shell for Loom's top-level routes.
 *
 * Every full-page surface (Today, Atlas, Coworks index, Patterns, Relations,
 * Category landing, etc.) should render through PageFrame so that header
 * hierarchy, breadcrumb positioning, width caps, and padding stay coherent.
 *
 * Slots:
 *   - `breadcrumb`   : small caption-style lineage. Rendered first.
 *   - `eyebrow`      : accent-colored label above the title.
 *   - `title`        : page H1. Large display type.
 *   - `description`  : secondary paragraph under the title.
 *   - `actions`      : right-aligned controls in the header row.
 *   - `children`     : page body.
 *
 * This is a UI primitive; it does NOT wrap StageShell. Callers still
 * compose: `<StageShell variant="archive"><PageFrame>…</PageFrame></StageShell>`.
 */

import type { ReactNode } from 'react';

export function PageFrame({
  breadcrumb,
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  breadcrumb?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="loom-page-frame"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          paddingBottom: 'var(--space-5)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {breadcrumb ? (
          <div
            className="t-caption2"
            style={{
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            {breadcrumb}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 'var(--space-5)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
            {eyebrow ? (
              <div
                className="loom-smallcaps"
                style={{
                  /* Evidence Desk eyebrow — small uppercase mono, wide
                     tracking, tertiary ink. Sits at the bottom of the
                     luminance hierarchy as a quiet section label. */
                  color: 'var(--text-3)',
                  fontFamily: 'var(--mono)',
                  fontWeight: 500,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                }}
              >
                {eyebrow}
              </div>
            ) : null}

            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--display)',
                fontSize: 'var(--fs-h1)',
                letterSpacing: '-0.025em',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: 1.05,
                color: 'var(--text-1)',
              }}
            >
              {title}
            </h1>

            {description ? (
              <div
                style={{
                  color: 'var(--text-2)',
                  fontSize: 'var(--fs-body-lg)',
                  lineHeight: 'var(--lh-relaxed)',
                  maxWidth: '42rem',
                }}
              >
                {description}
              </div>
            ) : null}
          </div>

          {actions ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
              {actions}
            </div>
          ) : null}
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {children}
      </div>
    </div>
  );
}

/**
 * BreadcrumbHome · standardized `Home › Current` breadcrumb. Most pages need
 * exactly this, so expose it as a named slot rather than making every caller
 * rebuild it.
 */
export function BreadcrumbHome({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {i > 0 ? <span aria-hidden style={{ opacity: 0.5 }}>›</span> : null}
            {item.href && !isLast ? (
              <a
                href={item.href}
                style={{
                  color: 'var(--gold)',
                  textDecoration: 'none',
                  fontSize: 'var(--fs-caption)',
                }}
              >
                {item.label}
              </a>
            ) : (
              <span style={{ color: isLast ? 'var(--text-2)' : 'var(--text-3)', fontSize: 'var(--fs-caption)' }}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}
