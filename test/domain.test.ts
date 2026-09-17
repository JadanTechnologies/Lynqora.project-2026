import { describe, it, expect } from 'vitest';
import { normalizeDomain, validateDomain } from '../src/lib/domain.ts';
import { DomainCheckService } from '../src/services/verification/domain-check.service.ts';

describe('Domain Normalization', () => {
  it('should normalize HTTP://WWW.Example.COM/', () => {
    expect(normalizeDomain('HTTP://WWW.Example.COM/')).toBe('example.com');
  });

  it('should normalize https://www.example.com/path?query=1', () => {
    expect(normalizeDomain('https://www.example.com/path?query=1')).toBe('example.com');
  });

  it('should strip credentials', () => {
    expect(normalizeDomain('user:pass@example.com')).toBe('example.com');
  });

  it('should strip port', () => {
    expect(normalizeDomain('example.com:8080')).toBe('example.com');
  });

  it('should reject localhost', () => {
    const result = validateDomain('localhost');
    expect(result.isValid).toBe(false);
  });

  it('should reject .local domains', () => {
    const result = validateDomain('test.local');
    expect(result.isValid).toBe(false);
  });

  it('should reject empty domain', () => {
    const result = validateDomain('');
    expect(result.isValid).toBe(false);
  });

  it('should accept valid domain', () => {
    const result = validateDomain('example.com');
    expect(result.isValid).toBe(true);
  });

  it('should reject domain with protocol', () => {
    const result = validateDomain('ftp://example.com');
    expect(result.isValid).toBe(false);
  });
});

describe('DomainCheckService', () => {
  it('should pass valid domain', () => {
    const result = DomainCheckService.check('example.com', 'example.com');
    expect(result.status).toBe('PASSED');
    expect(result.score).toBe(10);
  });

  it('should warn on double hyphens', () => {
    const result = DomainCheckService.check('ex--ample.com', 'ex--ample.com');
    expect(result.status).toBe('WARNING');
    expect(result.score).toBe(5);
  });
});