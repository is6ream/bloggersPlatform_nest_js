import { IsString, Length, Matches } from 'class-validator';
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
  @Matches(
    /^([a-f\d]{24}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
    { message: 'blogId must be a valid id' },
  )
  blogId: string;
}
