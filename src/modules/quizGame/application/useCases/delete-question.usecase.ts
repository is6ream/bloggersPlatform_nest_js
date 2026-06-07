import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../infrastructure/questions/question.repository';

export class DeleteQuestionCommand {
  constructor(public id: string) {}
}

@Injectable()
@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(private quizGameRepository: QuizGameRepository) {}

  async execute(command: DeleteQuestionCommand): Promise<void> {
    const question = await this.quizGameRepository.findOrNotFoundFail(
      command.id,
    );

    question.makeDeleted();

    await this.quizGameRepository.save(question);
  }
}
