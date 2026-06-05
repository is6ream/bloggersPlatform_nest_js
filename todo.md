# Quiz Game — TODO

- [ ] Обновить `QuestionOrmEntity`: заменить `answer: string` на `correctAnswers: string[]` (JSON-колонка в Postgres), добавить `updatedAt` (nullable).
- [ ] Добавить миграцию под новую схему `quiz_questions`.
- [ ] Реализовать `QuestionViewModel.mapToView` и маппинг в `QuizGameQueryRepository.getAllQuestions`.
- [ ] Подключить `getAll` в `QuizGameController` к query-репозиторию с `QuestionPaginatedViewDto`.
