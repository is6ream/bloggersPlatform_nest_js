import { Controller, HttpCode, Post, UseGuards, Get } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { HttpStatus } from '@nestjs/common';
import { ConnectToPairCommand } from '../../application/useCases/connect-to-pair.usecase';
import { GameQueryRepository } from '../../infrastructure/game/game-query.repository';
import { GameViewDto } from '../dto/output/game.view-dto';

@Controller('pair-game-quiz')
export class QuizGameController {
    constructor(
        private commandBus: CommandBus,
        private gameQueryRepository: GameQueryRepository,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('pairs/my-current')
    @HttpCode(HttpStatus.OK)
    async getCurrentUnfinishedGame(
        @ExtractUserFromRequest() user: UserContextDto,
    ): Promise<GameViewDto> {
        return await this.gameQueryRepository.getCurrentUnfinishedOrNotFoundFail(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('pairs/connection')
    @HttpCode(HttpStatus.OK)
    async connectToPair(
        @ExtractUserFromRequest() user: UserContextDto,
    ): Promise<GameViewDto> {
        const gameId = await this.commandBus.execute(new ConnectToPairCommand(user.id));
        return await this.gameQueryRepository.getByIdOrNotFoundFail(gameId)
    }
}
