import { Length, IsString, IsUrl, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBlogInputDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 15)
  name: string;

  @IsString()
  @Length(1, 500)
  description: string;

  @IsUrl()
  @Length(1, 100)
  websiteUrl: string;
}