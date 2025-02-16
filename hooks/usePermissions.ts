import { useAuth } from '@/context/AuthContext';

export function usePermissions() {
  const { userData } = useAuth();

  const canManageProducts = () => {
    return userData?.role === 'Admin' || userData?.role === 'Manager';
  };

  const canManagePromotions = () => {
    return userData?.role === 'Admin' || userData?.role === 'Manager';
  };

  const canManageUsers = () => {
    console.log('Current user role:', userData?.role);
    return userData?.role === 'Admin';
  };

  const canSeePrice = () => {
    return userData?.role === 'Admin' || userData?.role === 'Manager' || userData?.role === 'User - Price';
  };

  return {
    canManageProducts,
    canManagePromotions,
    canManageUsers,
    canSeePrice,
  };
} 