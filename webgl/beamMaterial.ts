import * as THREE from 'three'

/** Additive light cone: bright at the fixture, fading to the floor, with a slow shimmer. */
export function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aLevel;
      varying float vLevel;
      varying float vY;
      varying vec3 vWorld;
      void main() {
        vLevel = aLevel;
        vY = position.y;
        vec4 local = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
        #endif
        vec4 world = modelMatrix * local;
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying float vLevel;
      varying float vY;
      varying vec3 vWorld;
      void main() {
        float fade = smoothstep(-1.0, 0.0, vY);
        float shimmer = 0.85 + 0.15 * sin(vWorld.y * 3.0 + vWorld.x + uTime * 1.5);
        gl_FragColor = vec4(uColor * vLevel * fade * shimmer * 0.35, 1.0);
      }
    `,
  })
}
