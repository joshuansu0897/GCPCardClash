/**
 * Cloud Incidents played out on the island: a meteor shower on the zone that goes dark, a ship
 * sweeping its beam across the nodes, coins / snow / ice / goo falling from the sky, lightning
 * striking the AI tier, or a storm of packets racing through the edge. Driven purely by the
 * incident's `manifestation`; the rules effect has already been applied to the match state.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, useRef } from 'react';

import { nowSec } from './motion';
import { Flyover } from './spectacles/flyover';
import { LightningStorm } from './spectacles/lightning-storm';
import { MeteorShower } from './spectacles/meteor-shower';
import { PacketStream } from './spectacles/packet-stream';
import { SkyFall } from './spectacles/sky-fall';
import { type IncidentSpectacleProps, PALETTE_HEX, SPECTACLE_DURATION_SEC } from './spectacles/spectacle-kit';

export type { SpectacleArea } from './spectacles/spectacle-kit';

export function IncidentSpectacle(props: IncidentSpectacleProps): JSX.Element {
  const finished = useRef<boolean>(false);
  useFrame(() => {
    if (!finished.current && nowSec() - props.startsAt > SPECTACLE_DURATION_SEC) {
      finished.current = true;
      props.onDone();
    }
  });

  const colors = PALETTE_HEX[props.manifestation.palette];
  switch (props.manifestation.kind) {
    case 'meteor-shower':
      return <MeteorShower {...props} colors={colors} />;
    case 'flyover':
      return <Flyover {...props} colors={colors} dark={props.manifestation.palette === 'shadow'} />;
    case 'sky-fall':
      return <SkyFall {...props} colors={colors} particle={props.manifestation.particle ?? 'snow'} />;
    case 'lightning':
      return <LightningStorm {...props} colors={colors} />;
    case 'packet-stream':
      return <PacketStream {...props} colors={colors} />;
  }
}
