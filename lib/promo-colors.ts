import type { Promotion } from "./types"

/* Six distinct hues — wrap around if there are more than 6 promotions */
const HUES = [256, 142, 30, 290, 340, 185] // blue, green, orange, purple, pink, teal

export interface PromoColorScheme {
  hue: number
  /** Very light background — cards, chips */
  bgLight: string
  /** Readable text on light bg */
  textDark: string
  /** Medium border */
  border: string
  /** Solid — headers, dots, badges */
  solid: string
  /** White text on solid */
  textOnSolid: string
}

function scheme(hue: number): PromoColorScheme {
  return {
    hue,
    bgLight:     `oklch(0.94 0.05 ${hue})`,
    textDark:    `oklch(0.38 0.16 ${hue})`,
    border:      `oklch(0.80 0.09 ${hue})`,
    solid:       `oklch(0.55 0.20 ${hue})`,
    textOnSolid: `oklch(0.98 0.01 ${hue})`,
  }
}

const SCHEMES = HUES.map(scheme)

/** Returns a deterministic color scheme for a promotion based on its position in the array. */
export function getPromoColor(promoId: string, promotions: Promotion[]): PromoColorScheme {
  const idx = promotions.findIndex((p) => p.id === promoId)
  return SCHEMES[(idx < 0 ? 0 : idx) % SCHEMES.length]
}

/** Returns all schemes in order — useful when rendering a list of promotions. */
export function promoColorByIndex(index: number): PromoColorScheme {
  return SCHEMES[index % SCHEMES.length]
}
