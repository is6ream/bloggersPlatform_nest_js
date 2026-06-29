import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { GameOrmEntity } from '../../entities/game.orm-entity';
import { GameViewDto } from '../../api/dto/output/game.view-dto';
import { GameStatus } from '../../types/game-status';
import {
  GamesSortBy,
  GetMyGamesQueryParams,
} from '../../api/query/get-my-games-query.params';
import { GamePaginatedViewDto } from '../../api/paginated/game-paginated.view-dto';

const GAMES_SORT_COLUMN: Record<GamesSortBy, string> = {
  [GamesSortBy.Status]: 'gameStatus',
  [GamesSortBy.PairCreatedDate]: 'pairCreatedDate',
  [GamesSortBy.StartGameDate]: 'startGameDate',
  [GamesSortBy.FinishGameDate]: 'finishGameDate',
};

@Injectable()
export class GameQueryRepository {
  constructor(
    @InjectRepository(GameOrmEntity)
    private readonly gameRepo: Repository<GameOrmEntity>,
  ) { }

  async findByIdWithPlayers(id: string): Promise<GameOrmEntity | null> {
    //показать как будет с query builder
    return this.gameRepo.findOne({
      where: { id, deleteAt: IsNull() },
      relations: {
        firstPlayer: { user: true, answers: true },
        secondPlayer: { user: true, answers: true },
        gameQuestions: { question: true },
      },
    });
  }

  async mapGameToView(game: GameOrmEntity): Promise<GameViewDto> {
    return GameViewDto.mapToView(game);
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
      .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
      .leftJoinAndSelect('firstPlayer.user', 'firstUser')
      .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
      .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
      .leftJoinAndSelect('secondPlayer.user', 'secondUser')
      .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
      .leftJoinAndSelect('game.gameQuestions', 'gameQuestion')
      .leftJoinAndSelect('gameQuestion.question', 'question')
      .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', {
        userId,
      })
      .andWhere('game.gameStatus IN (:...statuses)', {
        statuses: [GameStatus.PendingSecondPlayer, GameStatus.Active],
      })
      .andWhere('game.deleteAt IS NULL')
      .getOne();

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.mapGameToView(game);
  }

  async getAllMyGames(
    userId: string,
    query: GetMyGamesQueryParams,
  ): Promise<GamePaginatedViewDto> {
    const sortColumn = GAMES_SORT_COLUMN[query.sortBy];
    const sortDirection =
      query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.gameRepo
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
      .leftJoinAndSelect('firstPlayer.user', 'firstUser')
      .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
      .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
      .leftJoinAndSelect('secondPlayer.user', 'secondUser')
      .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
      .leftJoinAndSelect('game.gameQuestions', 'gameQuestion')
      .leftJoinAndSelect('gameQuestion.question', 'question')
      .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', {
        userId,
      })
      .andWhere('game.deleteAt IS NULL')
      .orderBy(`game.${sortColumn}`, sortDirection);

    // Вторичный критерий: при равных значениях основного поля — pairCreatedDate desc
    if (query.sortBy !== GamesSortBy.PairCreatedDate) {
      qb.addOrderBy('game.pairCreatedDate', 'DESC');
    }

    const [games, totalCount] = await qb
      .skip(query.calculateSkip())
      .take(query.pageSize)
      .getManyAndCount();

    return GamePaginatedViewDto.mapToView({
      items: games.map((game) => GameViewDto.mapToView(game)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
