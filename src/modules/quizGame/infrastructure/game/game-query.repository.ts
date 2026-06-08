import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { GameOrmEntity } from '../../entities/game.orm-entity';
import { QuestionOrmEntity } from '../../entities/question.orm-entity';
import { GameViewDto } from '../../api/dto/output/game.view-dto';

@Injectable()
export class GameQueryRepository {
  constructor(
    @InjectRepository(GameOrmEntity)
    private readonly gameRepo: Repository<GameOrmEntity>,
    @InjectRepository(QuestionOrmEntity)
    private readonly questionRepo: Repository<QuestionOrmEntity>,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<GameViewDto> {
    const game = await this.gameRepo.findOne({
      where: { id, deleteAt: IsNull() },
      relations: { players: { user: true } },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const questions = game.questionIds.length
      ? await this.questionRepo.find({
          where: { id: In(game.questionIds), deleteAt: IsNull() },
        })
      : [];

    return GameViewDto.mapToView(game, questions);
  }
}
