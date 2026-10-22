import * as THREE from 'three'

/** Additive volumetric-looking beam: soft edges (fresnel), length falloff, drifting haze, faint gobo streaks. */
export function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uHaze: { value: 0.5 } },
    vertexShader: /* glsl */ `
      attribute float aLevel;
      attribute vec3 aColor;
      varying float vLevel;
      varying vec3 vColor;
      varying float vY;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      varying vec3 vLocal;
      void main() {
        vLevel = aLevel;
        vColor = aColor;
        vY = position.y;
        vLocal = position;
        vec4 local = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
          n = mat3(instanceMatrix) * n;
        #endif
        vec4 view = viewMatrix * modelMatrix * local;
        vViewPos = view.xyz;
        vNormalV = normalize(mat3(viewMatrix) * mat3(modelMatrix) * n);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uHaze;
      varying float vLevel;
      varying vec3 vColor;
      varying float vY;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      varying vec3 vLocal;

      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }

      void main() {
        // Facing ratio: 1 where we look straight through the beam's middle, 0 at its silhouette.
        float facing = abs(dot(normalize(vNormalV), normalize(-vViewPos)));
        float soft = pow(facing, 3.0);
        // Brightest at the fixture (y = 0), fading toward the floor (y = -1).
        float along = smoothstep(-1.0, -0.05, vY) * (0.35 + 0.65 * smoothstep(-1.0, 0.0, vY));
        float haze = 0.55 + 0.45 * noise(vec3(vLocal.xz * 3.0, vY * 2.0 - uTime * 0.25));
        float gobo = 0.85 + 0.15 * sin(atan(vLocal.z, vLocal.x) * 6.0);
        float density = 0.2 + 0.45 * uHaze;
        gl_FragColor = vec4(vColor * vLevel * soft * along * haze * gobo * density, 1.0);
      }
    `,
  })
}
