import createMDX from '@next/mdx';

// Next 16 builds/serves with Turbopack by default, which requires the MDX loader
// options to be SERIALIZABLE — so remark/rehype plugins must be referenced by
// STRING package name (Next resolves them), not as imported function refs, and
// no functions may appear in plugin options. This also retires the old
// webpack-era `getHighlighter` workaround (a function that forced Shiki's pure-JS
// engine to dodge a next-swc/webpack WASM-Oniguruma cold-build deadlock):
// Turbopack doesn't run webpack, so that deadlock no longer applies.
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm', 'remark-math'],
    rehypePlugins: [
      'rehype-slug',
      'rehype-katex',
      ['rehype-pretty-code', { theme: { dark: 'github-dark', light: 'github-light' }, keepBackground: false }],
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  distDir: process.env.LOOM_DIST_DIR || '.next',
  output:
    process.env.LOOM_NEXT_OUTPUT === 'standalone' ? 'standalone'
    : process.env.LOOM_NEXT_OUTPUT === 'export' ? 'export'
    : undefined,
  // The default dev indicator floats over the bottom-left corner and obscures
  // mobile previews of Loom's reading surfaces.
  devIndicators: false,
  // The in-app browser uses 127.0.0.1 while the dev server listens on
  // 0.0.0.0, so allow that local origin for Next internal assets.
  allowedDevOrigins: ['127.0.0.1'],
  // Static export writes image bitmaps via an optimizer that requires
  // a runtime. Disable so the export mode works with untouched image tags.
  images: process.env.LOOM_NEXT_OUTPUT === 'export' ? { unoptimized: true } : undefined,
  // We run `tsc --noEmit` independently before every ship. Next.js repeats
  // the same TypeScript program walk during `next build`, which on this
  // codebase takes 10+ minutes for no additional information. Skip it.
  typescript: { ignoreBuildErrors: true },
  // (Next 16 removed the `eslint` config key — `next lint` is gone and ESLint
  // runs standalone now, so the old `eslint: { ignoreDuringBuilds: true }` is
  // dropped; keeping it makes Next 16 crash on an undefined `.map`.)
  // Use an in-memory webpack cache instead of the default filesystem cache.
  // On this machine Spotlight / TimeMachine occasionally vanish `.pack_`
  // temp files before webpack can rename them, causing ENOENT and a 15-min
  // stall. Memory cache is rebuilt every run — cost is a slower cold build,
  // but at least it completes deterministically.
  webpack: (config) => {
    config.cache = { type: 'memory' };
    return config;
  },
};

export default withMDX(nextConfig);
