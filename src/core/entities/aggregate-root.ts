import type { DomainEvent } from '../events/domain-event.js';
import { DomainEvents } from '../events/domain-events.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  // anota que o evento existe (não faz o disparo ainda)
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
    DomainEvents.markAggregateForDispatch(this);
  }

  public clearEvents() {
    this._domainEvents = [];
  }
}
