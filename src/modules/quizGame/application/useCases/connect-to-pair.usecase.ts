import { ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { CommandHandler } from "@nestjs/cqrs";
import { QuizGameRepository } from "../../infrastructure/questions/question.repository";

export class ConnectToPairCommand {
    constructor(
        userId: string
    ) { }
}

@Injectable()
@CommandHandler(ConnectToPairCommand)
export class ConnectToPairUseCase implements ICommandHandler<ConnectToPairCommand> {
    constructor(
        quizGameRepository: QuizGameRepository
    ) { }

    execute(command: ConnectToPairCommand): Promise<any> {

    }
}