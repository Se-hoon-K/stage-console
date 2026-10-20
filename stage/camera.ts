/** Camera distance at which a `width` m wide stage (plus 10% margin) fits the horizontal field of view. */
export function fitDistance(width: number, vfovDeg: number, aspect: number): number {
  const hfov = 2 * Math.atan(Math.tan((vfovDeg * Math.PI) / 360) * aspect)
  return (width * 1.1) / 2 / Math.tan(hfov / 2)
}
