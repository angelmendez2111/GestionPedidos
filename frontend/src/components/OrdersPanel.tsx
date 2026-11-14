import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../services/api';
import type { Customer, Order, OrderStatus, Product } from '../types/api.types';

interface Props {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDIENTE: 'badge-amber',
  CONFIRMADO: 'badge-blue',
  COMPLETADO: 'badge-green',
  CANCELADO: 'badge-red',
};

export function OrdersPanel({
  orders,
  customers,
  products,
  onRefresh,
  onError,
  onSuccess,
}: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newDiscountPct, setNewDiscountPct] = useState<string>('0');
  const [creatingOrder, setCreatingOrder] = useState(false);

  const [addProductId, setAddProductId] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<string>('1');
  const [editDiscountInput, setEditDiscountInput] = useState<string>('0');
  const [busyAction, setBusyAction] = useState(false);

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) ?? orders[0] ?? null;

  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      const firstActive = customers.find((c) => c.status === 'ACTIVO') ?? customers[0];
      setSelectedCustomerId(String(firstActive.id));
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (!addProductId && products.length > 0) {
      const firstActive = products.find((p) => p.status === 'ACTIVO') ?? products[0];
      setAddProductId(String(firstActive.id));
    }
  }, [products, addProductId]);

  useEffect(() => {
    if (selectedOrder) {
      setEditDiscountInput(String(selectedOrder.discountPercentage));
    }
  }, [selectedOrder?.id, selectedOrder?.discountPercentage]);

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      onError('Debes seleccionar un cliente.');
      return;
    }
    setCreatingOrder(true);
    try {
      const created = await api.createOrder({
        customerId: Number(selectedCustomerId),
        discountPercentage: Number(newDiscountPct) || 0,
      });
      await onRefresh();
      setSelectedOrderId(created.id);
      onSuccess(`Pedido ${created.orderNumber} creado en estado PENDIENTE.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !addProductId) return;
    setBusyAction(true);
    try {
      await api.addOrderItem(selectedOrder.id, {
        productId: Number(addProductId),
        quantity: Number(addQuantity),
      });
      setAddQuantity('1');
      await onRefresh();
      onSuccess('Producto agregado al pedido.');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (!selectedOrder || newQty < 1) return;
    setBusyAction(true);
    try {
      await api.updateOrderItemQuantity(selectedOrder.id, itemId, newQty);
      await onRefresh();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!selectedOrder) return;
    setBusyAction(true);
    try {
      await api.removeOrderItem(selectedOrder.id, itemId);
      await onRefresh();
      onSuccess('Ítem eliminado del pedido.');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleApplyDiscount = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setBusyAction(true);
    try {
      await api.updateOrderDiscount(
        selectedOrder.id,
        Number(editDiscountInput) || 0,
      );
      await onRefresh();
      onSuccess('Descuento recalculado en el backend.');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOrder) return;
    setBusyAction(true);
    try {
      const updated = await api.confirmOrder(selectedOrder.id);
      await onRefresh();
      onSuccess(
        `Pedido ${updated.orderNumber} CONFIRMADO y stock descontado en SQL Server.`,
      );
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;
    setBusyAction(true);
    try {
      const wasConfirmed = selectedOrder.status === 'CONFIRMADO';
      const updated = await api.cancelOrder(selectedOrder.id);
      await onRefresh();
      onSuccess(
        wasConfirmed
          ? `Pedido ${updated.orderNumber} CANCELADO y stock devuelto al inventario.`
          : `Pedido ${updated.orderNumber} CANCELADO.`,
      );
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedOrder) return;
    setBusyAction(true);
    try {
      const updated = await api.completeOrder(selectedOrder.id);
      await onRefresh();
      onSuccess(`Pedido ${updated.orderNumber} marcado como COMPLETADO.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const isPending = selectedOrder?.status === 'PENDIENTE';
  const isConfirmed = selectedOrder?.status === 'CONFIRMADO';

  return (
    <div className="orders-layout">
      {/* Columna izquierda: Crear pedido + Lista de pedidos */}
      <div className="orders-sidebar">
        <div className="card">
          <h2 className="card-title">Nuevo Pedido</h2>
          <form onSubmit={handleCreateOrder} className="form-stack">
            <div className="field">
              <label>Seleccionar Cliente</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="" disabled>
                  -- Selecciona un cliente --
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.document})
                    {c.status === 'INACTIVO' ? ' [INACTIVO]' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Descuento simple (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newDiscountPct}
                onChange={(e) => setNewDiscountPct(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creatingOrder || customers.length === 0}
            >
              {creatingOrder ? 'Creando...' : '+ Crear Pedido (PENDIENTE)'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="card-title">Pedidos ({orders.length})</h2>
          <div className="order-list">
            {orders.length === 0 ? (
              <p className="muted-text">
                Aún no hay pedidos. Crea el primero arriba.
              </p>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`order-list-item ${
                    selectedOrder?.id === order.id ? 'active' : ''
                  }`}
                >
                  <div className="order-list-top">
                    <span className="mono font-semibold">
                      {order.orderNumber}
                    </span>
                    <span className={`badge ${STATUS_BADGE[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-list-bottom">
                    <span>{order.customer?.name ?? 'Cliente'}</span>
                    <span className="font-semibold">
                      S/ {Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Columna derecha: Detalle y gestión del pedido */}
      <div className="orders-detail">
        {!selectedOrder ? (
          <div className="card empty-state">
            <h3>Selecciona o crea un pedido</h3>
            <p>
              Aquí podrás agregar productos, modificar cantidades, calcular
              totales en el backend y gestionar el estado del pedido.
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="order-detail-header">
              <div>
                <div className="order-title-row">
                  <h2 className="mono">{selectedOrder.orderNumber}</h2>
                  <span
                    className={`badge ${STATUS_BADGE[selectedOrder.status]}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="muted-text">
                  Cliente: <strong>{selectedOrder.customer?.name}</strong> (Doc:{' '}
                  {selectedOrder.customer?.document}) · Creado:{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="action-group">
                {isPending && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={busyAction}
                      onClick={handleConfirm}
                    >
                      Confirmar Pedido
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      disabled={busyAction}
                      onClick={handleCancel}
                    >
                      Cancelar Pedido
                    </button>
                  </>
                )}
                {isConfirmed && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyAction}
                      onClick={handleComplete}
                    >
                      Completar Pedido
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      disabled={busyAction}
                      onClick={handleCancel}
                    >
                      Cancelar (devolver stock)
                    </button>
                  </>
                )}
                {!isPending && !isConfirmed && (
                  <span className="locked-hint">
                    Estado final: no permite cambios
                  </span>
                )}
              </div>
            </div>

            {/* Agregar producto cuando está PENDIENTE */}
            {isPending && (
              <form onSubmit={handleAddItem} className="add-item-bar">
                <div className="field flex-grow">
                  <label>Agregar Producto al Pedido</label>
                  <select
                    value={addProductId}
                    onChange={(e) => setAddProductId(e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} | S/ {Number(p.price).toFixed(2)} |
                        Stock: {p.stock}
                        {p.status === 'INACTIVO' ? ' [INACTIVO]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field qty-field">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busyAction || products.length === 0}
                >
                  + Agregar
                </button>
              </form>
            )}

            {/* Tabla de ítems */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unit. (Histórico)</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    {isPending && <th>Quitar</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.length === 0 ? (
                    <tr>
                      <td colSpan={isPending ? 5 : 4} className="empty-cell">
                        El pedido aún no tiene productos. Agrega uno arriba.
                      </td>
                    </tr>
                  ) : (
                    selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-semibold">
                            {item.product?.name}
                          </div>
                          <div className="muted-small mono">
                            {item.product?.code} · Stock actual:{' '}
                            {item.product?.stock}
                          </div>
                        </td>
                        <td>S/ {Number(item.unitPrice).toFixed(2)}</td>
                        <td>
                          {isPending ? (
                            <div className="qty-stepper">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                disabled={busyAction || item.quantity <= 1}
                                onClick={() =>
                                  handleUpdateQty(item.id, item.quantity - 1)
                                }
                              >
                                -
                              </button>
                              <span className="qty-value">{item.quantity}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                disabled={busyAction}
                                onClick={() =>
                                  handleUpdateQty(item.id, item.quantity + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span>{item.quantity}</span>
                          )}
                        </td>
                        <td className="font-semibold">
                          S/ {Number(item.subtotal).toFixed(2)}
                        </td>
                        {isPending && (
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger-outline"
                              disabled={busyAction}
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Descuento y Totales calculados por Backend */}
            <div className="order-footer">
              <div className="discount-box">
                {isPending ? (
                  <form onSubmit={handleApplyDiscount} className="discount-form">
                    <label>Descuento (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editDiscountInput}
                      onChange={(e) => setEditDiscountInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn btn-sm btn-outline"
                      disabled={busyAction}
                    >
                      Aplicar
                    </button>
                  </form>
                ) : (
                  <span className="muted-text">
                    Descuento aplicado: {selectedOrder.discountPercentage}%
                  </span>
                )}
                <p className="muted-small">
                  * Todos los cálculos son validados y persistidos en el Backend.
                </p>
              </div>

              <div className="totals-card">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>S/ {Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Descuento ({selectedOrder.discountPercentage}%)</span>
                  <span className="text-danger">
                    - S/ {Number(selectedOrder.discount).toFixed(2)}
                  </span>
                </div>
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>S/ {Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
