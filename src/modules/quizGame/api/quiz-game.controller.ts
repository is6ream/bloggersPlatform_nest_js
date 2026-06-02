import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { QuizGameQueryRepository } from '../infrastructure/quiz-game-query.repository';
import { GetQuestionsQueryParams } from './query/get-questions-query.params';
import { QuestionPaginatedViewDto } from './paginated/question-paginated.view-dto';
import { CreateQuestionInputDto } from './dto/input/create-question.input.dto';
import { QuestionViewDto } from './dto/output/question.view-dto';
import { CreateQuestionCommand } from '../application/useCases/create-question.usecase';

@Controller('sa/quiz')
export class QuizGameController {
  constructor(
    private quizGameQueryRepository: QuizGameQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async getAll(
    @Query() query: GetQuestionsQueryParams,
  ): Promise<QuestionPaginatedViewDto> {
    return this.quizGameQueryRepository.getAllQuestions(query);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createQuestion(
    @Body() body: CreateQuestionInputDto,
  ): Promise<QuestionViewDto> {
    const questionId = await this.commandBus.execute(
      new CreateQuestionCommand(body),
    );

    return this.quizGameQueryRepository.getByIdOrNotFoundFail(questionId);
  }
}
