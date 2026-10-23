// The example course setup's previews and demo show, with the names the export really writes.
import type { IconName } from '../../ui/icons';

export const COURSE = 'Linear Algebra';
export const OPEN_ME = `Open me - ${COURSE}.html`;
export const GUIDE = '00 Course guide.md';
export const MODULE_FILE = '01 Week 1. Vectors.md';
export const SLIDES = 'M01 Lecture 1.pdf';

/** A file or folder in a preview of what a download makes. */
export interface PreviewRow {
  icon: IconName;
  name: string;
  note?: string;
  /** A chip instead of a note. */
  chip?: string;
  /** Inside the row above. */
  nested?: boolean;
  /** What lands in the folder itself: a ZIP or a course folder. */
  strong?: boolean;
}
