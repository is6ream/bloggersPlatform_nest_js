import { Length } from 'class-validator';
import { IsString } from 'class-validator';
export class CreateBlogInputDto {
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
