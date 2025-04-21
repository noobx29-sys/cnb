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

  const isGuest = () => {
    return userData?.role === 'Guest';
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