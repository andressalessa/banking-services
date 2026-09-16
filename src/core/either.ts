// Error
// fluxo -> volta -> em caso -> de erro <- fim
export class Left<L, R> {
  // reason
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }
}

// Success
// fluxo -> segue -> em caso -> de sucesso -> fim
export class Right<L, R> {
  // result
  readonly value: R;

  constructor(value: R) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(value: L): Either<L, R> => new Left(value);

export const right = <L, R>(value: R): Either<L, R> => new Right(value);
