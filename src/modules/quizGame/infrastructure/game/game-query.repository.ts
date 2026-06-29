import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { GameOrmEntity } from '../../entities/game.orm-entity';
import { PlayerOrmEntity } from '../../entities/player.orm-entity';
import { GameViewDto } from '../../api/dto/output/game.view-dto';
import { MyStatisticViewDto } from '../../api/dto/output/my-statistic.view-dto';
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
    @InjectRepository(PlayerOrmEntity)
    private readonly playerRepo: Repository<PlayerOrmEntity>,
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

  async getMyStatistic(userId: string): Promise<MyStatisticViewDto> {
    const raw = await this.playerRepo
      .createQueryBuilder('p')
      .innerJoin(
        'quiz_games',
        'g',
        'g.id = p.gameId AND g.gameStatus = :finished',
        { finished: GameStatus.Finished },
      )
      .innerJoin(
        'quiz_players',
        'opp',
        'opp.gameId = p.gameId AND opp.id <> p.id',
      )
      .select('COALESCE(SUM(p.score), 0)', 'sumScore')
      .addSelect('COUNT(*)', 'gamesCount')
      .addSelect('COALESCE(AVG(p.score), 0)', 'avgScores')
      .addSelect('COUNT(*) FILTER (WHERE p.score > opp.score)', 'winsCount')
      .addSelect('COUNT(*) FILTER (WHERE p.score < opp.score)', 'lossesCount')
      .addSelect('COUNT(*) FILTER (WHERE p.score = opp.score)', 'drawsCount')
      .where('p.userId = :userId', { userId })
      .getRawOne<{
        sumScore: string;
        gamesCount: string;
        avgScores: string;
        winsCount: string;
        lossesCount: string;
        drawsCount: string;
      }>();

    const dto = new MyStatisticViewDto();

    dto.sumScore = Number(raw?.sumScore ?? 0);
    dto.gamesCount = Number(raw?.gamesCount ?? 0);
    dto.avgScores = Math.round(Number(raw?.avgScores ?? 0) * 100) / 100;
    dto.winsCount = Number(raw?.winsCount ?? 0);
    dto.lossesCount = Number(raw?.lossesCount ?? 0);
    dto.drawsCount = Number(raw?.drawsCount ?? 0);

    return dto;
  }
}
