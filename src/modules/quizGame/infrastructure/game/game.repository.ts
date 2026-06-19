import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GameOrmEntity } from '../../entities/game.orm-entity';
import { PlayerOrmEntity } from '../../entities/player.orm-entity';
import { GameQuestion } from '../../entities/game-question.orm-entity';
import { GameStatus } from '../../types/game-status';

@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(GameOrmEntity)
    private readonly gameRepo: Repository<GameOrmEntity>,
    private readonly dataSource: DataSource,
  ) { }

  async findActiveGameByUserId(userId: string): Promise<GameOrmEntity | null> {
    return this.gameRepo
      .createQueryBuilder('game')
      .innerJoin('quiz_players', 'player', 'player."gameId" = game.id')
      .where('player."userId" = :userId', { userId })
      .andWhere('game.gameStatus IN (:...statuses)', {
        statuses: [GameStatus.PendingSecondPlayer, GameStatus.Active],
      })
      .getOne();
  }

  async findGamePendingSecondPlayer(
    userId: string,
  ): Promise<GameOrmEntity | null> {
    return this.buildJoinablePendingGameQuery(this.gameRepo.createQueryBuilder('game'), userId)
      .getOne();
  }

  async tryJoinPendingGameAsSecondPlayer(
    userId: string,
    questionIds: string[],
  ): Promise<string | null> {
    return this.dataSource.transaction(async (manager) => {
      const pendingGame = await this.buildJoinablePendingGameQuery(
        manager.createQueryBuilder(GameOrmEntity, 'game'),
        userId,
      )
        .setLock('pessimistic_partial_write')
        .getOne();

      if (!pendingGame) {
        return null;
      }

      const player = PlayerOrmEntity.create({
        userId,
        gameId: pendingGame.id,
      });
      const savedPlayer = await manager.save(PlayerOrmEntity, player);

      pendingGame.addSecondPlayer(savedPlayer);

      const gameQuestions = questionIds.map((questionId, index) =>
        GameQuestion.create(questionId, pendingGame.id, index),
      );

      await manager.save(GameQuestion, gameQuestions);
      await manager.save(GameOrmEntity, pendingGame);

      return pendingGame.id;
    });
  }

  async saveGameAndFirstPlayer(
    game: GameOrmEntity,
    userId: string,
  ): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const savedGame = await manager.save(GameOrmEntity, game);
      const player = PlayerOrmEntity.create({
        userId,
        gameId: savedGame.id,
      });
      const savedPlayer = await manager.save(PlayerOrmEntity, player);

      savedGame.setFirstPlayer(savedPlayer);
      await manager.save(GameOrmEntity, savedGame);

      return savedGame.id;
    });
  }

  private buildJoinablePendingGameQuery(
    qb: ReturnType<Repository<GameOrmEntity>['createQueryBuilder']>,
    userId: string,
  ) {
    return qb
      .where('game.gameStatus = :status', {
        status: GameStatus.PendingSecondPlayer,
      })
      .andWhere('game.deleteAt IS NULL')
      .andWhere('game."secondPlayerId" IS NULL')
      .andWhere('game."firstPlayerId" IS NOT NULL')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM quiz_players p
          WHERE p."gameId" = game.id AND p."userId" = :userId
        )`,
        { userId },
      )
      .orderBy('game.createdAt', 'ASC');
  }
}
