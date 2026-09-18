jest.mock('@nestjs/common', () => ({
  Injectable:
    () =>
    (target: unknown): unknown =>
      target,
  Global:
    () =>
    (target: unknown): unknown =>
      target,
  Module:
    () =>
    (target: unknown): unknown =>
      target,
}));
