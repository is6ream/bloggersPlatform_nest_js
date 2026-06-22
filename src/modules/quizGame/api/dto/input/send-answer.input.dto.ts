import { IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendAnswerInputDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @Length(1, 1000)
    answer: string;
}
