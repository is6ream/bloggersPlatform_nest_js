import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GameOrmEntity } from '../../entities/game.orm-entity';
import { PlayerOrmEntity } from '../../entities/player.orm-entity';
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
      .innerJoin('game.players', 'player')
      .where('player.userId = :userId', { userId })
      .andWhere('game.status IN (:...statuses)', {
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

      pendingGame.activate(questionIds);

      await manager.save(GameOrmEntity, pendingGame);
      await manager.save(PlayerOrmEntity, player);

      return pendingGame.id;
    });
  }

  async saveGameAndPlayer(
    game: GameOrmEntity,
    player: PlayerOrmEntity,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.save(GameOrmEntity, game);
      await manager.save(PlayerOrmEntity, player);
    });
  }

  private buildJoinablePendingGameQuery(
    qb: ReturnType<Repository<GameOrmEntity>['createQueryBuilder']>,
    userId: string,
  ) {
    return qb
      .where('game.status = :status', {
        status: GameStatus.PendingSecondPlayer,
      })
      .andWhere('game.deleteAt IS NULL')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM quiz_players p
          WHERE p."gameId" = game.id AND p."userId" = :userId
        )`,
        { userId },
      )
      .andWhere(
        `(SELECT COUNT(*)::int FROM quiz_players p WHERE p."gameId" = game.id) = 1`,
      )
      .orderBy('game.createdAt', 'ASC');
  }
}
