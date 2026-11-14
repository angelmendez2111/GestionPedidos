import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '../../../common/enums/order-status.enum';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDIENTE]: [OrderStatus.CONFIRMADO, OrderStatus.CANCELADO],
  [OrderStatus.CONFIRMADO]: [OrderStatus.COMPLETADO, OrderStatus.CANCELADO],
  [OrderStatus.CANCELADO]: [],
  [OrderStatus.COMPLETADO]: [],
};

/**
 * Reglas explícitas de transición de estados para un pedido.
 * Centralizarlo aquí evita transiciones inválidas dispersas por los servicios.
 */
export class OrderStateMachine {
  static canTransition(current: OrderStatus, target: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
  }

  static assertCanTransition(current: OrderStatus, target: OrderStatus): void {
    if (!this.canTransition(current, target)) {
      throw new ConflictException(
        `Transición de estado inválida: no se puede pasar de ${current} a ${target}.`,
      );
    }
  }

  static assertEditable(current: OrderStatus): void {
    if (current !== OrderStatus.PENDIENTE) {
      throw new ConflictException(
        `El pedido está en estado ${current} y ya no puede modificarse.`,
      );
    }
  }
}
