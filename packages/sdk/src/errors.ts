export interface UteSdkErrorBody {
  code: string;
  status: number;
  message: string;
  details?: unknown;
}

export class UteSdkError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: unknown;
  public readonly upstream: unknown;

  constructor(body: UteSdkErrorBody, upstream?: unknown) {
    super(body.message);
    this.name = 'UteSdkError';
    this.code = body.code;
    this.status = body.status;
    this.details = body.details;
    this.upstream = upstream;
  }
}
