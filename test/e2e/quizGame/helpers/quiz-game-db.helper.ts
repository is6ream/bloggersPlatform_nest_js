import { DataSource } from 'typeorm';

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
