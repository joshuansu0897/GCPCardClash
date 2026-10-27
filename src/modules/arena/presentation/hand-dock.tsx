/**
 * Player hand: a fanned row of game cards between the draw pile and the turn controls.
 * Each card face is one button (play energy / select service or shield); cycling is a
 * separate corner button. Pointer position drives a subtle tilt and foil sheen.
 */

import type { CSSProperties, JSX, PointerEvent } from 'react';

import { BASE_SHIELD_POINTS, DISCARDS_PER_TURN, type HandCardInstance, RECOMMENDED_SHIELD_BONUS } from '../../battle';
import type { CatalogCard } from '../../catalog';
import { TechnicalIcon, type TechnicalIconName } from '../../../shared/gcp-icons';

export interface HandDockProps {
  readonly hand: readonly HandCardInstance[];
  readonly drawPileCount: number;
  readonly discardPileCount: number;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedInstanceId: string | null;
  readonly playerEnergy: number;
  readonly discardsRemaining: number;
  readonly isMatchCompleted: boolean;
  readonly isLocked: boolean;
  readonly onSelectOrPlayCard: (instance: HandCardInstance, card: CatalogCard) => void;
  readonly onDiscardCard: (instanceId: string) => void;
  readonly onEndTurn: () => void;
}

export function HandDock(props: HandDockProps): JSX.Element {
  const inactive = props.isMatchCompleted || props.isLocked;
  const canDiscard = props.discardsRemaining > 0 && !inactive;
  const mid = (props.hand.length - 1) / 2;

  return (
    <section className={`hand-dock ${props.isLocked ? 'is-locked' : ''}`} aria-label="Architect Card Hand">
      <PileStack label="Deck" count={props.drawPileCount} variant="draw" />

      <ol className="hand-fan">
        {props.hand.map((item, index) => {
          const card = props.cardsById[item.cardId];
          if (card === undefined) {
            return null;
          }
          const offset = index - mid;
          const style = { '--fan-offset': offset, '--fan-abs': Math.abs(offset) } as CSSProperties;
          return (
            <li key={item.instanceId} className="hand-slot" style={style}>
              <GameCard
                card={card}
                isSelected={props.selectedInstanceId === item.instanceId}
                playerEnergy={props.playerEnergy}
                canDiscard={canDiscard}
                disabled={inactive}
                onPrimaryClick={() => props.onSelectOrPlayCard(item, card)}
                onDiscard={() => props.onDiscardCard(item.instanceId)}
              />
            </li>
          );
        })}
      </ol>

      <div className="turn-control-rail">
        <PileStack label="Discard" count={props.discardPileCount} variant="discard" />
        <div className="cycle-quota" aria-label={`Cycles left this turn: ${props.discardsRemaining} of ${DISCARDS_PER_TURN}`}>
          <TechnicalIcon name="refresh" size={14} />
          <span>
            {props.discardsRemaining}/{DISCARDS_PER_TURN} cycles
          </span>
        </div>
        <button type="button" className="end-turn-btn" disabled={inactive} onClick={props.onEndTurn}>
          <span>{props.isLocked ? 'Rival Turn…' : 'End Turn'}</span>
        </button>
      </div>
    </section>
  );
}

function PileStack(props: { readonly label: string; readonly count: number; readonly variant: 'draw' | 'discard' }): JSX.Element {
  return (
    <div className={`pile-stack is-${props.variant}`} aria-label={`${props.label}: ${props.count} cards`}>
      <div className="pile-cards" aria-hidden="true">
        {props.count > 2 && <span className="pile-card" />}
        {props.count > 1 && <span className="pile-card" />}
        {props.count > 0 && <span className="pile-card is-top" />}
      </div>
      <span className="pile-count">{props.count}</span>
      <span className="pile-label">{props.label}</span>
    </div>
  );
}

interface GameCardProps {
  readonly card: CatalogCard;
  readonly isSelected: boolean;
  readonly playerEnergy: number;
  readonly canDiscard: boolean;
  readonly disabled: boolean;
  readonly onPrimaryClick: () => void;
  readonly onDiscard: () => void;
}

