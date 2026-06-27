'use client';

import { useSearchParams } from 'next/navigation';
import { DraftClient } from '../draft/DraftClient';
import { EditorErrorBoundary } from '../digital-me/EditorErrorBoundary';

export function StudioGate() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('d') || 'new';

  return (
    <EditorErrorBoundary>
      <DraftClient
        editId={editId}
        initialDraftTypeId={searchParams.get('draftType') ?? undefined}
      />
    </EditorErrorBoundary>
  );
}
