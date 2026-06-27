/* eslint-disable react/no-unescaped-entities */
/**
 * /help · Loom's usage guide.
 *
 * Explains the product loop — Sources, Studio, and Digital Me — and the support
 * surfaces around it.
 *
 * Access paths:
 *   - /help (direct URL)
 *   - Shuttle: ⌘K
 *   - KeyboardHelpOverlay footer: "/help" link
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpenCheck,
  CircleHelp,
  FileText,
  LockKeyhole,
  Map,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import styles from './HelpPage.module.css';

export const metadata = { title: 'Help · Loom' };

const LOOP_STEPS = [
  {
    label: '01',
    title: 'Bring material in.',
    copy: 'Add a local file or capture a page into Sources. Original files stay read-only.',
  },
  {
    label: '02',
    title: 'Resolve the context.',
    copy: 'Mark claims, quotes, examples, contradictions, gaps, and questions so the material can shape the next form.',
  },
  {
    label: '03',
    title: 'Shape it in Studio.',
    copy: 'Studio keeps attached references beside the block document so claims can point back to exact passages.',
  },
  {
    label: '04',
    title: 'Represent the result.',
    copy: 'Digital Me presents selected forms and source-backed claims as a living representation that can answer with citations.',
  },
];

const TROUBLESHOOTING = [
  {
    symptom: 'AI is unavailable',
    fix: 'Open Settings and check the preferred local AI runtime. Loom only uses AI when you ask.',
  },
  {
    symptom: "Can't find a feature",
    fix: 'Use the global search or keyboard help to jump by route, source title, or support page.',
  },
  {
    symptom: 'Removed a note and want it back',
    fix: 'Removal hides the note from view. History remains append-only, and exports keep the record.',
  },
];

export default function HelpPage() {
  return (
    <>
      <LoomGlobalNav ariaLabel="Help navigation" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Help</p>
              <h1 className={styles.title}>Usage guide.</h1>
              <p className={styles.lead}>
                Loom is a local context-to-form workspace. Sources resolve real material,
                Studio shapes it into cited forms, and Digital Me represents the parts
                you choose to stand behind.
              </p>
            </div>

            <nav className={styles.jumpPanel} aria-label="Primary help links">
              <JumpLink
                href="/sources"
                icon={<BookOpenCheck size={18} strokeWidth={1.65} />}
                title="Sources"
                copy="Resolve source material into claims, questions, and reusable evidence."
              />
              <JumpLink
                href="/studio"
                icon={<FileText size={18} strokeWidth={1.65} />}
                title="Studio"
                copy="Shape blocks, answers, process pages, and proof artifacts."
              />
              <JumpLink
                href="/digital-me"
                icon={<ShieldCheck size={18} strokeWidth={1.65} />}
                title="Digital Me"
                copy="Present selected source-backed forms as a living representation."
              />
              <JumpLink
                href="/about"
                icon={<Map size={18} strokeWidth={1.65} />}
                title="About"
                copy="See the source-backed identity layer behind this Loom."
              />
            </nav>
          </header>

          <section className={styles.loopPanel} aria-label="Loom core loop">
            {LOOP_STEPS.map((step) => (
              <article className={styles.loopStep} key={step.label}>
                <span className={styles.label}>{step.label}</span>
                <h2 className={styles.loopTitle}>{step.title}</h2>
                <p className={styles.loopCopy}>{step.copy}</p>
              </article>
            ))}
          </section>

          <section className={styles.workspaceGrid} aria-label="Loom workspaces">
            <WorkspaceCard
              href="/sources"
              title="Sources"
              meta="/sources"
              copy="Resolve source material into usable context. Web captures and local files sit on the same shelf, and originals stay read-only."
              items={[
                'Open a local file or captured page.',
                'Mark claims, quotes, examples, contradictions, gaps, and questions.',
                'Send resolved pieces into Studio when a form is ready.',
              ]}
            />
            <WorkspaceCard
              href="/studio"
              title="Studio"
              meta="/studio"
              copy="Shape a block document with your sources beside you. Marked passages attach as references, and citations point back to exact passages."
              items={[
                'Start from a blank form or an attached source.',
                'Insert references without losing provenance.',
                'Use Details only when the form needs structure, provenance, or publishing controls.',
              ]}
            />
            <WorkspaceCard
              href="/digital-me"
              title="Digital Me"
              meta="/digital-me"
              copy="Represent selected Studio forms and source-backed claims as a living identity surface that can answer with citations."
              items={[
                'Show only claims with real support.',
                'Keep thin profiles quiet until there is enough evidence.',
                'Let cited answers point back to the source and Studio form behind them.',
              ]}
            />
          </section>

          <InfoSection
            icon={<Search size={18} strokeWidth={1.65} />}
            title="Getting around"
            copy={
              <>
                Use the compact global navigation at the top of each page. Search opens
                Sources search directly; Menu keeps the primary identity and workspace
                routes in one place. Keyboard help is available with <Kbd>?</Kbd>.
              </>
            }
            items={[
              <>Home is the quiet start surface. It is not a feed.</>,
              <>Global search sends queries into <Link href="/sources">Sources</Link>.</>,
              <>Open keyboard help when route names or shortcuts are unclear.</>,
            ]}
          />

          <InfoSection
            icon={<Map size={18} strokeWidth={1.65} />}
            title="Support surfaces"
            copy="Support pages explain the product loop without becoming new workspaces."
            items={[
              <><Link href="/system">/system</Link> - how Sources, Studio, and Digital Me fit together.</>,
              <><Link href="/discipline">/discipline</Link> - the six product refusals.</>,
              <><Link href="/connections">/connections</Link> - correspondents and source links.</>,
            ]}
          />

          <InfoSection
            icon={<LockKeyhole size={18} strokeWidth={1.65} />}
            title="Where your data lives"
            copy="Loom is local-first. It should preserve the source layer instead of replacing it."
            items={[
              <>Notes and drafts live on this machine; nothing uploads on its own.</>,
              <>AI runs through local runtimes and only when you ask.</>,
              <>Original files are never modified; notes stay as a separate layer.</>,
              <>History is append-only: removals hide records from view without destroying them.</>,
            ]}
          />

          <section className={styles.troublePanel} aria-label="Troubleshooting">
            {TROUBLESHOOTING.map((item) => (
              <article className={styles.troubleItem} key={item.symptom}>
                <span className={styles.troubleIcon} aria-hidden="true">
                  <CircleHelp size={18} strokeWidth={1.65} />
                </span>
                <div>
                  <span className={styles.troubleLabel}>Troubleshooting</span>
                  <h2 className={styles.troubleTitle}>{item.symptom}</h2>
                  <p className={styles.troubleCopy}>{item.fix}</p>
                </div>
              </article>
            ))}
          </section>

          <section className={styles.northStar} aria-label="North star">
            <span className={styles.label}>North star</span>
            <h2 className={styles.northTitle}>Bring in, shape, represent.</h2>
            <p className={styles.northCopy}>
              Notes are a byproduct of learning, not the object of learning. Your job is
              to let source context become a form, then let the strongest forms represent you.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

// ── components ───────────────────────────────────────────────────────────

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

function JumpLink({
  href,
  icon,
  title,
  copy,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <Link className={styles.jumpLink} href={href}>
      <span className={styles.jumpIcon} aria-hidden="true">{icon}</span>
      <span>
        <span className={styles.jumpTitle}>{title}</span>
        <span className={styles.jumpCopy}>{copy}</span>
      </span>
      <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.75} />
    </Link>
  );
}

function WorkspaceCard({
  href,
  title,
  meta,
  copy,
  items,
}: {
  href: string;
  title: string;
  meta: string;
  copy: string;
  items: string[];
}) {
  return (
    <article className={styles.workspaceCard}>
      <header className={styles.cardHeader}>
        <div>
          <span className={styles.cardMeta}>{meta}</span>
          <h2 className={styles.cardTitle}>{title}</h2>
        </div>
        <Link className={styles.cardLink} href={href} aria-label={`Open ${title}`}>
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.75} />
        </Link>
      </header>
      <p className={styles.cardCopy}>{copy}</p>
      <ul className={styles.cardList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function InfoSection({
  icon,
  title,
  copy,
  items,
}: {
  icon: ReactNode;
  title: string;
  copy: ReactNode;
  items: ReactNode[];
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionIcon} aria-hidden="true">{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </header>
      <p className={styles.sectionCopy}>{copy}</p>
      <ul className={styles.sectionList}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
