import { describe, expect, test } from 'vitest';
import { hashPassword, verifyPassword } from './hash.js';

describe('hash utils', () => {
  test('hashes and verifies password', () => {
    const password = 'secret123';
    const { salt, passwordHash } = hashPassword(password);

    expect(verifyPassword(password, passwordHash, salt)).toBe(true);
    expect(verifyPassword('wrong-password', passwordHash, salt)).toBe(false);
  });
});
