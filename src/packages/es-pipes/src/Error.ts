export class LibLogicError extends Error {
  constructor(message: string) {
    super(message);
    console.error(message);
  }
}

export class UserLogicError extends Error {
  constructor(message: string) {
    super(message);
    console.error(message);
  }
}
