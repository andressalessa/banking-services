export function logDomainEventHandlerFailure(
  handlerName: string,
  message: string,
): void {
  console.error(`[${handlerName}] ${message}`);
}
