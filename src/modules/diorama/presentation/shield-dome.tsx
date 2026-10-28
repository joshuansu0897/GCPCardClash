/**
 * Translucent Fresnel hex-lattice dome that locks over a hardened node.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, type Group, ShaderMaterial } from 'three';

import { usePopIn } from './motion';

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;

  float hexEdge(vec2 p) {
    p.x *= 1.1547;
    p.y += mod(floor(p.x), 2.0) * 0.5;
    p = abs(fract(p) - 0.5);
    return abs(max(p.x * 1.5 + p.y, p.y * 2.0) - 1.0);
  }

  void main() {
    // WHY: where the dome faces the camera head-on, rounding can push the dot product just past 1.
    // pow() of the negative base is NaN on GPUs, and Bloom smears one NaN pixel over the whole board.
    float facing = min(abs(dot(vNormal, vView)), 1.0);
    float fresnel = pow(1.0 - facing, 2.2);
    float lattice = 1.0 - smoothstep(0.0, 0.07, hexEdge(vUv * vec2(20.0, 8.0)));
    float scan = 0.5 + 0.5 * sin(vUv.y * 26.0 - uTime * 2.6);
    float alpha = fresnel * 0.85 + lattice * (0.18 + 0.22 * scan) + 0.04;
    gl_FragColor = vec4(uColor * (0.7 + fresnel), alpha);
  }
`;

export interface ShieldDomeProps {
  readonly colorHex: string;
  readonly radius: number;
  readonly popDelaySec: number;
  readonly reducedMotion: boolean;
}

export function ShieldDome(props: ShieldDomeProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  usePopIn(groupRef, props.popDelaySec, 0.7, props.reducedMotion);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: { uColor: { value: new Color(props.colorHex) }, uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    [props.colorHex],
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = props.reducedMotion ? 0 : clock.elapsedTime;
  });

  return (
    <group ref={groupRef} scale={0.0001}>
      <mesh material={material} renderOrder={10}>
        <sphereGeometry args={[props.radius, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[props.radius - 0.06, props.radius, 48]} />
        <meshBasicMaterial color={props.colorHex} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
