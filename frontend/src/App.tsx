import { useCallback, useEffect, useState } from 'react';
import { CustomersPanel } from './components/CustomersPanel';
import { OrdersPanel } from './components/OrdersPanel';
import { ProductsPanel } from './components/ProductsPanel';
import { api } from './services/api';
import type { Customer, Order, Product } from './types/api.types';

type Tab = 'orders' | 'products' | 'customers';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const loadAll = useCallback(async () => {
    try {
      const [c, p, o] = await Promise.all([
        api.getCustomers(),
        api.getProducts(),
        api.getOrders(),
      ]);
      setCustomers(c);
      setProducts(p);
      setOrders(o);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `No se pudo conectar con la API (${(err as Error).message}). Verifica que el backend esté corriendo.`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const showError = (message: string) =>
    setFeedback({ type: 'error', message });

  const showSuccess = (message: string) =>
    setFeedback({ type: 'success', message });

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <h1 className="brand-title">Core de Gestión de Pedidos</h1>

          </div>
          <div className="topbar-actions">

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void loadAll()}
            >
              Refrescar
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs-bar">
        <div className="tabs-inner">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Pedidos ({orders.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Productos y Stock ({products.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Clientes ({customers.length})
          </button>
        </div>
      </nav>

      <main className="main-content">
        {feedback && (
          <div
            className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'
              }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              className="alert-close"
              onClick={() => setFeedback(null)}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="card empty-state">Cargando datos del sistema...</div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <OrdersPanel
                orders={orders}
                customers={customers}
                products={products}
                onRefresh={loadAll}
                onError={showError}
                onSuccess={showSuccess}
              />
            )}
            {activeTab === 'products' && (
              <ProductsPanel
                products={products}
                onRefresh={loadAll}
                onError={showError}
                onSuccess={showSuccess}
              />
            )}
            {activeTab === 'customers' && (
              <CustomersPanel
                customers={customers}
                onRefresh={loadAll}
                onError={showError}
                onSuccess={showSuccess}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
