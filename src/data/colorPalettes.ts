import type { ResumeTheme } from '../types/resume';

type Colors = ResumeTheme['colors'];
export interface ColorPalette { id: string; name: string; colors: Colors }
const palette = (id: string, name: string, accent: string, background: string, sidebar: string, text: string, muted: string, separator: string): ColorPalette => ({ id, name, colors: { accent, background, sidebar, text, muted, separator } });

export const colorPalettes: ColorPalette[] = [
  palette('forest', 'Leśna', '#25564a', '#ffffff', '#edf3ee', '#20342d', '#52685e', '#c9d9cf'),
  palette('navy', 'Granatowa', '#293b57', '#ffffff', '#edf1f7', '#202c3f', '#596981', '#ccd5e3'),
  palette('terracotta', 'Terakota', '#96513a', '#fffdf9', '#f4e6dc', '#352820', '#766153', '#ddc8b8'),
  palette('plum', 'Śliwkowa', '#72507d', '#fffdfd', '#f0e7f3', '#352a3d', '#736179', '#d9c7de'),
  palette('graphite', 'Grafitowa', '#30343b', '#ffffff', '#f0f1f3', '#22262d', '#606670', '#cfd3d9'),
  palette('ocean', 'Oceaniczna', '#286879', '#fbfefe', '#e3f0f2', '#24393f', '#546e76', '#c1d8df'),
  palette('rose', 'Pudrowy róż', '#87535d', '#fffdfb', '#f4e3e5', '#403035', '#755d66', '#dfc4cc'),
  palette('olive', 'Oliwkowa', '#5b653c', '#fffef8', '#edf0df', '#323724', '#646b51', '#d0d8b8'),
  palette('sand', 'Piaskowa', '#776046', '#fffdf8', '#efe8da', '#38312a', '#706353', '#d8cbb8'),
  palette('cobalt', 'Kobaltowa', '#294abb', '#ffffff', '#edf1ff', '#202b46', '#596786', '#cad3f0'),
  palette('night', 'Noc i miedź', '#e4b489', '#182536', '#27354a', '#f8f0e7', '#c2cbd8', '#4a5a70'),
  palette('jade', 'Nocny nefryt', '#94d4bf', '#17312b', '#25463b', '#f0f8f2', '#b7cdc4', '#4f6f62'),
];

// A palette owns all six colours. It also reconnects a fixed portrait border
// to the chosen palette; selecting a new palette is a single undoable edit.
export function applyColorPalette(theme: ResumeTheme, palette: ColorPalette): Pick<ResumeTheme, 'colors' | 'photo'> {
  return { colors: { ...palette.colors }, photo: { ...theme.photo, borderColor: theme.photo.borderColor === 'none' ? 'none' : 'accent' } };
}
