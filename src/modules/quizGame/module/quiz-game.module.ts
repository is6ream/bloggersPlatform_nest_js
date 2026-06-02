import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameOrmEntity } from '../entities/game.orm-entity';
import { PlayerOrmEntity } from '../entities/player.orm-entity';
import { QuestionOrmEntity } from '../entities/question.orm-entity';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { QuizGameController } from '../api/quiz-game.controller';
import { QuizGameRepository } from '../infrastructure/quiz-game.repository';
import { QuizGameQueryRepository } from '../infrastructure/quiz-game-query.repository';
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
  controllers: [QuizGameController],
  providers: [
    QuizGameRepository,
    QuizGameQueryRepository,
    ...quizGameCommandHandlers,
  ],
})
export class QuizGameModule {}
