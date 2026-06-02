import { CreateQuestionUseCase } from './useCases/create-question.usecase';
import { DeleteQuestionUseCase } from './useCases/delete-question.usecase';
import { UpdateQuestionUseCase } from './useCases/update-question.usecase';
import { ChangePublicationStatusUseCase } from './useCases/change-publication.status.usecase';

export const quizGameCommandHandlers = [
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  UpdateQuestionUseCase,
  ChangePublicationStatusUseCase,
];
