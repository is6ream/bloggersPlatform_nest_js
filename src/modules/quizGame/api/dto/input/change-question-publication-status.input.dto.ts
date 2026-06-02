import { IsBoolean } from 'class-validator';

export class ChangeQuestionPublicationStatusInputDto {
  @IsBoolean()
  published: boolean;
}
