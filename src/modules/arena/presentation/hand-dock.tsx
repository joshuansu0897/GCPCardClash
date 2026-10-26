/**
 * Tactile Card Hand Dock with subsystem ink bands, energy badges, discard cycle, and End Turn.
 */

import type { JSX } from 'react';

import type { HandCardInstance } from '../../battle';
import type { CatalogCard } from '../../catalog';

export interface HandDockProps {
  readonly hand: readonly HandCardInstance[];
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedInstanceId: string | null;
  readonly playerEnergy: number;
  readonly discardsRemaining: number;
  readonly isMatchCompleted: boolean;
  readonly onSelectOrPlayCard: (instance: HandCardInstance, card: CatalogCard) => void;
  readonly onDiscardCard: (instanceId: string) => void;
  readonly onEndTurn: () => void;
}

export function HandDock(props: HandDockProps): JSX.Element {
  const canDiscard = props.discardsRemaining > 0 && !props.isMatchCompleted;

  return (
    <section className="hand-dock" aria-label="Architect Card Hand">
      <div className="hand-cards-strip">
        {props.hand.map((item) => {
          const card = props.cardsById[item.cardId];
          return card === undefined ? null : (
            <TactileDeckCard
              key={item.instanceId}
              card={card}
              isSelected={props.selectedInstanceId === item.instanceId}
              playerEnergy={props.playerEnergy}
              canDiscard={canDiscard}
              disabled={props.isMatchCompleted}
              onPrimaryClick={() => props.onSelectOrPlayCard(item, card)}
              onDiscard={() => props.onDiscardCard(item.instanceId)}
            />
          );
        })}
      </div>

      <div className="turn-control-rail">
        <div className="discard-quota-readout">
          <span className="mono-stamp">CYCLE QUOTA</span>
          <strong className="quota-digits">{props.discardsRemaining}/2</strong>
        </div>

        <button
          type="button"
          className="end-turn-btn"
          disabled={props.isMatchCompleted}
          onClick={props.onEndTurn}
        >
          <span>End Turn</span>
        </button>
      </div>
    </section>
  );
}

interface TactileDeckCardProps {
  readonly card: CatalogCard;
  readonly isSelected: boolean;
  readonly playerEnergy: number;
  readonly canDiscard: boolean;
  readonly disabled: boolean;
  readonly onPrimaryClick: () => void;
  readonly onDiscard: () => void;
}

function TactileDeckCard(props: TactileDeckCardProps): JSX.Element {
  const { card, isSelected, playerEnergy, canDiscard, disabled, onPrimaryClick, onDiscard } = props;
  const affordable = card.kind === 'energy' || playerEnergy >= card.energyCost;
  const selectedClass = isSelected ? 'is-selected' : '';
  const affordClass = affordable ? '' : 'is-low-energy';

  return (
    <article className={`deck-card ${selectedClass} ${affordClass}`}>
      <div className={`card-ink-band ink-bg-${card.ink}`} aria-hidden="true" />

      <div className="deck-card-header">
        <span className={`service-code-chip ink-chip-${card.ink}`}>{card.shortCode}</span>
        <CardCostBadge card={card} />
      </div>

      <h3 className="deck-card-title">{card.title}</h3>
      <p className="deck-card-summary">{card.summary}</p>

      <div className="deck-card-actions">
        <button
          type="button"
          className="card-play-btn"
          disabled={disabled}
          onClick={onPrimaryClick}
        >
          {resolvePrimaryCardVerb(card, isSelected)}
        </button>
        <button
          type="button"
          className="card-cycle-btn"
          disabled={!canDiscard}
          onClick={onDiscard}
          aria-label={`Cycle ${card.title}`}
          title="Discard and draw 1 card"
        >
          Cycle
        </button>
      </div>
    </article>
  );
}

function CardCostBadge(props: { readonly card: CatalogCard }): JSX.Element {
  const { card } = props;

  if (card.kind === 'energy') {
    return <span className="cost-stamp is-grant">+{card.energyGrant}E</span>;
  }
  if (card.kind === 'shield') {
    return <span className="cost-stamp is-shield">{card.energyCost}E · +35/60P</span>;
  }
  return <span className="cost-stamp">{card.energyCost}E · {card.basePoints}P</span>;
}

function resolvePrimaryCardVerb(card: CatalogCard, isSelected: boolean): string {
  if (card.kind === 'energy') {
    return `Provision +${card.energyGrant}E`;
  }
  if (isSelected) {
    return 'Selected';
  }
  return card.kind === 'shield' ? 'Select Shield' : 'Select Service';
}
