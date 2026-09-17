import dns from 'dns';
import { promisify } from 'util';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

export interface NetworkRequestOptions {
  timeout?: number;
  maxRedirects?: number;
  maxResponseSize?: number;
  userAgent?: string;
}

export interface NetworkResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  finalUrl: string;
  redirectCount: number;
  responseTime: number;
  contentType: string;
}

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/i,
  /^fe80:/i,
  /^fc00:/i,
  /^ff00:/i,
];

const BLOCKED_HOSTS = [
  'localhost',
  'metadata.google.internal',
  '169.254.169.254',
  '169.254.170.2',
];

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some((r) => r.test(ip));
}

export function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/\.$/, '');
  if (BLOCKED_HOSTS.includes(lower) || lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) {
    return true;
  }
  // Check if hostname is a private IP address
  if (isPrivateIp(lower)) {
    return true;
  }
  return false;
}

export async function validateTarget(hostname: string): Promise<void> {
  if (isBlockedHost(hostname)) {
    throw new Error(`Blocked internal/private destination: ${hostname}`);
  }

  // Resolve DNS to check for private IPs (DNS rebinding protection)
  let resolvedIps: string[] = [];
  try {
    resolvedIps = await resolve4(hostname);
  } catch {
    // Try AAAA
  }
  if (resolvedIps.length === 0) {
    try {
      resolvedIps = await resolve6(hostname);
    } catch {
      // ignore
    }
  }

  if (resolvedIps.length === 0) {
    throw new Error(`DNS resolution failed for: ${hostname}`);
  }

  for (const ip of resolvedIps) {
    if (isPrivateIp(ip)) {
      throw new Error(`Blocked private/internal IP address: ${ip} (resolved from ${hostname})`);
    }
  }
}

export async function safeHttpRequest(
  url: string,
  options: NetworkRequestOptions = {}
): Promise<NetworkResponse> {
  const {
    timeout = 10000,
    maxRedirects = 5,
    maxResponseSize = 2 * 1024 * 1024,
    userAgent = 'Lynqora-Verification-Engine/1.0',
  } = options;

  const parsed = new URL(url);
  const hostname = parsed.hostname;

  // Validate target before making any request
  await validateTarget(hostname);

  return new Promise((resolve, reject) => {
    const start = Date.now();
    let redirectCount = 0;
    let finalUrl = url;
    let responseTime = 0;

    const makeRequest = (requestUrl: string, redirectHistory: string[] = []) => {
      if (redirectCount > maxRedirects) {
        reject(new Error(`Too many redirects (max ${maxRedirects})`));
        return;
      }

      const reqUrl = new URL(requestUrl);
      const isHttps = reqUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const req = transport.request(
        {
          hostname: reqUrl.hostname,
          port: reqUrl.port || (isHttps ? 443 : 80),
          path: reqUrl.pathname + reqUrl.search,
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout,
          rejectUnauthorized: false, // We handle cert validation separately
        },
        (res) => {
          responseTime = Date.now() - start;
          const status = res.statusCode || 0;

          // Handle redirects
          if (status >= 300 && status < 400 && res.headers.location) {
            redirectCount++;
            finalUrl = res.headers.location;
            res.resume();
            makeRequest(new URL(res.headers.location, requestUrl).toString(), redirectHistory);
            return;
          }

          // Read body with size limit
          let body = '';
          let totalSize = 0;
          res.on('data', (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > maxResponseSize) {
              req.destroy();
              reject(new Error(`Response body exceeded maximum size of ${maxResponseSize} bytes`));
              return;
            }
            body += chunk.toString('utf-8');
          });

          res.on('end', () => {
            resolve({
              status,
              headers: res.headers as Record<string, string>,
              body,
              finalUrl,
              redirectCount,
              responseTime,
              contentType: (res.headers['content-type'] as string) || '',
            });
          });

          res.on('error', (err) => {
            reject(new Error(`Response stream error: ${err.message}`));
          });
        }
      );

      req.on('error', (err: any) => {
        reject(new Error(`Request failed: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      req.end();
    };

    makeRequest(url);
  });
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; maxBytes?: number } = {}
): Promise<Response> {
  const { timeout = 10000, maxBytes = 2 * 1024 * 1024, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      redirect: 'manual',
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveDnsRecords(hostname: string): Promise<dns.AnyRecord[]> {
  return new Promise((resolve) => {
    dns.resolveAny(hostname, (err, records) => {
      if (err) {
        resolve([]);
      } else {
        resolve(records || []);
      }
    });
  });
}

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
    if (isBlockedHost(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}