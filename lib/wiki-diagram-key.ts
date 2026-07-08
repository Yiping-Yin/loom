/**
 * Shared key normalization for pre-rendered wiki diagrams.
 *
 * MDX strips per-line leading indentation from multi-line template literals
 * in JSX attributes, so the chart string the Mermaid component receives at
 * runtime differs from the raw page.mdx source. Both the pre-render script
 * (map writer) and the component (map reader) key through THIS function so
 * they can never disagree.
 */
export function diagramKey(chart: string): string {
  return chart
    .split('\n')
    .map((line) => line.replace(/^[ \t]+/, ''))
    .join('\n')
    .trim();
}
