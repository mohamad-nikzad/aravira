export function withAlpha(color: string, alpha: number): string {
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    const value = Math.round(normalizedAlpha * 255)
      .toString(16)
      .padStart(2, '0');

    return `${color}${value}`;
  }

  if (/^#[0-9a-fA-F]{8}$/.test(color)) {
    const value = Math.round(normalizedAlpha * 255)
      .toString(16)
      .padStart(2, '0');

    return `${color.slice(0, 7)}${value}`;
  }

  return color;
}
