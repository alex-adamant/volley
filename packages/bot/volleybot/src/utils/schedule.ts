import { flip } from "./random";

export const pointsOptions = [15, 18, 21];

function teamOf(player1: string, player2: string) {
  return flip() ? `${player1} ${player2}` : `${player2} ${player1}`;
}

function match(team1: string, team2: string, shouldFlip: boolean = false) {
  if (shouldFlip) {
    return flip() ? `${team1} vs ${team2}` : `${team2} vs ${team1}`;
  }
  return `${team1} vs ${team2}`;
}

function generateSchedule4(playerList: string[]): string {
  const [p1, p2, p3, p4] = playerList;
  return `
<b>Первый круг</b>
  🏐${match(teamOf(p1, p2), teamOf(p3, p4))}
  🏐${match(teamOf(p1, p3), teamOf(p2, p4))}
  🏐${match(teamOf(p1, p4), teamOf(p2, p3))}

<b>Второй круг</b>
  🏐${match(teamOf(p3, p4), teamOf(p1, p2))}
  🏐${match(teamOf(p2, p4), teamOf(p1, p3))}
  🏐${match(teamOf(p2, p3), teamOf(p1, p4))}

<b>Платит за сетку и записывает результаты в чат:</b>
  💸 ${p4} 💸
  `;
}

function generateSchedule5(playerList: string[]): string {
  const [p1, p2, p3, p4, p5] = playerList;
  return `
🏐${match(teamOf(p1, p2), teamOf(p3, p4))}
🏐${match(teamOf(p1, p3), teamOf(p2, p5))}
🏐${match(teamOf(p2, p4), teamOf(p1, p5))}
🏐${match(teamOf(p3, p5), teamOf(p1, p4))}
🏐${match(teamOf(p4, p5), teamOf(p2, p3))}

<b>Платит за сетку и записывает результаты в чат:</b>
  💸 ${p5} 💸
  `;
}

function generateSchedule6(playerList: string[]): string {
  const [p1, p2, p3, p4, p5, p6] = playerList;
  return `
🏐${match(teamOf(p1, p4), teamOf(p5, p6), true)}
🏐${match(teamOf(p2, p3), teamOf(p4, p5), true)}
🏐${match(teamOf(p1, p6), teamOf(p2, p5), true)}
🏐${match(teamOf(p1, p3), teamOf(p2, p6), true)}
🏐${match(teamOf(p3, p5), teamOf(p4, p6), true)}
🏐${match(teamOf(p1, p2), teamOf(p3, p4), true)}

<b>Доигровки</b>
🏐${match(teamOf(p1, p5), teamOf(p2, p4))}
🏐${match(teamOf(p3, p6), teamOf(p1, p5))}
🏐${match(teamOf(p2, p4), teamOf(p3, p6))}

<b>Платит за сетку и записывает результаты в чат:</b>
  💸 ${p6} 💸
  `;
}

function generateSchedule7(playerList: string[]): string {
  const [p1, p2, p3, p4, p5, p6, p7] = playerList;
  return `
🏐${match(teamOf(p1, p2), teamOf(p3, p4), true)}
🏐${match(teamOf(p5, p6), teamOf(p1, p7), true)}
🏐${match(teamOf(p2, p3), teamOf(p4, p5), true)}
🏐${match(teamOf(p4, p6), teamOf(p5, p7), true)}
🏐${match(teamOf(p1, p3), teamOf(p2, p6), true)}
🏐${match(teamOf(p4, p7), teamOf(p3, p5), true)}
🏐${match(teamOf(p1, p6), teamOf(p2, p7), true)}

<b>Платит за сетку и записывает результаты в чат:</b>
  💸 ${p7} 💸
  `;
}

function generateSchedule8(playerList: string[]): string {
  const [p1, p2, p3, p4, p5, p6, p7, p8] = playerList;

  return `
<b>Первая четвёрка:</b>
${p1} ${p2} ${p3} ${p4}
  🏐${match(teamOf(p1, p2), teamOf(p3, p4), true)}
  🏐${match(teamOf(p1, p3), teamOf(p2, p4), true)}
  🏐${match(teamOf(p1, p4), teamOf(p2, p3), true)}

<b>Платит за сетку и записывает результаты в чат:</b>
💸 ${p4} 💸

<b>Вторая четвёрка:</b>
${p5} ${p6} ${p7} ${p8}
  🏐${match(teamOf(p5, p6), teamOf(p7, p8), true)}
  🏐${match(teamOf(p5, p7), teamOf(p6, p8), true)}
  🏐${match(teamOf(p5, p8), teamOf(p6, p7), true)}

<b>Платит за сетку и записывает результаты в чат:</b>
💸 ${p8} 💸  `;
}

export const scheduleFunctionsMap: Record<number, (n: string[]) => string> = {
  4: generateSchedule4,
  5: generateSchedule5,
  6: generateSchedule6,
  7: generateSchedule7,
  8: generateSchedule8,
};
