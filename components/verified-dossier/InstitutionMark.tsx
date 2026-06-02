export type InstitutionMarkKind = 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';

const INSTITUTION_MARKS: Record<InstitutionMarkKind, { label: string; text: string }> = {
  about: { label: 'About', text: 'AB' },
  unsw: { label: 'UNSW Sydney', text: 'UNSW' },
  quantnet: { label: 'QuantNet', text: 'QN' },
  wqu: { label: 'WorldQuant University', text: 'WQU' },
  claude: { label: 'Claude', text: 'Claude' },
};

export type InstitutionMarkProps = {
  kind: InstitutionMarkKind;
};

export function InstitutionMark({ kind }: InstitutionMarkProps) {
  const mark = INSTITUTION_MARKS[kind];

  return (
    <span className={`vd-institution-mark vd-institution-mark--${kind}`} aria-label={mark.label}>
      {mark.text}
    </span>
  );
}
