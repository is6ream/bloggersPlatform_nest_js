import { BlogDocument } from '../../domain/blogEntity';
import { BlogSqlEntity } from '../../domain/blog-sql.entity';
import { BlogsOrmEntity } from '../../infrastructure/entity/blog-orm.entity';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;

  static mapToView(
    blog: BlogDocument | BlogSqlEntity | BlogsOrmEntity,
  ): BlogViewDto {
    const dto = new this();

    dto.id = '_id' in blog ? blog._id.toString() : blog.id;
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;

    return dto;
  }

}
