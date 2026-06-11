import createMDX from '@next/mdx';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import { createHighlighter, createJavaScriptRegexEngine } from 'shiki';

// Shiki's default WASM Oniguruma engine deadlocks next-swc during a cold
// production build on this toolchain — the build hangs at 0% CPU compiling
// `node_modules/vscode-oniguruma`. Shiki's pure-JS regex engine produces the
// same highlighting without loading any WASM, so the cold build completes.
// Created once and reused across all MDX files.
const shikiJsEngine = createJavaScriptRegexEngine();

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      rehypeKatex,
      [
        rehypePrettyCode,
        {
          theme: { dark: 'github-dark', light: 'github-light' },
          keepBackground: false,
          // Use Shiki's JS regex engine (no WASM) — see shikiJsEngine above.
          getHighlighter: (options) =>
            createHighlighter({ ...options, engine: shikiJsEngine }),
        },
      ],
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
  eslint: { ignoreDuringBuilds: true },
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
