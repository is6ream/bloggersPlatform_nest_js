import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CreateQuestionInputDto } from '../../api/dto/input/create-question.input.dto';
import { QuizGameRepository } from '../../infrastructure/quiz-game.repository';
import { QuestionOrmEntity } from '../../entities/question.orm-entity';

export class CreateQuestionCommand {
  constructor(public dto: CreateQuestionInputDto) {}
}

@Injectable()
@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase implements ICommandHandler<CreateQuestionCommand> {
  constructor(private quizGameRepository: QuizGameRepository) {}

  async execute(command: CreateQuestionCommand): Promise<string> {
    const question = QuestionOrmEntity.create(command.dto);
    await this.quizGameRepository.save(question);
    return question.id;
  }
}
