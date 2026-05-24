import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMeOutputDto } from '../../api/dto/output/get-me-output.dto';
import { AuthQueryRepository } from '../../infrastructure/auth/authQueryRepository';

export class GetMeQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMeQuery)
export class GetMeUseCase implements IQueryHandler<GetMeQuery> {
  constructor(private readonly authQueryRepository: AuthQueryRepository) {}

  async execute(query: GetMeQuery): Promise<GetMeOutputDto> {
    return this.authQueryRepository.getMe(query.userId);
  }
}
