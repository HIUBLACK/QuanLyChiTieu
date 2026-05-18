import { describe, expect, test } from 'vitest';
import { signToken, verifyToken } from './token.js';

describe('token utils', () => {
  test('signs and verifies token', () => {
    const token = signToken({ userId: 10, email: 'demo@example.com' });
    const payload = verifyToken(token);

    expect(payload.userId).toBe(10);
    expect(payload.email).toBe('demo@example.com');
  });
});
