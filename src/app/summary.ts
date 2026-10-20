import { exportOptionsFrom } from '../engine/options';
import { CONTENT_TYPES } from '../engine/types';
import type { Settings } from '../storage/settings';

/** One line saying what an export will contain and how it's saved, e.g. "Everything, as a ZIP per course". */
export function describeExport(settings: Settings): string {
  const options = exportOptionsFrom(settings, '');
  const on = CONTENT_TYPES.filter((t) => options.contentTypes[t]);
  const what =
    on.length === CONTENT_TYPES.length
      ? 'Everything'
      : on.length === 1 && on[0] === 'files'
        ? 'Files only'
        : `${on.length} of ${CONTENT_TYPES.length} kinds of content`;
  const format = options.format === 'markdown' ? ', pages as Markdown' : '';
  const how = settings.zipMode ? 'a ZIP per course' : 'folders in Downloads';
  return `${what}${format}, as ${how}`;
}
