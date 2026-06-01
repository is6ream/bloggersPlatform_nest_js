import { AnswerStatus } from "./answer-status";

export type PlayerAnswer = {
    questionId: string;
    answerStatus: AnswerStatus;
    addedAt: string;
};