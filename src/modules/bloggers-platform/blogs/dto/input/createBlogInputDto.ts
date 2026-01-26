import { Length, Matches, IsString } from 'class-validator';

export class CreateBlogInputDto {
  @IsString()
  @Length(1, 15)
  name: string;

  @IsString()
  @Length(1, 500)
  description: string;

  @IsString()
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  @Length(1, 100)
  websiteUrl: string;
}
