import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

export async function verify(initData: string) {
  const res = await api.post('/auth/verify', { initData });
  return res.data.user;
}

export async function fetchCities() {
  const res = await api.get('/cities');
  return res.data;
}

export async function fetchProducts(cityId: number) {
  const res = await api.get(`/cities/${cityId}/products`);
  return res.data;
}

export async function createOrder(userId: number, cityId: number, productId: number) {
  const res = await api.post('/orders', { userId, cityId, items: [{ productId, quantity: 1 }] });
  return res.data.order;
}

export async function fetchOrders(userId: number) {
  const res = await api.get(`/orders/${userId}`);
  return res.data;
}

export async function adminFetch(path: string) {
  const res = await api.get(path);
  return res.data;
}

export async function adminPost(path: string, data: any) {
  const res = await api.post(path, data);
  return res.data;
}

export async function adminPut(path: string, data: any) {
  const res = await api.put(path, data);
  return res.data;
}

export async function adminDelete(path: string) {
  const res = await api.delete(path);
  return res.data;
}
