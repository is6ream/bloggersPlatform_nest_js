import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { GameOrmEntity } from '../../entities/game.orm-entity';
import { QuestionOrmEntity } from '../../entities/question.orm-entity';
import { GameViewDto } from '../../api/dto/output/game.view-dto';
import { GameStatus } from '../../types/game-status';

@Injectable()
export class GameQueryRepository {
  constructor(
    @InjectRepository(GameOrmEntity)
    private readonly gameRepo: Repository<GameOrmEntity>,
    @InjectRepository(QuestionOrmEntity)
    private readonly questionRepo: Repository<QuestionOrmEntity>,
  ) {}

  async findByIdWithPlayers(id: string): Promise<GameOrmEntity | null> {
    return this.gameRepo.findOne({
      where: { id, deleteAt: IsNull() },
      relations: { players: { user: true } },
    });
  }

  async mapGameToView(game: GameOrmEntity): Promise<GameViewDto> {
    const questions = game.questionIds.length
      ? await this.questionRepo.find({
          where: { id: In(game.questionIds), deleteAt: IsNull() },
        })
      : [];

    return GameViewDto.mapToView(game, questions);
  }

  async getByIdOrNotFoundFail(id: string): Promise<GameViewDto> {
    const game = await this.findByIdWithPlayers(id);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.mapGameToView(game);
  }

  async getCurrentUnfinishedOrNotFoundFail(userId: string): Promise<GameViewDto> {
    const game = await this.gameRepo
      .createQueryBuilder('game')
      .innerJoinAndSelect('game.players', 'player')
      .innerJoinAndSelect('player.user', 'user')
      .where('player.userId = :userId', { userId })
      .andWhere('game.status IN (:...statuses)', {
        statuses: [GameStatus.PendingSecondPlayer, GameStatus.Active],
      })
      .andWhere('game.deleteAt IS NULL')
      .getOne();

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.mapGameToView(game);
  }
}
