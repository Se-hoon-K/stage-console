export type ModelCredit = { title: string; author: string; url: string; licence: string; licenceUrl: string }

const CC_BY = { licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' }

/** Third-party 3D models shipped in public/models (optimised, i.e. modified). */
export const modelCredits: ModelCredit[] = [
  { title: 'Moving Head Beam (high Poly)', author: 'Lord Henry', url: 'https://sketchfab.com/3d-models/ce283a1277bb4e98bd29b157075e003f', ...CC_BY },
  { title: 'Square Truss Straight Segment 21', author: 'akerStudio', url: 'https://sketchfab.com/3d-models/f43719b6267645a587a9d3959b5f2d2b', ...CC_BY },
  { title: 'Line Array', author: 'Wilmer.Jose.Saumeth.Suarez', url: 'https://sketchfab.com/3d-models/cc558455c6d141ccb69c23222af46c8a', ...CC_BY },
  { title: 'Stage Light', author: 'Daniyal Malik', url: 'https://sketchfab.com/3d-models/d3e138ecee20439d939d27cbdba208d1', ...CC_BY },
]
