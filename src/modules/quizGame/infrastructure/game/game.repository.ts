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
    return this.gameRepo
      .createQueryBuilder('game')
      .where('game.status = :status', {
        status: GameStatus.PendingSecondPlayer,
      })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM quiz_players p
          WHERE p."gameId" = game.id AND p."userId" = :userId
        )`,
        { userId },
      )
      .orderBy('game.createdAt', 'ASC')
      .getOne();
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
}
