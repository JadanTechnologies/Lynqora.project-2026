import { describe, it, expect } from 'vitest';
import { isPrivateIp, isBlockedHost, validateTarget, isSafeUrl } from '../src/services/verification/network.util.ts';

describe('SSRF Protection', () => {
  it('should block localhost', () => {
    expect(isBlockedHost('localhost')).toBe(true);
  });

  it('should block .local domains', () => {
    expect(isBlockedHost('test.local')).toBe(true);
  });

  it('should block .internal domains', () => {
    expect(isBlockedHost('test.internal')).toBe(true);
  });

  it('should block metadata.google.internal', () => {
    expect(isBlockedHost('metadata.google.internal')).toBe(true);
  });

  it('should block cloud metadata IP', () => {
    expect(isBlockedHost('169.254.169.254')).toBe(true);
  });

  it('should allow normal domains', () => {
    expect(isBlockedHost('example.com')).toBe(false);
    expect(isBlockedHost('google.com')).toBe(false);
  });

  it('should detect private IPs', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
    expect(isPrivateIp('169.254.1.1')).toBe(true);
    expect(isPrivateIp('0.0.0.0')).toBe(true);
  });

  it('should allow public IPs', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('203.0.113.1')).toBe(false);
  });

  it('should validate safe URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
  });

  it('should reject unsafe URLs', () => {
    expect(isSafeUrl('http://localhost')).toBe(false);
    expect(isSafeUrl('http://127.0.0.1')).toBe(false);
    expect(isSafeUrl('http://169.254.169.254')).toBe(false);
    expect(isSafeUrl('http://metadata.google.internal')).toBe(false);
  });
});