import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/questions/question.repository';

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
  constructor(private quizGameRepository: QuestionRepository) {}

  async execute(command: ChangePublicationStatusCommand): Promise<void> {
    const question = await this.quizGameRepository.findOrNotFoundFail(
      command.id,
    );

    question.changePublicationStatus(command.published);
    await this.quizGameRepository.save(question);
  }
}
