import { IsMongoId, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePostInputDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 30)
  title: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 100)
  shortDescription: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 1000)
  content: string;

  @IsString()
  @IsMongoId()
  blogId: string;
}
