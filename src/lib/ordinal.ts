/**
 * Two-digit ordinal for a zero-based index: 0 → "01". Used wherever a list
 * is numbered in the page chrome but the copy file does not carry the number,
 * so reordering the copy renumbers the page rather than desyncing from it.
 */
export const ordinal = (i: number) => String(i + 1).padStart(2, "0");
