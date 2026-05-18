import crypto from 'crypto';
import { env } from '../config/env.js';

function encode(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function decode(input) {
  return JSON.parse(Buffer.from(input, 'base64url').toString('utf8'));
}

export function signToken(payload) {
  const expiresAt = Date.now() + env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
  const body = {
    ...payload,
    exp: expiresAt,
  };

  const encodedPayload = encode(body);
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) {
    throw new Error('Invalid token');
  }

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid token signature');
  }

  const payload = decode(encodedPayload);
  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error('Token expired');
  }

  return payload;
}
