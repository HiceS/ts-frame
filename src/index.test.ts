import { describe, it, expect } from 'vitest';
import { hello } from './index';

describe('ts-frame', () => {
  it('should export hello function', () => {
    expect(hello()).toBe('Hello from ts-frame!');
  });
});

