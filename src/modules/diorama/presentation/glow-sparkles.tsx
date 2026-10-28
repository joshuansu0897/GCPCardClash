/**
 * drei `Sparkles` drawn with a NaN-safe point material.
 *
 * WHY: drei's sparkle shader computes `0.05 / distanceToCenter`. A fragment that lands exactly on
 * a sprite's centre divides by zero and writes an infinite alpha, which blending turns into NaN.
 * Mipmap Bloom then smears that single pixel across every mip level, and the whole board goes
 * blank (black on GPUs, transparent under software WebGL) for as long as the particle sits there.
 */

import { Sparkles } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { type ComponentProps, type JSX, useEffect, useMemo } from 'react';
import { ShaderMaterial } from 'three';

/** Keeps the centre fragment finite; the brightest sparkle core stays as before. */
const MIN_CENTER_DISTANCE = 0.001;

const VERTEX_SHADER = /* glsl */ `
  uniform float pixelRatio;
  uniform float time;
  attribute float size;
  attribute float speed;
  attribute float opacity;
  attribute vec3 noise;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
    modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
    modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = size * 25.0 * pixelRatio / -viewPosition.z;
    vColor = color;
    vOpacity = opacity;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float distanceToCenter = max(distance(gl_PointCoord, vec2(0.5)), ${MIN_CENTER_DISTANCE.toFixed(3)});
    float strength = 0.05 / distanceToCenter - 0.1;
    gl_FragColor = vec4(vColor, strength * vOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Same uniforms as drei's material: `Sparkles` writes `material.time` every frame. */
class GlowSparklesMaterial extends ShaderMaterial {
  constructor(pixelRatio: number) {
    super({
      uniforms: { time: { value: 0 }, pixelRatio: { value: pixelRatio } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });
  }

  set time(value: number) {
    const uniform = this.uniforms['time'];
    if (uniform !== undefined) {
      uniform.value = value;
    }
  }
}

export function GlowSparkles(props: Omit<ComponentProps<typeof Sparkles>, 'children'>): JSX.Element {
  const dpr = useThree((state) => state.viewport.dpr);
  const material = useMemo(() => new GlowSparklesMaterial(dpr), [dpr]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <Sparkles {...props}>
      <primitive object={material} attach="material" />
    </Sparkles>
  );
}
