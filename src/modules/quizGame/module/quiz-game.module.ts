import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameOrmEntity } from '../entities/game.orm-entity';
import { PlayerOrmEntity } from '../entities/player.orm-entity';
import { QuestionOrmEntity } from '../entities/question.orm-entity';
import { UserOrmEntity } from 'src/modules/user-accounts/infrastructure/users/entities/user.orm-entity';
import { QuizGameController } from '../api/controllers/quiz-game.sa.controller';
import { QuizGameController as PairGameQuizController } from '../api/controllers/quiz-game.controller';
import { QuizGameRepository } from '../infrastructure/questions/question.repository';
import { QuizGameQueryRepository } from '../infrastructure/questions/question-query.repository';
import { quizGameCommandHandlers } from '../application/quiz-game-command-handlers';
import { UserAccountsModule } from 'src/modules/user-accounts/userAccounts.module';

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
    QuizGameRepository,
    QuizGameQueryRepository,
    ...quizGameCommandHandlers,
  ],
})
export class QuizGameModule {}
