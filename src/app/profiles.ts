// What a download makes, as offered in Settings and at a new user's first download.
import type { Settings } from '../storage/settings';

export const PROFILES: { profile: Settings['profile']; title: string; text: string }[] = [
  {
    profile: 'copy',
    title: 'A copy to keep',
    text: 'The course as it is in Canvas, in folders, with an overview page that opens offline.',
  },
  {
    profile: 'study',
    title: 'A study pack for AI',
    text: 'A few files per module with a course guide of deadlines and grading, ready to upload to an AI tool.',
  },
  {
    profile: 'agents',
    title: 'Files for coding agents',
    text: 'The copy in Markdown, with AGENTS.md, llms.txt and course.json for Claude Code, Codex, Cursor or scripts.',
  },
];
