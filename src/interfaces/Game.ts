import type { Round } from "./Round";

export interface Game {
  id: number;
  title: string;
  players: string[];
  rounds: Round[];
}
