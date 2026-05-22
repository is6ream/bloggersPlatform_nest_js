import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { GetBlogsQueryParams } from "../api/query/get-blogs-query-params";
import { BlogViewDto } from '../dto/output/blogViewDto';
import { BlogPaginatedViewDto } from '../api/paginated/paginated.blog.view-dto';
import { BlogsOrmEntity } from '../domain/blog.orm-entity';


@Injectable()
export class BlogsQueryRepository {
    constructor(
    @InjectRepository(BlogsOrmEntity)
        private readonly repo: Repository<BlogsOrmEntity>,
    ) { }

    async getAll(query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogViewDto>> {
        const searchTerm = query.searchNameTerm?.trim() ?? '';
        const sortDirection = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';
        const sortByMap: Record<string, string> = {
            createdAt: 'b.createdAt',
            name: 'b.name',
            description: 'b.description',
            websiteUrl: 'b.websiteUrl'
        }

        const orderByField = sortByMap[query.sortBy] ?? 'b.createdAt';

        const qb = this.repo
            .createQueryBuilder('b')
            .where('b.deleteAt IS NULL')

        if (searchTerm) {
            qb.andWhere('b.name ILIKE :search', { search: `%${searchTerm}%` });
        }

        const orderExpr =
            orderByField === 'b.name'
                ? `${orderByField} COLLATE "C"`
                : orderByField;

        qb.orderBy(orderExpr, sortDirection)
            .skip(query.calculateSkip())
            .take(query.pageSize);

        const [items, totalCount] = await qb.getManyAndCount();

        return BlogPaginatedViewDto.mapToView({
            items: items.map((blog) => BlogViewDto.mapToView(blog)),
            page: query.pageNumber,
            size: query.pageSize,
            totalCount,
        });


    }

    async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
        const blog = await this.repo.findOne({
            where: { id, deleteAt: IsNull() },
        });

        if (!blog) {
            throw new DomainException({ code: 1, message: 'Blog not found' });
        }

        return BlogViewDto.mapToView(blog);
    }
}
