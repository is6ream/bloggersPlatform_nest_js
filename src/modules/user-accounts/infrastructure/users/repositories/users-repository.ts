import { UserOrmEntity } from './../entities/user.orm-entity';
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(UserOrmEntity)
        private readonly repo: Repository<UserOrmEntity>
    ) { }

    async findById(id: string): Promise<UserOrmEntity | null> {
        return this.repo.findOne({ where: { id } });
    }

    async findByIdOrThrowValidationError(id: string): Promise<UserOrmEntity> {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            throw new BadRequestException('User not found');
        }
        return user;
    }

    async findOrNotFoundFail(id: string): Promise<UserOrmEntity> {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('user not found');
        }
        return user;
    }


    async findByLogin(login: string): Promise<UserOrmEntity | null> {
        return this.repo.findOne({ where: { login } });
    }

    async save(user: UserOrmEntity): Promise<void> {
        await this.repo.save(user);
    }

}