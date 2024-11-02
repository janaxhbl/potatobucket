export interface GameType {
  id: number | null;
  name: string;
  startValue: number | null;
  endValue: number | null;
  countType: string;
  endValueReachedWinLose: string; // "gewonnen" oder "verloren"
}
