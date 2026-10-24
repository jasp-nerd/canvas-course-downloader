# Release film

The 40-second film for Course Downloader 3.0, made with [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML rendered to video, Apache-2.0). Its own pnpm project, so the extension's dependencies don't change.

Everything that claims to be the product is the product: stills of the real build on the test Canvas (invented course data, in `assets/ui/`), pieces of its UI rebuilt from its own CSS, and the logo's real geometry. `pnpm sync` copies the fonts and Pip from `../public/`, writes the logo from `../src/ui/logo-paths.ts`, and makes the UI sounds with ffmpeg, so nothing here needs a licence of its own.

```bash
pnpm install
pnpm preview     # edit in the browser
pnpm check       # lint, layout, motion and contrast
pnpm render      # renders/ (1080p, 60 fps); add --resolution 4k for 4K
```

Telemetry is off in every script (`HYPERFRAMES_NO_TELEMETRY=1`). Renders go to `renders/`, which isn't committed. The README's demo GIF is made from the master:

```bash
ffmpeg -ss 0.8 -t 6.2 -i renders/release-1080p60.mp4 -vf "fps=15,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -loop 0 ../media/readme/demo.gif
```

| Seconds | Scene | File |
| --- | --- | --- |
| 0 to 2.4 | A course page; the cursor presses Download course | `compositions/s1-click.html` |
| 2 to 9 | The export runs in its own tab | `compositions/s2-export.html` |
| 9 to 15.6 | The receipt names the one file that couldn't be saved | `compositions/s3-receipt.html` |
| 15.6 to 21.8 | Several courses at once, from the dashboard | `compositions/s4-picker.html` |
| 21.8 to 28.4 | A study pack for an AI tool | `compositions/s5-study.html` |
| 28.4 to 33.4 | Deadlines, teachers, the overview that opens offline | `compositions/s6-montage.html` |
| 33.4 to 40 | The ring completes into the logo | `compositions/s7-end.html` |
