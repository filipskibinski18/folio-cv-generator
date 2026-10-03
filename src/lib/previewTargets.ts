import type { SectionId, ResumeTheme } from '../types/resume';

export interface EditorTarget {
  section: SectionId | 'personal';
  itemId?: string;
  mode?: 'layout' | 'photo';
}
export interface PreviewRegion {
  column?: 'main' | 'sidebar';
  target: EditorTarget;
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
}
export const editTarget = (section: EditorTarget['section'], itemId?: string, mode?: EditorTarget['mode']) => JSON.stringify({ section, itemId, mode });

export interface Continuation { page: number; left: number; width: number; title: string }
export function continuationHeadings(regions: PreviewRegion[], theme: ResumeTheme): Continuation[] {
  const result: Continuation[] = [];
  const pages = [...new Set(regions.map(region => region.page))].filter(page => page > 1);
  for (const page of pages) for (const column of theme.layout === 'single' ? ['main'] : ['main', 'sidebar']) {
    const onPage = regions.filter(region => region.page === page && region.target.section !== 'personal' && (theme.layout === 'single' || theme.sections.find(s => s.id === region.target.section)?.column === column)).sort((a, b) => a.top - b.top);
    const first = onPage[0];
    if (!first || first.target.mode === 'layout' || !regions.some(previous => previous.page < page && previous.target.section === first.target.section)) continue;
    const title = theme.sections.find(s => s.id === first.target.section)?.title;
    if (title) result.push({ page, left: first.left, width: first.width, title });
  }
  return result;
}

interface LayoutNode {
  box?: { left: number; top: number; width: number; height: number };
  props?: { 'data-edit'?: string; 'data-column'?: 'main' | 'sidebar'; 'data-section'?: SectionId; fixed?: boolean };
  children?: LayoutNode[];
}

// Keep the renderer's internal layout access in one adapter. These rectangles
export function extractSectionHeights(result: unknown): Partial<Record<SectionId, number>> {
  const layout = (result as { _INTERNAL__LAYOUT__DATA_?: LayoutNode })?._INTERNAL__LAYOUT__DATA_;
  const heights: Partial<Record<SectionId, number>> = {};
  const visit = (node: LayoutNode) => {
    const id = node.props?.['data-section'];
    if (id && node.box) heights[id] = (heights[id] ?? 0) + node.box.height;
    node.children?.forEach(visit);
  };
  if (layout) visit(layout);
  return heights;
}

// Keep the renderer's internal layout access in one adapter. These rectangles
// come from the same paginated layout as the PDF, including split entries.
export function extractPreviewRegions(result: unknown): PreviewRegion[] {
  const layout = (result as { _INTERNAL__LAYOUT__DATA_?: LayoutNode })?._INTERNAL__LAYOUT__DATA_;
  if (!layout?.children) return [];
  const regions: PreviewRegion[] = [];
  layout.children.forEach((page, index) => {
    const visit = (node: LayoutNode, x: number, y: number, parentColumn?: 'main' | 'sidebar') => {
      const column = node.props?.['data-column'] ?? parentColumn;
      const box = node.box;
      const left = x + (box?.left ?? 0);
      const top = y + (box?.top ?? 0);
      if (box && node.props?.['data-edit'] && box.width > 0 && box.height > 0 && !(node.props.fixed && JSON.parse(node.props['data-edit']).section === 'consent' && index < layout.children!.length - 1)) {
        const width = Math.min(box.width, (page.box?.width ?? 595.28) - left);
        const height = Math.min(box.height, (page.box?.height ?? 841.89) - top);
        if (width > 0 && height > 0) regions.push({ target: JSON.parse(node.props['data-edit']), column, page: index + 1, left, top, width, height });
      }
      node.children?.forEach(child => visit(child, left, top, column));
    };
    page.children?.forEach(child => visit(child, 0, 0));
  });
  return regions;
}
