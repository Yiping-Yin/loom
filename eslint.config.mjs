import next from 'eslint-config-next';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next*/**',
      '.next-export/**',
      'out/**',
      'public/**',
      'archive/**',
      'captures/**',
      'knowledge/**',
      'tmp/**',
      'macos-app/**',
      'supabase/**',
      'docs/**',
      'resources/**',
      '.codex/**',
    ],
  },
  ...next,
  {
    // React Compiler-era hooks rules arrived with Next 16's config and
    // flag ~145 long-standing patterns across the legacy surfaces.
    // Stage 0 (governance floor) is zero-product-change: keep them
    // visible as warnings; they get fixed per-surface during the
    // workbench rebuild (framework Stages 2-3), not in bulk here.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/globals': 'warn',
    },
  },
];
