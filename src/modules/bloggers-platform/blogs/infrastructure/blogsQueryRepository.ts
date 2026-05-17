import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GetBlogsQueryParams } from "../api/query/get-blogs-query-params";
import { BlogViewDto } from '../dto/output/blogViewDto';
import { BlogPaginatedViewDto } from '../api/paginated/paginated.blog.view-dto';
import { BlogsOrmEntity } from './entity/blog-orm.entity';


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
            items: items.map(BlogViewDto.mapToView),
            page: query.pageNumber,
            size: query.pageSize,
            totalCount,
        });


    }

}