import crypto from 'crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');

  return {
    salt,
    passwordHash,
  };
}

export function verifyPassword(password, passwordHash, salt) {
  const calculated = hashPassword(password, salt).passwordHash;
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(passwordHash));
}
