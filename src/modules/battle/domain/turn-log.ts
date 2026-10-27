/**
 * Append-only telemetry log shared by every rule module (newest entry first).
 */

import type { TurnLogEntry, TurnLogSeverity } from './match-types';

export interface LogDraft {
  readonly severity: TurnLogSeverity;
  readonly headline: string;
  readonly detail: string;
  readonly pointsDelta: number;
}

export function appendLog(
  logs: readonly TurnLogEntry[],
  turn: number,
  actor: 'player' | 'rival' | 'system',
  entry: LogDraft,
): readonly TurnLogEntry[] {
  const nextEntry: TurnLogEntry = {
    id: `log-t${turn}-${logs.length + 1}`,
    turn,
    actor,
    severity: entry.severity,
    headline: entry.headline,
    detail: entry.detail,
    pointsDelta: entry.pointsDelta,
  };
  return [nextEntry, ...logs];
}
