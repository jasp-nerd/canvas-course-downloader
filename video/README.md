# Films

Two films for Course Downloader, made with [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML rendered to video, Apache-2.0). Its own pnpm project, so the extension's dependencies don't change.

- **The 3.0 release film** (`index.html`, 40 s): what's new in 3.0.
- **What it can do** (`compositions/film-possible.html`, 46 s): the same scenes plus several courses at once, for people who haven't used it.

Everything that claims to be the product is the product: stills of the real build on the test Canvas (invented course data, in `assets/ui/`), pieces of its UI rebuilt from its own CSS, and the logo's real geometry. `pnpm sync` copies the fonts and Pip from `../public/`, writes the logo from `../src/ui/logo-paths.ts`, and makes the UI sounds with ffmpeg, so nothing here needs a licence of its own.

```bash
pnpm install
pnpm preview     # edit in the browser
pnpm check       # lint, layout, motion and contrast
pnpm render      # renders/release-1080p60.mp4; add --resolution 4k for 4K
pnpm render -- -c compositions/film-possible.html -o renders/possible-1080p60.mp4
```

Telemetry is off in every script (`HYPERFRAMES_NO_TELEMETRY=1`). Renders go to `renders/`, which isn't committed. The README's demo GIF is the release film's opening, cut from the master:

```bash
ffmpeg -ss 0.3 -t 5.5 -i renders/release-1080p60.mp4 -vf "fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -loop 0 ../media/readme/demo.gif
```

## How they're cut

Both films run on 2-second bars (120 BPM), so cuts fall on downbeats once music is added. Within a scene, objects carry across instead of cutting: the button's ring grows into the progress ring, the progress card becomes the receipt, the study pack's chip opens into its banner. Every headline enters the same way (`enterTitle` in `assets/film.js`), and every hold has a slow push-in.

| Scene | File | Release film | What it can do |
| --- | --- | --- | --- |
| Click Download course; the export runs in its own tab and ends in a receipt | `compositions/hook.html` | 0 to 10 | 0 to 10 |
| Tick three courses in the picker; they save one after the other | `compositions/picker.html` | | 10 to 16 |
| The overview page opens with Wi-Fi off | `compositions/offline.html` | 30 to 34 | 16 to 20 |
| New files on the dashboard, downloaded in one click | `compositions/dashboard.html` | 10 to 16 | 20 to 26 |
| The study pack for NotebookLM | `compositions/study.html` | 16 to 22 | 26 to 32 |
| Deadlines.ics in a calendar | `compositions/calendar.html` | 22 to 26 | 32 to 36 |
| A teacher's copy leaves students' data out | `compositions/teachers.html` | 26 to 30 | 36 to 40 |
| The ring fills; the logo, the name and the store button | `compositions/end.html` | 34 to 40 | 40 to 46 |

## Music

There's no music yet: only the UI sounds (clicks, ticks, the chime at 100% and Pip's pop). A track that fits is warm indie-electronic at 116 to 124 BPM (at 120 a bar is exactly 2 s), with a plucked or marimba hook, soft drums and no big drop: drums in at 2 s as the ring starts filling, the fullest part under the yellow study-pack banner, drums out at 34 s for the logo, a final hit with Pip at 36 s. Duck it about 4 dB under each UI sound. Use a track with a licence that allows it on YouTube and the stores, and add it as an `<audio>` clip in the root composition.
