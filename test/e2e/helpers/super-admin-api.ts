import request from 'supertest';
import { e2eApiPath } from './api-path';

const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;

export const SA_QUIZ_PATH = e2eApiPath('sa/quiz/questions');
export const TESTING_ALL_DATA_PATH = e2eApiPath('testing/all-data');

type HttpServer = Parameters<typeof request>[0];

type CreateQuestionBody = {
  body: string;
  correctAnswers: string[];
};

type UpdateQuestionBody = CreateQuestionBody;

function withBasicAuth(httpServer: HttpServer) {
  return {
    get: (path: string) =>
      request(httpServer).get(path).set('Authorization', BASIC_AUTH),
    post: (path: string) =>
      request(httpServer).post(path).set('Authorization', BASIC_AUTH),
    put: (path: string) =>
      request(httpServer).put(path).set('Authorization', BASIC_AUTH),
    delete: (path: string) =>
      request(httpServer).delete(path).set('Authorization', BASIC_AUTH),
  };
}

export function superAdminApi(httpServer: HttpServer) {
  const sa = withBasicAuth(httpServer);

  return {
    clearAllData: () => request(httpServer).delete(TESTING_ALL_DATA_PATH),

    quiz: {
      getAll: (query?: Record<string, string | number | boolean>) =>
        sa.get(SA_QUIZ_PATH).query(query ?? {}),

      create: (body: CreateQuestionBody) => sa.post(SA_QUIZ_PATH).send(body),

      update: (id: string, body: UpdateQuestionBody) =>
        sa.put(`${SA_QUIZ_PATH}/${id}`).send(body),

      delete: (id: string) => sa.delete(`${SA_QUIZ_PATH}/${id}`),

      changePublicationStatus: (id: string, published: boolean) =>
        sa.put(`${SA_QUIZ_PATH}/${id}/publish`).send({ published }),
    },
  };
}
