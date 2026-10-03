import { ResumeDocument } from '../components/preview/ResumeDocument';
import { continuationHeadings, extractPreviewRegions, extractSectionHeights, type PreviewRegion } from '../lib/previewTargets';
import type { ResumeData, ResumeTheme, SectionId } from '../types/resume';

// One pipeline for preview, PDF export and verification. Measure whole sections
// on a tall page at their real column widths before deciding which can stay
// together on A4. Sections taller than A4 retain normal text pagination.
export async function renderResume<Output>(data: ResumeData, theme: ResumeTheme, render: (document: ReturnType<typeof ResumeDocument>) => Promise<Output>) {
  let sectionHeights: Partial<Record<SectionId, number>> = {};
  if (theme.keepSectionsTogether) await render(ResumeDocument({ data, theme, measureOnly: true, onRender: result => { sectionHeights = extractSectionHeights(result); } }));
  let regions: PreviewRegion[] = [];
  const capture = (result: unknown) => { regions = extractPreviewRegions(result); };
  let output = await render(ResumeDocument({ data, theme, sectionHeights, onRender: capture }));
  if (regions.some(region => region.page > 1)) {
    const continuations = continuationHeadings(regions, theme);
    const sidebarPages = [...new Set(regions.filter(region => region.column === 'sidebar').map(region => region.page))];
    output = await render(ResumeDocument({ data, theme, sectionHeights, continuations, sidebarPages, onRender: capture }));
  }
  return { output, regions, sectionHeights };
}
