import { useAuth } from '@/context/AuthContext';

export function usePermissions() {
  const { userData } = useAuth();

  const canManageProducts = () => {
    return userData?.role === 'admin' || userData?.role === 'manager';
  };

  const canManagePromotions = () => {
    return userData?.role === 'admin' || userData?.role === 'manager';
  };

  const canManageUsers = () => {
    console.log('Current user role:', userData?.role);
    return userData?.role === 'admin';
  };

  return {
    canManageProducts,
    canManagePromotions,
    canManageUsers,
  };
} 