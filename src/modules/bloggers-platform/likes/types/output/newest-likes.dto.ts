export class NewestLikeDto {
  constructor(
    public addedAt: Date,
    public userId: string,
    public login: string,
  ) {}
}
