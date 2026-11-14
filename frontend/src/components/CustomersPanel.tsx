import { useState, type FormEvent } from 'react';
import { api } from '../services/api';
import type { Customer, EntityStatus } from '../types/api.types';

interface Props {
  customers: Customer[];
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function CustomersPanel({
  customers,
  onRefresh,
  onError,
  onSuccess,
}: Props) {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCustomer({ name, document, email });
      setName('');
      setDocument('');
      setEmail('');
      await onRefresh();
      onSuccess('Cliente registrado correctamente.');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    const nextStatus: EntityStatus =
      customer.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.updateCustomerStatus(customer.id, nextStatus);
      await onRefresh();
      onSuccess(`Cliente "${customer.name}" marcado como ${nextStatus}.`);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <div className="panel-grid">
      <div className="card">
        <h2 className="card-title">Registrar Cliente</h2>
        <form onSubmit={handleCreate} className="form-stack">
          <div className="field">
            <label>Nombre completo</label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Documento (DNI / RUC)</label>
            <input
              type="text"
              required
              placeholder="Ej. 44556677"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              required
              placeholder="juan.perez@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Crear Cliente'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Clientes ({customers.length})</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No hay clientes registrados.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td className="font-semibold">{c.name}</td>
                    <td>{c.document}</td>
                    <td>{c.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          c.status === 'ACTIVO' ? 'badge-green' : 'badge-gray'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleToggleStatus(c)}
                      >
                        {c.status === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
