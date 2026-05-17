export class BankQueueAuthError extends Error {
  constructor(message = "Missing or invalid auth for bank queue") {
    super(message);
    this.name = "BankQueueAuthError";
  }
}

export class BankQueueHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "BankQueueHttpError";
  }
}
