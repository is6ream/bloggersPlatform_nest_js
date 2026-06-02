import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { QuestionViewDto } from '../dto/output/question.view-dto';

export class QuestionPaginatedViewDto extends PaginatedViewDto<QuestionViewDto> {
  items: QuestionViewDto[];
}
