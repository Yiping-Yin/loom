import Link from 'next/link';
import { ArrowUpRight, BookOpenCheck, LibraryBig, Orbit } from 'lucide-react';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { getWikiHomeSections } from '../../lib/wiki-home';
import styles from './LLMWikiPage.module.css';

export const metadata = { title: 'LLM Wiki · Loom' };

export default async function LLMWikiPage() {
  const sections = await getWikiHomeSections();
  const totalDocs = sections.reduce((sum, section) => sum + section.count, 0);

  return (
    <>
      <LoomGlobalNav activeHref="/sources" ariaLabel="LLM Wiki navigation" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div>
              <nav className={styles.breadcrumb} aria-label="Reference breadcrumb">
                <Link href="/sources">Sources</Link>
                <span aria-hidden="true">/</span>
                <span>LLM Wiki</span>
              </nav>
              <p className={styles.eyebrow}>Reference atlas</p>
              <h1 className={styles.title}>LLM Wiki</h1>
              <p className={styles.lead}>
                A read-only reference constellation beside your own Sources. Use it as
                stable curriculum material, not as a third workspace.
              </p>
            </div>

            <aside className={styles.summaryPanel} aria-label="LLM Wiki summary">
              <div className={styles.summaryRow}>
                <span className={styles.summaryIcon} aria-hidden="true">
                  <Orbit size={18} strokeWidth={1.65} />
                </span>
                <span>
                  <span className={styles.summaryValue}>{sections.length}</span>
                  <span className={styles.summaryLabel}>Sections</span>
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryIcon} aria-hidden="true">
                  <LibraryBig size={18} strokeWidth={1.65} />
                </span>
                <span>
                  <span className={styles.summaryValue}>{totalDocs}</span>
                  <span className={styles.summaryLabel}>Entries</span>
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryIcon} aria-hidden="true">
                  <BookOpenCheck size={18} strokeWidth={1.65} />
                </span>
                <span>
                  <span className={styles.summaryValue}>Read-only</span>
                  <span className={styles.summaryLabel}>Reference shelf</span>
                </span>
              </div>
            </aside>
          </header>

          <section className={styles.sectionGrid} aria-label="LLM Wiki sections">
            {sections.map((section, index) => (
              <article className={styles.sectionCard} key={section.label}>
                <header className={styles.sectionHeader}>
                  <span className={styles.sectionMeta}>
                    <span className={styles.sectionLabel}>{section.label}</span>
                    <span className={styles.sectionCount}>{section.count} entries</span>
                  </span>
                  <span className={styles.sectionNumber}>{String(index + 1).padStart(2, '0')}</span>
                </header>
                <ul className={styles.itemList}>
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link className={styles.itemLink} href={item.href}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.75} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <p className={styles.footerNote}>
            Built-in entries remain separate from your imported files. They can ground
            reading, source checks, and Draft references without changing the Sources /
            Draft product loop.
          </p>
        </div>
      </main>
    </>
  );
}
