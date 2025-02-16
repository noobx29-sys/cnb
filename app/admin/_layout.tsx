import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: Platform.OS === 'ios' ? 'default' : 'none',
      gestureEnabled: Platform.OS === 'ios',
    }}>
      <Stack.Screen 
        name="product/[id]" 
        options={{
          title: 'Edit Product',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="category/[id]" 
        options={{
          title: 'Edit Category',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="promotion/[id]" 
        options={{
          title: 'Edit Promotion',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="product" 
        options={{
          title: 'Add Product',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="category" 
        options={{
          title: 'Add Category',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="promotion" 
        options={{
          title: 'Add Promotion',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="users" 
        options={{
          title: 'Manage Users',
          headerShown: false,
        }}
      />
    </Stack>
  );
} 