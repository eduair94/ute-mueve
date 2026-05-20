export type UteApiErrorCode =
  | 'UPSTREAM_AUTH'
  | 'UPSTREAM_4XX'
  | 'UPSTREAM_5XX'
  | 'UPSTREAM_NETWORK'
  | 'UPSTREAM_INVALID_RESPONSE'
  | 'TOKEN_DECODE'
  | 'WRITES_DISABLED'
  | 'VALIDATION';

export interface UteApiErrorOpts {
  code: UteApiErrorCode;
  status: number;
  message: string;
  upstream?: unknown;
  details?: unknown;
}

export class UteApiError extends Error {
  public readonly code: UteApiErrorCode;
  public readonly status: number;
  public readonly upstream: unknown;
  public readonly details: unknown;

  constructor(opts: UteApiErrorOpts) {
    super(opts.message);
    this.name = 'UteApiError';
    this.code = opts.code;
    this.status = opts.status;
    this.upstream = opts.upstream;
    this.details = opts.details;
  }
}
