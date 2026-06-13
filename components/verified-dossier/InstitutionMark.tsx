import React from 'react';

export type InstitutionMarkKind = 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';

const INSTITUTION_MARKS: Record<InstitutionMarkKind, { label: string; imageSrc: string }> = {
  about: { label: 'About', imageSrc: '/profile/yiping-profile-white-shirt.png' },
  unsw: { label: 'UNSW Sydney', imageSrc: '/brand/unsw/unsw-crest.png' },
  quantnet: { label: 'QuantNet', imageSrc: '/brand/quantnet/quantnet-icon.png' },
  wqu: { label: 'WorldQuant University', imageSrc: '/brand/wqu/wqu-icon.png' },
  claude: { label: 'Claude', imageSrc: '/brand/claude/claude-icon.png' },
};

export type InstitutionMarkProps = {
  kind: InstitutionMarkKind;
};

export function InstitutionMark({ kind }: InstitutionMarkProps) {
  const mark = INSTITUTION_MARKS[kind];

  return (
    <span className={`vd-institution-mark vd-institution-mark--${kind}`} aria-label={mark.label}>
      <img src={mark.imageSrc} alt="" draggable={false} />
    </span>
  );
}
