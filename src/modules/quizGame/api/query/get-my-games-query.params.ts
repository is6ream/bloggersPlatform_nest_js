import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';
import { IsEnum } from 'class-validator';

export enum GamesSortBy {
  PairCreatedDate = 'pairCreatedDate',
  Status = 'status',
  StartGameDate = 'startGameDate',
  FinishGameDate = 'finishGameDate',
}

export class GetMyGamesQueryParams extends BaseQueryParams {
  @IsEnum(GamesSortBy)
  sortBy: GamesSortBy = GamesSortBy.PairCreatedDate;
}
