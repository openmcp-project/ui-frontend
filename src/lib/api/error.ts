export class APIError extends Error {
  status: number;
  info: any;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;

    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class ValidationError extends Error {
  field: string;

  constructor(message: string, field: string) {
    super(message);
    this.field = field;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
