import type { AggregateRoot } from '../entities/aggregate-root';
import type { UniqueEntityID } from '../entities/unique-entity-id';
import type { DomainEvent } from './domain-event';

type DomainEventCallback = (event: DomainEvent) => void | Promise<void>;

export class DomainEvents {
  private static handlersMap: Record<string, DomainEventCallback[]> = {};
  private static markedAggregates: AggregateRoot<unknown>[] = [];

  public static markAggregateForDispatch(aggregate: AggregateRoot<unknown>) {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static async dispatchAggregateEvents(
    aggregate: AggregateRoot<unknown>,
  ): Promise<void> {
    for (const event of aggregate.domainEvents) {
      await this.dispatch(event);
    }
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<unknown>,
  ) {
    const index = this.markedAggregates.findIndex((a) => a.equals(aggregate));

    this.markedAggregates.splice(index, 1);
  }

  private static findMarkedAggregateByID(
    id: UniqueEntityID,
  ): AggregateRoot<unknown> | undefined {
    return this.markedAggregates.find((aggregate) => aggregate.id.equals(id));
  }

  public static async dispatchEventsForAggregate(
    id: UniqueEntityID,
  ): Promise<void> {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      await this.dispatchAggregateEvents(aggregate);
      aggregate.clearEvents();
      this.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  public static register(
    callback: DomainEventCallback,
    eventClassName: string,
  ) {
    this.handlersMap[eventClassName] ??= [];
    this.handlersMap[eventClassName].push(callback);
  }

  public static clearHandlers() {
    this.handlersMap = {};
  }

  public static clearMarkedAggregates() {
    this.markedAggregates = [];
  }

  private static async dispatch(event: DomainEvent): Promise<void> {
    const eventClassName: string = event.constructor.name;

    const handlers = this.handlersMap[eventClassName];

    if (handlers) {
      for (const handler of handlers) {
        await handler(event);
      }
    }
  }
}
