export interface GameType {
  id: number | null;
  name: string;
  startValue: number | null;
  endValue: number | null;
  countType: string;
  endValueReachedWinLose: string; // "gewonnen" oder "verloren"
  endValueReachedBummerl: boolean; // Schnapsen -> false, Romme -> true, Jolly -> true
  bummerlGood: boolean; // Schnapsen -> false, Romme -> false, Jolly -> true
}
