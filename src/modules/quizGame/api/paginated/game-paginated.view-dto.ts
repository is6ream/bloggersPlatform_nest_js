import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GameViewDto } from '../dto/output/game.view-dto';

export class GamePaginatedViewDto extends PaginatedViewDto<GameViewDto> {
  items: GameViewDto[];
}
