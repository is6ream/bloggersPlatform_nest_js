import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { GetQuestionsQueryParams } from '../query/get-questions-query.params';
import { QuestionPaginatedViewDto } from '../paginated/question-paginated.view-dto';
import { CreateQuestionInputDto } from '../dto/input/create-question.input.dto';
import { UpdateQuestionInputDto } from '../dto/input/update-question.input.dto';
import { ChangeQuestionPublicationStatusInputDto } from '../dto/input/change-question-publication-status.input.dto';
import { QuestionViewDto } from '../dto/output/question.view-dto';
import { CreateQuestionCommand } from '../../application/useCases/create-question.usecase';
import { DeleteQuestionCommand } from '../../application/useCases/delete-question.usecase';
import { UpdateQuestionCommand } from '../../application/useCases/update-question.usecase';
import { ChangePublicationStatusCommand } from '../../application/useCases/change-publication.status.usecase';
import { QuestionsQueryRepository } from '../../infrastructure/questions/question-query.repository';

@Controller('sa/quiz/questions')
export class QuizGameController {
    constructor(
        private questionsQueryRepository: QuestionsQueryRepository,
        private commandBus: CommandBus,
    ) { }

    @UseGuards(BasicAuthGuard)
    @Get()
    async getAll(
        @Query() query: GetQuestionsQueryParams,
    ): Promise<QuestionPaginatedViewDto> {
        return this.questionsQueryRepository.getAllQuestions(query);
    }

    @UseGuards(BasicAuthGuard)
    @Post()
    async createQuestion(
        @Body() body: CreateQuestionInputDto,
    ): Promise<QuestionViewDto> {
        const questionId = await this.commandBus.execute(
            new CreateQuestionCommand(body),
        );

        return this.questionsQueryRepository.getByIdOrNotFoundFail(questionId);
    }

    @UseGuards(BasicAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteQuestion(@Param('id') id: string): Promise<void> {
        return this.commandBus.execute(new DeleteQuestionCommand(id));
    }

    @UseGuards(BasicAuthGuard)
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateQuestion(
        @Param('id') id: string,
        @Body() updateQuestionDto: UpdateQuestionInputDto,
    ): Promise<void> {
        return await this.commandBus.execute(
            new UpdateQuestionCommand(id, updateQuestionDto),
        );
    }

    @UseGuards(BasicAuthGuard)
    @Put(':id/publish')
    @HttpCode(HttpStatus.NO_CONTENT)
    async changeQuestionPublicationStatus(
        @Param('id') id: string,
        @Body() body: ChangeQuestionPublicationStatusInputDto
    ): Promise<void> {
        return await this.commandBus.execute(
            new ChangePublicationStatusCommand(id, body.published)
        )
    };
}





