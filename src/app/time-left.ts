// "About 1 min left": the time left from the rate files are really saved at,
// shown only once that rate has settled, so the page never guesses.

/** How far back the rate is measured. */
const WINDOW_MS = 20_000;
/** Measure at least this long before saying anything. */
const MIN_SPAN_MS = 5_000;
/** Files that must be saved within the window before the rate counts. */
const MIN_FILES = 5;
/**
 * The predicted finish times of the last three seconds must lie this close
 * together, as a share of the time left (or within 3 s), before one is shown.
 */
const STEADY = 0.15;

/**
 * When the line that best fits the samples reaches `total`. A fit, not the
 * last two points, because files finish in bursts (a ZIP fetches four at once).
 */
function fittedFinish(samples: { t: number; done: number }[], total: number): number | null {
  const mt = samples.reduce((n, s) => n + s.t, 0) / samples.length;
  const md = samples.reduce((n, s) => n + s.done, 0) / samples.length;
  let num = 0;
  let den = 0;
  for (const s of samples) {
    num += (s.t - mt) * (s.done - md);
    den += (s.t - mt) ** 2;
  }
  if (den === 0 || num <= 0) return null;
  return mt + (total - md) / (num / den);
}

export class TimeLeft {
  private samples: { t: number; done: number }[] = [];
  /** One predicted finish time per second. */
  private finishes: { t: number; at: number }[] = [];
  private finishAt: number | null = null;

  /** Seconds left, or null while the rate isn't known well enough. */
  update(now: number, done: number, total: number): number | null {
    if (done >= total) return 0;
    // The wait for the first file is getting started, not the rate: measure from there.
    if (done === 0) return null;
    const last = this.samples.at(-1);
    if (!last || done > last.done) this.samples.push({ t: now, done });
    while (this.samples.length > 2 && now - this.samples[0]!.t > WINDOW_MS) this.samples.shift();
    const enough = this.samples.length >= MIN_FILES && now - this.samples[0]!.t >= MIN_SPAN_MS;
    const finish = enough ? fittedFinish(this.samples, total) : null;
    if (finish !== null) {
      const latest = this.finishes.at(-1);
      if (latest && now - latest.t < 1000) {
        latest.at = finish;
      } else {
        this.finishes = [...this.finishes.slice(-2), { t: now, at: finish }];
        // Smoothed, so the number doesn't jump with every file.
        if (this.finishAt !== null) this.finishAt = this.finishAt * 0.7 + finish * 0.3;
      }
      if (this.finishAt === null && this.finishes.length === 3) {
        const times = this.finishes.map((f) => f.at);
        const spread = Math.max(...times) - Math.min(...times);
        if (spread <= Math.max(STEADY * (finish - now), 3000)) this.finishAt = finish;
      }
    }
    return this.finishAt === null ? null : Math.max(0, (this.finishAt - now) / 1000);
  }
}

export function timeLeftText(seconds: number): string {
  if (seconds < 50) return 'less than a minute left';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `about ${minutes} min left`;
  return `about ${Math.round(seconds / 3600)} h left`;
}
