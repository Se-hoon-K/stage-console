const round = (v: number) => Math.round(v * 1e6) / 1e6

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function snapToDetent(v: number, min: number, max: number, detents: number) {
  const step = (max - min) / detents
  return round(clamp(min + Math.round((v - min) / step) * step, min, max))
}

export function stepValue(v: number, min: number, max: number, detents: number, dir: 1 | -1, multiplier = 1) {
  const step = (max - min) / detents
  return snapToDetent(v + dir * step * multiplier, min, max, detents)
}

export function dragToValue(startValue: number, dy: number, min: number, max: number, pxForFullRange = 200) {
  return round(clamp(startValue - (dy / pxForFullRange) * (max - min), min, max))
}
