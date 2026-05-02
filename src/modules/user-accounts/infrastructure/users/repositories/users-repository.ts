import { UserOrmEntity } from './../entities/user.orm-entity';
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { LoginOrEmailDto } from '../../dto/login-or-email.dto';

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
        return this.repo.findOne({ where: { login, deleteAt: IsNull() } });
    }

    async findByEmail(email: string): Promise<UserOrmEntity | null> {
        return this.repo.findOne({ where: { email, deleteAt: IsNull() } });
    }

    async findUserByLoginOrEmail(dto: LoginOrEmailDto): Promise<UserOrmEntity | null> {
        return this.repo.findOne({
            where: [
                { login: dto.login, deleteAt: IsNull() },
                { email: dto.email, deleteAt: IsNull() },
            ],
        });
    }

    async findByRecoveryCode(code: string): Promise<UserOrmEntity | null> {
        return this.repo.findOne({ where: { recoveryCode: code, deleteAt: IsNull() } });
    }

    async findByConfirmationCode(code: string): Promise<UserOrmEntity | null> {
        return this.repo.findOne({ where: { confirmationCode: code, deleteAt: IsNull() } });
    }

    async save(user: UserOrmEntity): Promise<void> {
        await this.repo.save(user);
    }

}