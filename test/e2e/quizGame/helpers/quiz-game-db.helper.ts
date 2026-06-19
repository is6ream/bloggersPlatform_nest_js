import { DataSource } from 'typeorm';
import { PlayerAnswer } from 'src/modules/quizGame/types/player-answer';

export async function countPlayersInGame(
  dataSource: DataSource,
  gameId: string,
): Promise<number> {
  const result: { count: number }[] = await dataSource.query(
    `SELECT COUNT(*)::int AS count FROM quiz_players WHERE "gameId" = $1`,
    [gameId],
  );

  return result[0]?.count ?? 0;
}

export async function findGameIdsWithMoreThanTwoPlayers(
  dataSource: DataSource,
): Promise<string[]> {
  const result: { gameId: string }[] = await dataSource.query(`
    SELECT "gameId" FROM quiz_players GROUP BY "gameId" HAVING COUNT(*) > 2
  `);

  return result.map((row) => row.gameId);
}

export async function updatePlayerAnswers(
  dataSource: DataSource,
  params: {
    gameId: string;
    userId: string;
    answers: PlayerAnswer[];
    score?: number;
  },
): Promise<void> {
  const players: { id: string }[] = await dataSource.query(
    `SELECT id FROM quiz_players WHERE "gameId" = $1 AND "userId" = $2`,
    [params.gameId, params.userId],
  );
  const playerId = players[0]?.id;

  if (!playerId) {
    return;
  }

  await dataSource.query(`DELETE FROM quiz_answers WHERE "playerId" = $1`, [
    playerId,
  ]);

  for (const answer of params.answers) {
    await dataSource.query(
      `INSERT INTO quiz_answers ("questionId", "playerId", "answerDate", "status")
       VALUES ($1, $2, $3::timestamptz, $4)`,
      [
        answer.questionId,
        playerId,
        answer.addedAt,
        answer.answerStatus,
      ],
    );
  }

  await dataSource.query(`UPDATE quiz_players SET score = $1 WHERE id = $2`, [
    params.score ?? 0,
    playerId,
  ]);
}
