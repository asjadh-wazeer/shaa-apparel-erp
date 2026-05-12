import * as bcrypt from 'bcrypt';
import { APP_CONSTANTS } from '../constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, APP_CONSTANTS.BCRYPT_ROUNDS);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
