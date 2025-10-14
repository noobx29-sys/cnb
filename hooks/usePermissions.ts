import { useAuth } from '@/context/AuthContext';

export function usePermissions() {
  const { userData } = useAuth();

  const canManageProducts = () => {
    const role = userData?.role?.toLowerCase();
    return role === 'admin' || role === 'manager';
  };

  const canManagePromotions = () => {
    const role = userData?.role?.toLowerCase();
    return role === 'admin' || role === 'manager';
  };

  const canManageUsers = () => {
    console.log('Current user role:', userData?.role);
    return userData?.role?.toLowerCase() === 'admin';
  };

  const canSeePrice = () => {
    const role = userData?.role?.toLowerCase();
    return role === 'admin' || role === 'manager' || userData?.role === 'User - Price';
  };

  const isGuest = () => {
    return userData?.role?.toLowerCase() === 'guest';
  };

  const canAccessFeature = (feature: 'products' | 'categories' | 'contact' | 'profile' | 'cart' | 'checkout') => {
    if (isGuest()) {
      // Define what features guests can access
      const guestAccessibleFeatures = ['products', 'categories', 'contact'];
      return guestAccessibleFeatures.includes(feature);
    }
    return true; // Non-guest users can access all features
  };

  return {
    canManageProducts,
    canManagePromotions,
    canManageUsers,
    canSeePrice,
    isGuest,
    canAccessFeature,
  };
} 