function GameCard(props: GameCardProps): JSX.Element {
  const { card, isSelected, playerEnergy } = props;
  const affordable = card.kind === 'energy' || playerEnergy >= card.energyCost;
  const classes = [
    'game-card',
    `ink-${card.ink}`,
    `kind-${card.kind}`,
    isSelected ? 'is-selected' : '',
    affordable ? '' : 'is-unaffordable',
  ].join(' ');

  return (
    <div className={classes} onPointerMove={applyCardPointerTilt} onPointerLeave={resetCardPointerTilt}>
      <button
        type="button"
        className="game-card-face"
        disabled={props.disabled}
        aria-pressed={card.kind === 'energy' ? undefined : isSelected}
        aria-label={describeCardAction(card, isSelected)}
        onClick={props.onPrimaryClick}
      >
        <span className="gc-foil" aria-hidden="true" />
        <span className="gc-cost" aria-hidden="true">
          {card.kind === 'energy' ? 0 : card.energyCost}
        </span>
        <span className="gc-points" aria-hidden="true">
          {resolvePointsLabel(card)}
        </span>

        <span className="gc-art" aria-hidden="true">
          <TechnicalIcon name={resolveArtIcon(card)} size={44} className="gc-art-icon" />
          <span className="gc-code">{card.shortCode}</span>
          {card.kind === 'energy' && <span className="gc-grant">+{card.energyGrant}E</span>}
        </span>

        <span className="gc-title">{card.title}</span>
        <span className="gc-type">{resolveTypeLine(card)}</span>
        <span className="gc-text">{card.summary}</span>

        {!affordable && <span className="gc-ribbon">Need {card.energyCost}E</span>}
        {isSelected && <span className="gc-ribbon is-selected">Choose a target</span>}
      </button>

      <button
        type="button"
        className="gc-cycle"
        disabled={!props.canDiscard}
        onClick={props.onDiscard}
        aria-label={`Cycle ${card.title}`}
        title="Discard and draw 1 card"
      >
        <TechnicalIcon name="refresh" size={13} />
      </button>
    </div>
  );
}

function describeCardAction(card: CatalogCard, isSelected: boolean): string {
  if (card.kind === 'energy') {
    return `Provision +${card.energyGrant}E — ${card.title}`;
  }
  if (isSelected) {
    return `Selected — ${card.title}`;
  }
  const verb = card.kind === 'shield' ? 'Select Shield' : 'Select Service';
  return `${verb} — ${card.title} (${card.energyCost} Energy)`;
}

function resolvePointsLabel(card: CatalogCard): string {
  if (card.kind === 'energy') {
    return `+${card.bonusPoints}`;
  }
  if (card.kind === 'shield') {
    return `${BASE_SHIELD_POINTS + RECOMMENDED_SHIELD_BONUS}`;
  }
  return `${card.basePoints}`;
}

function resolveArtIcon(card: CatalogCard): TechnicalIconName {
  if (card.kind === 'energy') {
    return 'bolt';
  }
  return card.ink;
}

function resolveTypeLine(card: CatalogCard): string {
  if (card.kind === 'energy') {
    return 'Provisioning';
  }
  if (card.kind === 'shield') {
    return 'Security Shield';
  }
  return `Service · ${card.category}`;
}

function applyCardPointerTilt(event: PointerEvent<HTMLElement>): void {
  // Measure card bounds
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || !Number.isFinite(event.clientX)) {
    return;
  }

  // Compute normalized pointer percentages and capped 3D tilt angles
  const pctX = Math.round(((event.clientX - rect.left) / rect.width) * 100);
  const pctY = Math.round(((event.clientY - rect.top) / rect.height) * 100);
  const tiltY = (((pctX - 50) / 50) * 5).toFixed(2);
  const tiltX = (((50 - pctY) / 50) * 5).toFixed(2);

  // Sync custom properties to compositor
  el.style.setProperty('--pointer-x', `${pctX}%`);
  el.style.setProperty('--pointer-y', `${pctY}%`);
  el.style.setProperty('--tilt-x', `${tiltX}deg`);
  el.style.setProperty('--tilt-y', `${tiltY}deg`);
}

function resetCardPointerTilt(event: PointerEvent<HTMLElement>): void {
  const el = event.currentTarget;
  el.style.setProperty('--tilt-x', '0deg');
  el.style.setProperty('--tilt-y', '0deg');
}
