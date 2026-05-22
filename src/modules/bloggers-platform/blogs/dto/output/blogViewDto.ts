import { BlogSqlEntity } from '../../domain/blog-sql.entity';
import { BlogsOrmEntity } from '../../domain/blog.orm-entity';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;

  static mapToView(
    blog: BlogSqlEntity | BlogsOrmEntity,
  ): BlogViewDto {
    const dto = new this();

    dto.id = blog.id;
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;

    return dto;
  }

}
