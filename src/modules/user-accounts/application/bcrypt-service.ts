import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
@Injectable()
export class BcryptService {
  async generateHash(password: string) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async checkPassword(args: { password: string; hash: string }) {
    const { password, hash } = args;
    return bcrypt.compare(password, hash);
  }
}
