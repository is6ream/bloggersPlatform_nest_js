import { IsString, Length } from 'class-validator';

export class UpdateBlogDto {
  @Length(1, 15)
  @IsString()
  name: string;
  @Length(1, 500)
  @IsString()
  description: string;
  @Length(1, 100)
  @IsString()
  websiteUrl: string;
}
