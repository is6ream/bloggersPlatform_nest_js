import { expect } from '@jest/globals';

function expectIsoDateString(value: unknown): void {
  expect(typeof value).toBe('string');
  expect(new Date(value as string).toISOString()).toBe(value);
}

export function expectAnswerViewShape(answer: unknown): void {
  expect(answer).toMatchObject({
    questionId: expect.any(String),
    answerStatus: expect.stringMatching(/^(Correct|Incorrect)$/),
    addedAt: expect.any(String),
  });
  expectIsoDateString((answer as { addedAt: string }).addedAt);
}

export function expectPlayerProgressViewShape(progress: unknown): void {
  expect(progress).toMatchObject({
    answers: expect.any(Array),
    player: {
      id: expect.any(String),
      login: expect.any(String),
    },
    score: expect.any(Number),
  });

  for (const answer of (progress as { answers: unknown[] }).answers) {
    expectAnswerViewShape(answer);
  }
}

export function expectGameViewShape(body: unknown): void {
  const game = body as {
    id: string;
    firstPlayerProgress: unknown;
    secondPlayerProgress: unknown | null;
    questions: unknown[];
    status: string;
    pairCreatedDate: string;
    startGameDate: string | null;
    finishGameDate: string | null;
  };

  expect(game.id).toEqual(expect.any(String));
  expectPlayerProgressViewShape(game.firstPlayerProgress);

  if (game.secondPlayerProgress !== null) {
    expectPlayerProgressViewShape(game.secondPlayerProgress);
  } else {
    expect(game.secondPlayerProgress).toBeNull();
  }

  expect(Array.isArray(game.questions)).toBe(true);
  for (const question of game.questions) {
    expect(question).toMatchObject({
      id: expect.any(String),
      body: expect.any(String),
    });
  }

  expect(game.status).toMatch(/^(PendingSecondPlayer|Active|Finished)$/);
  expectIsoDateString(game.pairCreatedDate);

  if (game.startGameDate !== null) {
    expectIsoDateString(game.startGameDate);
  } else {
    expect(game.startGameDate).toBeNull();
  }

  if (game.finishGameDate !== null) {
    expectIsoDateString(game.finishGameDate);
  } else {
    expect(game.finishGameDate).toBeNull();
  }
}
