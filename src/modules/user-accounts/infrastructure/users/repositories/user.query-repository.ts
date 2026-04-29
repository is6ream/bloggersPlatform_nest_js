import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { GetUsersQueryParams } from 'src/modules/user-accounts/api/dto/output/get-users-query-params.input.dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { UserViewDto } from 'src/modules/user-accounts/api/dto/output/user.view-dto';
import { UserPaginatedViewDto } from 'src/modules/user-accounts/api/dto/output/paginatied.user.view-dto';

@Injectable()
export class UsersOrmQueryRepository {
    constructor(
        @InjectRepository(UserOrmEntity)
        private readonly repo: Repository<UserOrmEntity>
    ) { }

    async getAll(query: GetUsersQueryParams): Promise<PaginatedViewDto<UserViewDto>> {
        const searchLogin = query.searchLoginTerm?.trim() ?? '';
        const searchEmail = query.searchEmailTerm?.trim() ?? '';
        const sortDirection = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';

        const sortByMap: Record<string, string> = {
            createdAt: 'u.createdAt',
            login: 'u.login',
            email: 'u.email',
        };

        // по дефолту стоит поле createdAt
        const orderByField = sortByMap[query.sortBy] ?? 'u.createdAt';

        const qb = this.repo
            .createQueryBuilder('u')
            .where('u.deleteAt IS NULL');

        if (searchLogin && searchEmail) {
            qb.andWhere(
                new Brackets((qb) => {
                    qb.where('u.login ILIKE :login', { login: `%${searchLogin}%` }).orWhere(
                        'u.email ILIKE :email',
                        { email: `%${searchEmail}%` },
                    );
                }),
            );
        } else if (searchLogin) {
            qb.andWhere('u.login ILIKE :login', { login: `%${searchLogin}%` });
        } else if (searchEmail) {
            qb.andWhere('u.email ILIKE :email', { email: `%${searchEmail}%` });
        }

        qb.orderBy(orderByField, sortDirection)
            .skip(query.calculateSkip())
            .take(query.pageSize);

        const [items, totalCount] = await qb.getManyAndCount();

        return UserPaginatedViewDto.mapToView({
            items: items.map(UserViewDto.fromOrm),
            page: query.pageNumber,
            size: query.pageSize,
            totalCount,
        });
    }
}
