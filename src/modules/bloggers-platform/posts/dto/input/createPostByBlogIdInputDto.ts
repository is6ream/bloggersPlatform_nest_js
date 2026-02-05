import { Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostByBlogIdInputDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 30)
  title: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 100)
  shortDescription: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 1000)
  content: string;
}
