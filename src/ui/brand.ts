// Names shown in the interface, in one place so they can change in one place.
export const PRODUCT_NAME = 'Course Downloader';

/** The squirrel on our own pages. The name isn't final. */
export const MASCOT_NAME = 'Pip';

/** Poses in public/pip/<pose>.webp. Pip appears on our own pages, never inside Canvas. */
export const PIP_POSES = [
  'wave',
  'think',
  'point',
  'folder',
  'read',
  'laptop',
  'run',
  'cheer',
  'magnify',
  'worried',
] as const;
export type PipPose = (typeof PIP_POSES)[number];
