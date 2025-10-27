import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/context/ColorSchemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const { userData, loading, isGuest } = useAuth();
  const { canAccessFeature } = usePermissions();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    console.log('Auth state:', {
      role: userData?.role,
      loading,
      isAdmin: userData?.role === 'Admin',
      isGuest,
      fullUserData: userData
    });
  }, [userData?.role, loading, isGuest]);

  if (loading) {
    return null;
  }

  const isAdmin = userData?.role === 'Admin';

  console.log('Is admin?:', isAdmin, 'Is guest?:', isGuest);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerShown: false,
          tabBarBackground: TabBarBackground,
          tabBarStyle: {
            ...Platform.select({
              ios: {
                position: 'absolute',
                height: 88,
              },
              android: {
                height: 60 + insets.bottom,
                elevation: 8,
                backgroundColor: Colors[colorScheme].background,
                paddingBottom: insets.bottom,
              },
            }),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: Colors[colorScheme].border,
          },
          tabBarItemStyle: Platform.select({
            ios: {
              height: '100%',
              paddingBottom: 20,
            },
            android: {
              height: 60,
              paddingBottom: Math.max(4, insets.bottom * 0.3),
            },
          }),
          tabBarLabelStyle: {
            fontSize: 12,
            textAlign: 'center',
          },
          tabBarIconStyle: {
            marginBottom: 4,
            marginTop: 4,
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="product"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Ionicons name="bag" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: 'Contact',
          tabBarIcon: ({ color }) => <Ionicons name="mail" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
          href: isGuest ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={28} color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />
      </Tabs>
    </>
  );
}
