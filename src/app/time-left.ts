// "About 1 min left": the time left from the rate files are really saved at,
// shown only once that rate has settled, so the page never guesses.

/** How far back the rate is measured. */
const WINDOW_MS = 20_000;
/** Measure at least this long before saying anything. */
const MIN_SPAN_MS = 5_000;
/** Files that must be saved within the window before the rate counts. */
const MIN_FILES = 5;
/** Recent estimates must agree within this factor before one is shown. */
const STEADY = 1.25;

export class TimeLeft {
  private samples: { t: number; done: number }[] = [];
  private estimates: number[] = [];
  private shown: number | null = null;
  private estimatedAt = -Infinity;

  /** Seconds left, or null while the rate isn't known well enough. */
  update(now: number, done: number, total: number): number | null {
    if (done >= total) return 0;
    this.samples.push({ t: now, done });
    while (this.samples.length > 2 && now - this.samples[1]!.t >= WINDOW_MS) this.samples.shift();
    const first = this.samples[0]!;
    const span = now - first.t;
    if (span < MIN_SPAN_MS || done - first.done < MIN_FILES) return this.shown;
    // Files often finish in bursts: one estimate a second at most.
    if (now - this.estimatedAt < 1000) return this.shown;
    this.estimatedAt = now;
    const estimate = (total - done) / ((done - first.done) / span) / 1000;
    this.estimates = [...this.estimates.slice(-2), estimate];
    const steady =
      this.estimates.length === 3 &&
      Math.max(...this.estimates) <= STEADY * Math.min(...this.estimates);
    if (this.shown === null) {
      if (steady) this.shown = estimate;
    } else {
      // Smoothed, so the number doesn't jump with every file.
      this.shown = this.shown * 0.7 + estimate * 0.3;
    }
    return this.shown;
  }
}

export function timeLeftText(seconds: number): string {
  if (seconds < 50) return 'less than a minute left';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `about ${minutes} min left`;
  return `about ${Math.round(seconds / 3600)} h left`;
}
