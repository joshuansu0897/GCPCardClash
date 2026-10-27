/**
 * The diorama's camera "look": a gradient sky painted behind the scene, a soft studio
 * environment for the models' reflections, and the post-processing stack (bloom on glowing
 * parts, a mild tilt-shift miniature blur, a vignette, and filmic tone mapping). Everything is
 * generated in code, so nothing is fetched from a CDN.
 */

import { Environment, Lightformer } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { type JSX, useEffect } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

import type { TrackTheme } from '../domain/track-theme';

/** Sky, environment light and post-processing together: the whole camera look of the scene. */
export function SceneLook(props: { readonly theme: TrackTheme; readonly lite: boolean }): JSX.Element {
  return (
    <>
      <SkyBackdrop theme={props.theme} />
      <StudioEnvironment />
      <PostFx lite={props.lite} />
    </>
  );
}

/** Paints the track's sky gradient as the scene background (post-processing drops canvas alpha). */
function SkyBackdrop(props: { readonly theme: TrackTheme }): null {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const texture = gradientTexture(props.theme.skyTop, props.theme.skyBottom);
    const previous = scene.background;
    scene.background = texture;
    return () => {
      scene.background = previous;
      texture.dispose();
    };
  }, [scene, props.theme.skyTop, props.theme.skyBottom]);

  return null;
}

function gradientTexture(top: string, bottom: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context !== null) {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A soft key and fill made of light cards, for gentle highlights on the low-poly models. */
function StudioEnvironment(): JSX.Element {
  return (
    <Environment resolution={128} environmentIntensity={0.55}>
      <Lightformer form="rect" intensity={2.2} color="#FFF7E6" position={[6, 9, 6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.1} color="#DBEAFE" position={[-8, 5, -4]} scale={[10, 5, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" intensity={0.8} color="#FDE68A" position={[0, 12, -10]} scale={6} target={[0, 0, 0]} />
    </Environment>
  );
}

/**
 * Post-processing stack; `lite` drops multisampling and the tilt-shift blur on weak devices.
 * WHY: no screen-space ambient occlusion: N8AO left the canvas blank under software WebGL,
 * and a blank board is far worse than a slightly flatter one.
 */
function PostFx(props: { readonly lite: boolean }): JSX.Element {
  return (
    <EffectComposer multisampling={props.lite ? 0 : 4} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.75} />
      {/* WHY: blur grows with distance from the start–end line, so a horizontal line keeps the board's middle band sharp */}
      <TiltShift2 blur={props.lite ? 0 : 0.12} taper={0.38} start={[0, 0.5]} end={[1, 0.5]} />
      <Vignette offset={0.38} darkness={0.3} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
