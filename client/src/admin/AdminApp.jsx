import { Navigate, Route, Routes } from 'react-router';
import './admin.css';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import OrderDetail from './OrderDetail';
import OrdersList from './OrdersList';
import ProductEditor from './ProductEditor';
import ProductsList from './ProductsList';
import Messages from './Messages';
import Promos from './Promos';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsList />} />
        <Route path="products/new" element={<ProductEditor />} />
        <Route path="products/:id" element={<ProductEditor />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="promos" element={<Promos />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
