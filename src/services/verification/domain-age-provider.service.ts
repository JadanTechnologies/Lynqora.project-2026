export interface DomainRegistrationInfo {
  domain: string;
  registrationDate?: string;
  expirationDate?: string;
  registrar?: string;
  domainStatus?: string[];
  lastUpdated?: string;
  ageInDays?: number;
  cached?: boolean;
  cachedAt?: string;
  provider?: string;
  error?: string;
}

export interface DomainRegistrationProvider {
  name: string;
  getRegistrationInfo(domain: string): Promise<DomainRegistrationInfo>;
  isAvailable(): boolean;
}

export class WhoisApiProvider implements DomainRegistrationProvider {
  name = 'WHOIS_API';
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WHOIS_API_KEY || '';
    this.baseUrl = process.env.WHOIS_API_URL || 'https://api.whois.vu';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getRegistrationInfo(domain: string): Promise<DomainRegistrationInfo> {
    if (!this.apiKey) {
      throw new Error('WHOIS_API_KEY not configured');
    }

    const url = `${this.baseUrl}?domain=${encodeURIComponent(domain)}&apikey=${this.apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
      throw new Error(`WHOIS API returned ${response.status}`);
    }

    const data = await response.json();
    return {
      domain,
      registrationDate: data.creation_date || data.created || data.registration_date,
      expirationDate: data.expiration_date || data.expires || data.expiry_date,
      registrar: data.registrar || data.registrar_name,
      domainStatus: data.domain_status || data.status,
      lastUpdated: data.updated_date || data.updated,
      provider: this.name,
    };
  }
}

export class RdapProvider implements DomainRegistrationProvider {
  name = 'RDAP';
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.RDAP_PROVIDER_URL || '';
  }

  isAvailable(): boolean {
    return !!this.baseUrl;
  }

  async getRegistrationInfo(domain: string): Promise<DomainRegistrationInfo> {
    if (!this.baseUrl) {
      throw new Error('RDAP_PROVIDER_URL not configured');
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}/${encodeURIComponent(domain)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
      throw new Error(`RDAP returned ${response.status}`);
    }

    const data = await response.json();

    let registrationDate: string | undefined;
    let expirationDate: string | undefined;
    let lastUpdated: string | undefined;
    let registrar: string | undefined;
    let domainStatus: string[] | undefined;

    for (const event of data.events || []) {
      if (event.action === 'registration') {
        registrationDate = event.timestamp;
      } else if (event.action === 'expiration') {
        expirationDate = event.timestamp;
      } else if (event.action === 'last updated') {
        lastUpdated = event.timestamp;
      }
    }

    for (const entity of data.entities || []) {
      if (entity.roles?.includes('registrar')) {
        registrar = entity.vcardArray?.find((v: any[]) => v[0] === 'fn')?.[3];
      }
    }

    if (data.status) {
      domainStatus = Array.isArray(data.status) ? data.status : [data.status];
    }

    return {
      domain,
      registrationDate,
      expirationDate,
      registrar,
      domainStatus,
      lastUpdated,
      provider: this.name,
    };
  }
}

export class DomainAgeService {
  private providers: DomainRegistrationProvider[];
  private cache: Map<string, { data: DomainRegistrationInfo; expiresAt: number }>;
  private cacheDurationMs: number;

  constructor() {
    this.providers = [new RdapProvider(), new WhoisApiProvider()].filter((p) => p.isAvailable());
    this.cache = new Map();
    this.cacheDurationMs = parseInt(process.env.DOMAIN_INFO_CACHE_MINUTES || '60', 10) * 60 * 1000;
  }

  get availableProviders(): DomainRegistrationProvider[] {
    return this.providers;
  }

  async getRegistrationInfo(domain: string): Promise<DomainRegistrationInfo> {
    const cached = this.cache.get(domain);
    if (cached && Date.now() < cached.expiresAt) {
      return {
        ...cached.data,
        cached: true,
        cachedAt: new Date().toISOString(),
      };
    }

    let lastError: Error | null = null;
    let result: DomainRegistrationInfo | null = null;

    for (const provider of this.providers) {
      try {
        result = await provider.getRegistrationInfo(domain);
        break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    if (!result) {
      return {
        domain,
        error: lastError?.message || 'No provider available',
        provider: 'NONE',
      };
    }

    if (result.registrationDate) {
      const regDate = new Date(result.registrationDate);
      if (!isNaN(regDate.getTime())) {
        result.ageInDays = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    this.cache.set(domain, {
      data: result,
      expiresAt: Date.now() + this.cacheDurationMs,
    });

    return result;
  }
}