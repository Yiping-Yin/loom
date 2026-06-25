'use client';

import { useRef } from 'react';
import {
  weaveCourse,
  type FileRole,
  type RawFile,
  type SourceBoundary,
  type WovenProblemSet,
  type WovenWeek,
} from '../../lib/education/auto-weave';

const ROLE_LABEL: Record<FileRole, string> = {
  lecture: 'Lecture',
  exercises: 'Exercises',
  solutions: 'Solutions',
  assignment: 'Assignment',
  answer: 'Answer',
  explanation: 'Explanation',
  material: 'Material',
};

const BOUNDARY_LABEL: Record<SourceBoundary, string> = {
  official: 'official source',
  private: 'your work',
  ai: 'AI layer',
};

function rawFiles(list: FileList): RawFile[] {
  return Array.from(list).map((file) => ({
    name: file.name,
    path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || undefined,
  }));
}

function stem(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '');
}

function FileChips({ files }: { files: WovenWeek['files'] }) {
  return (
    <div className="edu-build__files">
      {files.map((file) => (
        <span className="edu-build__file" key={file.name}>
          <span className="edu-build__file-name">{stem(file.name)}</span>
          <span className="edu-build__role" data-role={file.role}>{ROLE_LABEL[file.role]}</span>
          {file.boundary ? (
            <span className="edu-build__boundary" data-boundary={file.boundary}>
              {BOUNDARY_LABEL[file.boundary]}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

/**
 * Drop a pile of course files (or a folder) and Loom weaves them into the evidence
 * chain — weeks + problem sets, each file roled and provenance-labelled — instantly.
 */
export function CourseAutoBuild({
  weeks,
  problemSets,
  onWeave,
}: {
  weeks: WovenWeek[];
  problemSets: WovenProblemSet[];
  onWeave: (weeks: WovenWeek[], problemSets: WovenProblemSet[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ingest = (files: RawFile[]) => {
    if (files.length === 0) return;
    const woven = weaveCourse(files);
    onWeave(woven.weeks, woven.problemSets);
  };

  const hasChain = weeks.length > 0 || problemSets.length > 0;

  return (
    <section className="edu-build" aria-label="Course materials">
      <div className="edu-build__head">
        <span className="edu-editor__label">Course materials</span>
        {hasChain ? (
          <button type="button" className="edu-build__reweave" onClick={() => inputRef.current?.click()}>
            Add more files
          </button>
        ) : null}
      </div>

      {!hasChain ? (
        <button
          type="button"
          className="edu-build__drop"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            event.currentTarget.dataset.over = 'true';
          }}
          onDragLeave={(event) => {
            event.currentTarget.dataset.over = 'false';
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.currentTarget.dataset.over = 'false';
            ingest(rawFiles(event.dataTransfer.files));
          }}
        >
          <span className="edu-build__drop-title">Drop your course files — or a whole folder</span>
          <span className="edu-build__drop-sub">
            Loom sorts them into weeks &amp; problem sets and labels the source of each.
          </span>
        </button>
      ) : (
        <div className="edu-build__chain">
          {weeks.length > 0 ? (
            <div className="edu-build__group">
              <h3 className="edu-build__group-title">
                Weeks <span>{weeks.length}</span>
              </h3>
              <ol className="edu-build__rows">
                {weeks.map((week) => (
                  <li className="edu-build__row" key={week.label}>
                    <span className="edu-build__marker">{week.label}</span>
                    <FileChips files={week.files} />
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {problemSets.length > 0 ? (
            <div className="edu-build__group">
              <h3 className="edu-build__group-title">
                Problem sets <span>{problemSets.length}</span>
              </h3>
              <ol className="edu-build__rows">
                {problemSets.map((set) => (
                  <li className="edu-build__row" key={set.label}>
                    <span className="edu-build__marker">{set.label}</span>
                    <FileChips files={set.files} />
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      )}

      <input
        ref={(el) => {
          inputRef.current = el;
          if (el) {
            // Non-standard folder-picker attributes, set imperatively (cross-browser).
            el.setAttribute('webkitdirectory', '');
            el.setAttribute('directory', '');
          }
        }}
        type="file"
        multiple
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          if (event.target.files) ingest(rawFiles(event.target.files));
          event.target.value = '';
        }}
      />
    </section>
  );
}
