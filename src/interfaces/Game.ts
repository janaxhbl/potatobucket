import type { Round } from "./Round";

export interface Game {
  title: string;
  players: [string];
  rounds: [Round];
}
