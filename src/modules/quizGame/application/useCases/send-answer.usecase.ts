import { Injectable } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { GameRepository } from "../../infrastructure/game/game.repository";


export class SendAnswerCommand {
    constructor(
        public userId: string,
        public answer: string
    ) { }
}

@Injectable()
@CommandHandler(SendAnswerCommand)
export class SendAnswerUsecase
    implements ICommandHandler<SendAnswerCommand> {
    constructor(
        private gameRepository: GameRepository
    ) { }

    async execute(command: SendAnswerCommand): Promise<any> {
        const game = await this.gameRepository.findActiveGameWithQuestionsByUserId(command.userId);
    }
}