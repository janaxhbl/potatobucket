import type { OldGame } from "./OldGame";
import type { Round } from "./Round";

export interface Game {
  id: number;
  title: string;
  gameTypeId: number;
  players: string[];
  rounds: Round[];
  finished: boolean;
  endValueReached: boolean;
  oldGames: OldGame[];
}
