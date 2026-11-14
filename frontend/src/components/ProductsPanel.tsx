import { useState, type FormEvent } from 'react';
import { api } from '../services/api';
import type { EntityStatus, Product } from '../types/api.types';

interface Props {
  products: Product[];
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function ProductsPanel({
  products,
  onRefresh,
  onError,
  onSuccess,
}: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('100');
  const [stock, setStock] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProduct({
        code,
        name,
        price: Number(price),
        stock: Number(stock),
      });
      setCode('');
      setName('');
      setPrice('100');
      setStock('10');
      await onRefresh();
      onSuccess('Producto creado correctamente.');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
  };

  const saveEdit = async (id: number) => {
    try {
      await api.updateProduct(id, {
        price: Number(editPrice),
        stock: Number(editStock),
      });
      setEditingId(null);
      await onRefresh();
      onSuccess(
        'Producto actualizado. (Los pedidos existentes conservan su precio histórico).',
      );
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const toggleStatus = async (p: Product) => {
    const nextStatus: EntityStatus =
      p.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.updateProduct(p.id, { status: nextStatus });
      await onRefresh();
      onSuccess(`Producto "${p.name}" marcado como ${nextStatus}.`);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <div className="panel-grid">
      <div className="card">
        <h2 className="card-title">Registrar Producto</h2>
        <form onSubmit={handleCreate} className="form-stack">
          <div className="field">
            <label>Código</label>
            <input
              type="text"
              required
              placeholder="Ej. PROD-006"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Nombre</label>
            <input
              type="text"
              required
              placeholder="Ej. Audífonos Bluetooth"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Precio (S/)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Stock inicial</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Crear Producto'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Catálogo de Productos ({products.length})</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Precio (S/)</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id}>
                      <td className="mono">{p.code}</td>
                      <td className="font-semibold">{p.name}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="inline-input"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        ) : (
                          `S/ ${Number(p.price).toFixed(2)}`
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="1"
                            min="0"
                            className="inline-input"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                          />
                        ) : (
                          <span
                            className={`badge ${
                              p.stock === 0
                                ? 'badge-red'
                                : p.stock <= 3
                                  ? 'badge-amber'
                                  : 'badge-blue'
                            }`}
                          >
                            {p.stock} und.
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'ACTIVO' ? 'badge-green' : 'badge-gray'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => saveEdit(p.id)}
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => setEditingId(null)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => startEdit(p)}
                              >
                                Editar Precio/Stock
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => toggleStatus(p)}
                              >
                                {p.status === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
