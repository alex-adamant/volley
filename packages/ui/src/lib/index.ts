interface Props {
  wins: number;
  losses: number;
}

export function calculateWinrate({ wins, losses }: Props) {
  if (!wins && !losses) return 0;
  return Math.round((wins / (wins + losses)) * 100);
}
