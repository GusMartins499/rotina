export const MIN_TEXT_CONTRAST = 4.5;
export const PAST_SATURATION_LOSS = 0.5;

type Rgb = [number, number, number];

function channelsOf(hex: string): Rgb {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255) as Rgb;
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function fromLinear(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function luminanceOfLinear([red, green, blue]: Rgb): number {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function relativeLuminance(hex: string): number {
  return luminanceOfLinear(channelsOf(hex).map(toLinear) as Rgb);
}

export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function hexOf(channels: Rgb): string {
  return `#${channels
    .map((channel) =>
      Math.floor(Math.min(Math.max(channel, 0), 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function desaturate(hex: string, amount: number): string {
  const linear = channelsOf(hex).map(toLinear) as Rgb;
  const gray = luminanceOfLinear(linear);
  const mixed = linear.map((channel) => channel + (gray - channel) * amount);

  return hexOf(mixed.map(fromLinear) as Rgb);
}
