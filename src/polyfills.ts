import { randomUUID } from 'crypto';

// Polyfill for crypto.randomUUID
if (!global.crypto) {
  (global as any).crypto = { randomUUID };
}