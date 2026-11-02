import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toBase64 } from '../../ui/fonts';

// Hoisted, so the module re-imported after resetModules sees the same mock.
const sendMessage = vi.hoisted(() => vi.fn());
vi.mock('../../messaging', () => ({ sendMessage }));

class FakeFontFace {
  constructor(
    readonly family: string,
    readonly source: Uint8Array,
    readonly descriptors: FontFaceDescriptors,
  ) {}
}

const face = (family: string) => ({
  family,
  weight: '400 900',
  unicodeRange: 'U+0000-00FF',
  data: toBase64(new Uint8Array([7, 8, 9]).buffer),
});

describe('loadCanvasFonts', () => {
  let added: FakeFontFace[];

  beforeEach(() => {
    vi.resetModules();
    added = [];
    vi.stubGlobal('FontFace', FakeFontFace);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { add: (f: FakeFontFace) => added.push(f) },
    });
  });

  it('adds the typefaces to the page once, however many parts mount', async () => {
    sendMessage.mockResolvedValue([face('Figtree'), face('Gabarito')]);
    const { loadCanvasFonts } = await import('./fonts');
    await Promise.all([loadCanvasFonts(), loadCanvasFonts()]);
    await loadCanvasFonts();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith('fontData');
    expect(added.map((f) => f.family)).toEqual(['Figtree', 'Gabarito']);
    expect(added[1]!.descriptors).toEqual({ weight: '400 900', unicodeRange: 'U+0000-00FF' });
    expect([...added[1]!.source]).toEqual([7, 8, 9]);
  });

  it('keeps the system fonts when the page refuses the faces', async () => {
    sendMessage.mockResolvedValue([face('Figtree')]);
    vi.stubGlobal('FontFace', function () {
      throw new Error('Permission denied to access object');
    });
    const { loadCanvasFonts } = await import('./fonts');
    await expect(loadCanvasFonts()).resolves.toBeUndefined();
    expect(added).toEqual([]);
  });

  it('keeps the system fonts when the background does not answer', async () => {
    sendMessage.mockRejectedValue(new Error('Extension context invalidated.'));
    const { loadCanvasFonts } = await import('./fonts');
    await expect(loadCanvasFonts()).resolves.toBeUndefined();
  });
});
