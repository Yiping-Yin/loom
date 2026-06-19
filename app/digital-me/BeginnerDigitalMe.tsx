'use client';

import { ArrowUpRight } from 'lucide-react';
import { AskYiping } from '../../components/verified-dossier/AskYiping';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import styles from '../about/AboutClient.module.css';
import { BeginnerJourney } from './BeginnerJourney';

/**
 * Beginner-profile Digital Me view.
 *
 * Renders a clean digital card for the logged-in beginner: name, headline,
 * optional summary, links, and the AskYiping widget as the centrepiece. The
 * widget already reads localStorage and sends the stored beginner profile to
 * /api/ask, so answers are grounded in THIS person's content.
 *
 * Intentionally omits all Yiping-specific Role-OS richness: proof-path grid,
 * evidence graph, artifact runtime, QBook room — a beginner has none of these.
 *
 * AskYiping's suggested-question chips and input placeholder are overridden
 * here with generic prompts (suggestedQuestions + placeholder props) so the
 * visitor sees questions about this person, not Yiping's specific topics.
 * Answers remain grounded in the beginner's profile via the localStorage data
 * that /api/ask receives automatically.
 */
export function BeginnerDigitalMe({ profile }: { profile: BeginnerProfile }) {
  const { home, about } = profile;
  const displayName = home.name || 'Your name';

  return (
    <main className={styles.page} aria-labelledby="digital-me-title">
      <div className="loom-cosmic-field" aria-hidden="true" />
      <LoomGlobalNav activeHref="/digital-me" ariaLabel="Digital Me navigation" />

      <div className={styles.shell} style={{ maxWidth: '860px' }}>
        {/* Identity header */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingBottom: 'clamp(1.2rem, 2vw, 2rem)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <p
            style={{
              fontFamily:
                'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--signature-cyan)',
              margin: 0,
            }}
          >
            Digital Me
          </p>
          <h1
            id="digital-me-title"
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 600,
              lineHeight: 1.1,
              color: 'var(--text-1)',
              margin: 0,
            }}
          >
            {displayName}
          </h1>
          {home.headline && (
            <strong
              style={{
                fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                fontWeight: 500,
                color: 'var(--text-2)',
              }}
            >
              {home.headline}
            </strong>
          )}
          {about.summary && (
            <p
              style={{
                fontSize: 'clamp(0.82rem, 1.1vw, 0.95rem)',
                color: 'var(--text-3)',
                margin: 0,
                maxWidth: '52ch',
              }}
            >
              {about.summary}
            </p>
          )}
          {about.links.length > 0 && (
            <nav
              aria-label="Profile links"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem' }}
            >
              {about.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.8rem',
                    color: 'var(--signature-cyan)',
                    textDecoration: 'none',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.6rem',
                  }}
                >
                  <span>{link.label}</span>
                  <ArrowUpRight aria-hidden="true" size={12} strokeWidth={1.8} />
                </a>
              ))}
            </nav>
          )}
        </header>

        {/* Journey timeline — derived from education + experience + works.
            Rendered only when the profile has at least one entry in any section. */}
        <BeginnerJourney profile={profile} />

        {/* Ask widget — centrepiece: answers are grounded in the beginner's
            localStorage profile which /api/ask receives automatically.
            Generic chips/placeholder used so the visitor sees questions about
            the profile owner (whoever that is), not Yiping's specific topics. */}
        <AskYiping
          suggestedQuestions={[
            "What's their experience?",
            'What are they strongest at?',
            'What have they studied?',
            'Why work with them?',
          ]}
          placeholder="Ask me anything…"
        />
      </div>
    </main>
  );
}
