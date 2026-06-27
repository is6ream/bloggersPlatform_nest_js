import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';

import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';

import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';

import { ConnectToPairCommand } from '../../application/useCases/connect-to-pair.usecase';
import { SendAnswerCommand } from '../../application/useCases/send-answer.usecase';

import { SendAnswerInputDto } from '../dto/input/send-answer.input.dto';

import { GameQueryRepository } from '../../infrastructure/game/game-query.repository';

import { AnswerViewDto, GameViewDto } from '../dto/output/game.view-dto';

import { GetGameByIdQuery } from '../../application/queries/get-game-by-id.query';



@Controller('pair-game-quiz')

export class QuizGameController {

    constructor(

        private commandBus: CommandBus,

        private queryBus: QueryBus,

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
    @Get('pairs/:id')
    @HttpCode(HttpStatus.OK)

    async getGameById(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
        @ExtractUserFromRequest() user: UserContextDto,
    ): Promise<GameViewDto> {
        return this.queryBus.execute(new GetGameByIdQuery(id, user.id));
    }

    @UseGuards(JwtAuthGuard)
    @Post('pairs/connection')
    @HttpCode(HttpStatus.OK)

    async connectToPair(
        @ExtractUserFromRequest() user: UserContextDto,
    ): Promise<GameViewDto> {
        const gameId = await this.commandBus.execute(new ConnectToPairCommand(user.id));
        return await this.gameQueryRepository.getByIdOrNotFoundFail(gameId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('pairs/my-current/answers')
    @HttpCode(HttpStatus.OK)
    async sendAnswerForNextAnsweredQuestion(
        @ExtractUserFromRequest() user: UserContextDto,
        @Body() dto: SendAnswerInputDto,
    ): Promise<AnswerViewDto> {
        return await this.commandBus.execute(
            new SendAnswerCommand(user.id, dto.answer),
        );
    }
}
