import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateQuestionInputDto } from '../../api/dto/input/update-question.input.dto';
import { QuizGameRepository } from '../../infrastructure/quiz-game.repository';
import { QuestionOrmEntity } from '../../entities/question.orm-entity';

export class UpdateQuestionCommand {
  constructor(
    public id: string,
    public dto: UpdateQuestionInputDto,
  ) { }
}

@Injectable()
@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand> {
  constructor(private quizGameRepository: QuizGameRepository) { }

  async execute(command: UpdateQuestionCommand): Promise<void> {
    const question: QuestionOrmEntity = await this.quizGameRepository.findOrNotFoundFail(
      command.id,
    );

    question.update(command.dto);

    await this.quizGameRepository.save(question);
  }
}
