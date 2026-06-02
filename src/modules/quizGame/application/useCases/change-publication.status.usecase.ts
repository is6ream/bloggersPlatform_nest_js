import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../infrastructure/quiz-game.repository';

export class ChangePublicationStatusCommand {
  constructor(
    public id: string,
    public published: boolean,
  ) {}
}

@Injectable()
@CommandHandler(ChangePublicationStatusCommand)
export class ChangePublicationStatusUseCase
  implements ICommandHandler<ChangePublicationStatusCommand>
{
  constructor(private quizGameRepository: QuizGameRepository) {}

  async execute(command: ChangePublicationStatusCommand): Promise<void> {
    const question = await this.quizGameRepository.findOrNotFoundFail(
      command.id,
    );

    question.changePublicationStatus(command.published);
    await this.quizGameRepository.save(question);
  }
}
