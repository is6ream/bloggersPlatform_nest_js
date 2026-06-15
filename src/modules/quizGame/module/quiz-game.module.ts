import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameOrmEntity } from '../entities/game.orm-entity';
import { PlayerOrmEntity } from '../entities/player.orm-entity';
import { QuestionOrmEntity } from '../entities/question.orm-entity';
import { UserOrmEntity } from 'src/modules/user-accounts/infrastructure/users/entities/user.orm-entity';
import { QuizGameController } from '../api/controllers/quiz-game.sa.controller';
import { QuizGameController as PairGameQuizController } from '../api/controllers/quiz-game.controller';
import { GameRepository } from '../infrastructure/game/game.repository';
import { quizGameCommandHandlers } from '../application/quiz-game-command-handlers';
import { quizGameQueryHandlers } from '../application/quiz-game-query-handlers';
import { UserAccountsModule } from 'src/modules/user-accounts/userAccounts.module';
import { QuestionRepository } from '../infrastructure/questions/question.repository';
import { GameQueryRepository } from '../infrastructure/game/game-query.repository';
import { QuestionsQueryRepository } from '../infrastructure/questions/question-query.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameOrmEntity,
      PlayerOrmEntity,
      QuestionOrmEntity,
      UserOrmEntity,
    ]),
    UserAccountsModule,
  ],
  controllers: [QuizGameController, PairGameQuizController],
  providers: [
    GameRepository,
    GameQueryRepository,
    QuestionRepository,
    QuestionsQueryRepository,
    ...quizGameCommandHandlers,
    ...quizGameQueryHandlers,
  ],
})
export class QuizGameModule { }
