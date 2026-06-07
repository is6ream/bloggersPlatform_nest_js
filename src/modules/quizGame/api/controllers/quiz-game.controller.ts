import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { QuizGameQueryRepository } from '../../infrastructure/questions/question-query.repository';
import { HttpStatus } from '@nestjs/common';
@Controller('pair-game-quiz')
export class QuizGameController {
    constructor(
        private commandBus: CommandBus,
        private quizGameQueryRepository: QuizGameQueryRepository,
    ) { }

    async getCurrentUnfinishedGame(

    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('pairs/connection')
    @HttpCode(HttpStatus.OK)
    async connectToPair(
        @ExtractUserFromRequest() user: UserContextDto,
    ): Promise<void> {
        return await this.commandBus.execute(new ConnectToPairCommand())
    }
}