import React, { useEffect, useState } from 'react';
import { verify, fetchCities, fetchProducts, createOrder, fetchOrders, adminFetch } from '../api/client';

type User = { id: number; balance_huf: number; deposit_address: string; telegram_id: string; is_admin: boolean; first_name?: string; username?: string };
type City = { id: number; name: string };
type Product = { id: number; name: string; description: string; price_huf: number; images: string[]; address: string; city_id: number };
type Order = { id: number; status: string; total_huf: number; created_at: string; city: City; items: { id: number; product_id: number; price_huf: number; quantity: number }[] };

function useTelegramInit() {
  const [initData, setInitData] = useState<string>('');
  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    if (tg?.initData) {
      setInitData(tg.initData);
    }
  }, []);
  return initData;
}

const SectionCard: React.FC<{ title: string; children: React.ReactNode }>=({title, children})=> (
  <div className="card">
    <h3>{title}</h3>
    {children}
  </div>
);

export default function App() {
  const initData = useTelegramInit();
  const [user, setUser] = useState<User | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminData, setAdminData] = useState<any>({ stats: null, events: [], orders: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initData) return;
    verify(initData)
      .then((u) => {
        setUser(u);
        loadCities();
        loadOrders(u.id);
        if (u.is_admin) loadAdmin();
      })
      .catch((e) => setError(e.response?.data?.error || 'Auth failed'));
  }, [initData]);

  const loadCities = async () => {
    const list = await fetchCities();
    setCities(list);
  };

  const loadProducts = async (city: City) => {
    setSelectedCity(city);
    const list = await fetchProducts(city.id);
    setProducts(list);
  };

  const loadOrders = async (userId: number) => {
    const list = await fetchOrders(userId);
    setOrders(list);
  };

  const loadAdmin = async () => {
    const stats = await adminFetch('/admin/stats');
    const events = await adminFetch('/admin/events');
    const orders = await adminFetch('/admin/orders');
    setAdminData({ stats, events, orders });
  };

  const handleBuy = async (product: Product) => {
    if (!user || !selectedCity) return;
    try {
      const order = await createOrder(user.id, selectedCity.id, product.id);
      await loadOrders(user.id);
      setUser({ ...user, balance_huf: user.balance_huf - product.price_huf });
      alert(`Order ${order.id} created`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Purchase failed');
    }
  };

  if (!user) {
    return (
      <div className="container">
        <h2>Loading...</h2>
        {error && <p>{error}</p>}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Welcome {user.first_name || user.username}</h2>
        <p>Balance: {user.balance_huf} HUF</p>
        <p>Deposit address (Solana): {user.deposit_address}</p>
        <div className="navbar">
          <button className="button" onClick={loadCities}>Cities</button>
          <button className="button" onClick={() => selectedCity && loadProducts(selectedCity)} disabled={!selectedCity}>Refresh products</button>
          <button className="button secondary" onClick={() => loadOrders(user.id)}>My orders</button>
          {user.is_admin && <button className="button secondary" onClick={loadAdmin}>Admin panel</button>}
        </div>
      </div>

      <SectionCard title="Cities">
        <div className="grid">
          {cities.map((c) => (
            <div key={c.id} className="card" onClick={() => loadProducts(c)} style={{ cursor: 'pointer' }}>
              <h4>{c.name}</h4>
            </div>
          ))}
        </div>
      </SectionCard>

      {selectedCity && (
        <SectionCard title={`Products in ${selectedCity.name}`}>
          <div className="grid">
            {products.map((p) => (
              <div key={p.id} className="card">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{ width: '100%', borderRadius: 8 }} />}
                <h4>{p.name}</h4>
                <p>{p.description}</p>
                <p>{p.price_huf} HUF</p>
                <button className="button" onClick={() => handleBuy(p)}>Buy now</button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="My orders">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div>Order #{o.id} - {o.status}</div>
            <div>{new Date(o.created_at).toLocaleString()} - {o.city?.name}</div>
            <div>Total: {o.total_huf} HUF</div>
          </div>
        ))}
      </SectionCard>

      {user.is_admin && (
        <SectionCard title="Admin panel">
          {adminData.stats && (
            <div className="card">
              <div>Users: {adminData.stats.users}</div>
              <div>Orders: {adminData.stats.orders}</div>
              <div>Pending: {adminData.stats.pending}</div>
            </div>
          )}
          <div className="card">
            <h4>Latest events</h4>
            {adminData.events?.map((ev: any) => (
              <div key={ev.id}>{ev.event_type} - {new Date(ev.created_at).toLocaleString()}</div>
            ))}
          </div>
          <div className="card">
            <h4>Orders</h4>
            {adminData.orders?.map((o: any) => (
              <div key={o.id}>#{o.id} {o.status} - {o.total_huf} HUF</div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
