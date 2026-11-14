import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { OrderStateMachine } from './order-state-machine';

describe('OrderStateMachine', () => {
  it('permite transiciones válidas desde PENDIENTE a CONFIRMADO o CANCELADO', () => {
    expect(
      OrderStateMachine.canTransition(
        OrderStatus.PENDIENTE,
        OrderStatus.CONFIRMADO,
      ),
    ).toBe(true);
    expect(
      OrderStateMachine.canTransition(
        OrderStatus.PENDIENTE,
        OrderStatus.CANCELADO,
      ),
    ).toBe(true);
  });

  it('permite transiciones válidas desde CONFIRMADO a COMPLETADO o CANCELADO', () => {
    expect(
      OrderStateMachine.canTransition(
        OrderStatus.CONFIRMADO,
        OrderStatus.COMPLETADO,
      ),
    ).toBe(true);
    expect(
      OrderStateMachine.canTransition(
        OrderStatus.CONFIRMADO,
        OrderStatus.CANCELADO,
      ),
    ).toBe(true);
  });

  it('rechaza saltar directamente de PENDIENTE a COMPLETADO', () => {
    expect(() =>
      OrderStateMachine.assertCanTransition(
        OrderStatus.PENDIENTE,
        OrderStatus.COMPLETADO,
      ),
    ).toThrow(ConflictException);
  });

  it('rechaza transiciones desde estados terminales CANCELADO y COMPLETADO', () => {
    expect(() =>
      OrderStateMachine.assertCanTransition(
        OrderStatus.CANCELADO,
        OrderStatus.CONFIRMADO,
      ),
    ).toThrow(ConflictException);
    expect(() =>
      OrderStateMachine.assertCanTransition(
        OrderStatus.COMPLETADO,
        OrderStatus.CANCELADO,
      ),
    ).toThrow(ConflictException);
  });

  it('solo permite edición de ítems cuando el pedido está PENDIENTE', () => {
    expect(() =>
      OrderStateMachine.assertEditable(OrderStatus.PENDIENTE),
    ).not.toThrow();
    expect(() =>
      OrderStateMachine.assertEditable(OrderStatus.CONFIRMADO),
    ).toThrow(ConflictException);
    expect(() =>
      OrderStateMachine.assertEditable(OrderStatus.CANCELADO),
    ).toThrow(ConflictException);
  });
});
