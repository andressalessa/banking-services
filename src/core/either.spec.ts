import { left, right, type Either } from './either.js';

function doSomething(souldSuccess: boolean): Either<string, string> {
  if (souldSuccess) {
    return right('success');
  } else {
    return left('error');
  }
}

test('success result', () => {
  const result = doSomething(true);

  expect(result.isRight()).toBe(true);
  expect(result.isLeft()).toBe(false);
});

test('error result', () => {
  const result = doSomething(false);

  expect(result.isRight()).toBe(false);
  expect(result.isLeft()).toBe(true);
});
