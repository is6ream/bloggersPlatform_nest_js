import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { GameViewDto } from '../../api/dto/output/game.view-dto';
import { GameQueryRepository } from '../../infrastructure/game/game-query.repository';

export class GetGameByIdQuery {
  constructor(
    public readonly gameId: string,
    public readonly userId: string,
  ) { }
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdQueryHandler implements IQueryHandler<GetGameByIdQuery> {
  constructor(private readonly gameQueryRepository: GameQueryRepository) { }

  async execute(query: GetGameByIdQuery): Promise<GameViewDto> {
    const game = await this.gameQueryRepository.findByIdWithPlayers(query.gameId);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const isParticipant = game.players.some(
      (player) => player.userId === query.userId,
    );

    if (!isParticipant) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
      });
    }

    return this.gameQueryRepository.mapGameToView(game);
  }
}
