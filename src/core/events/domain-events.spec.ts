import { AggregateRoot } from '../entities/aggregate-root.js';
import type { UniqueEntityID } from '../entities/unique-entity-id.js';
import { DomainEvents } from './domain-events.js';
import { jest } from '@jest/globals';

class CustomAggregateCreated implements DomainEvents {
  public ocurredAt: Date;
  public aggregate: CustomAggregate;

  constructor(aggregate: CustomAggregate) {
    this.ocurredAt = new Date();
    this.aggregate = aggregate;
  }
  public getAggregateId(): UniqueEntityID {
    return this.aggregate.id;
  }
}

class CustomAggregate extends AggregateRoot<null> {
  static create() {
    const aggregate = new CustomAggregate(null);

    aggregate.addDomainEvent(new CustomAggregateCreated(aggregate));

    return aggregate;
  }
}

describe('domain events', () => {
  it('should be able to dispatch and listen to events', () => {
    const callbackSpy = jest.fn();

    // ex de evento: resposta criada

    // Subscriber cadastrado (ouvindo o evento de "resposta criada")
    DomainEvents.register(callbackSpy, CustomAggregateCreated.name);

    // estou criando uma resposta porém SEM salvar no banco
    const aggregate = CustomAggregate.create();

    // estou assegurando que o evento foi criado porém não foi disparado
    expect(aggregate.domainEvents).toHaveLength(1);

    // estou salvando a resposta no banco de dados e assim disparando o evento
    DomainEvents.dispatchEventsForAggregate(aggregate.id);

    // o subscriber ouve o evento e faz o que precisa ser feito com o dado
    expect(callbackSpy).toHaveBeenCalled();
    expect(aggregate.domainEvents).toHaveLength(0);
  });
});
