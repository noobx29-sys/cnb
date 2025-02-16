import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, Alert, ActivityIndicator, RefreshControl, useColorScheme, Platform, StatusBar, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import { Searchbar } from 'react-native-paper';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers, updateUserRole, UserData } from '@/services/firebase';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';

type UserRole = 'Admin' | 'Manager' | 'User - Price' | 'User - No Price' | 'Pending';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const { userData } = useAuth();
  const { canManageUsers } = usePermissions();
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    safeArea: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      padding: 20,
    },
    usersList: {
      padding: 20,
      gap: 12,
    },
    userItem: {
      marginBottom: 12,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    userInfo: {
      gap: 4,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalTitle: {
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      fontSize: 24,
      fontWeight: '700',
    },
    userEmail: {
      opacity: 0.7,
    },
    roleButton: {
      alignSelf: 'flex-end',
      backgroundColor: Colors.light.tint,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: -40,
    },
    roleText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    roleDropdown: {
      position: 'absolute',
      right: 16,
      backgroundColor: colorScheme === 'dark' ? Colors.light.secondaryBackground : Colors.dark.secondaryBackground,
      borderRadius: 8,
      padding: 8,
      zIndex: 9999,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      minWidth: 120,
    },
    roleOption: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      width: '100%',
      minWidth: 100,
      marginVertical: 2,
      backgroundColor: 'transparent',
    },
    roleOptionText: {
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      paddingLeft: 10,
      fontSize: 16,
    },
    selectedRoleOption: {
      backgroundColor: colorScheme === 'dark' ? Colors.dark.tint + '20' : Colors.light.tint + '20',
      borderRadius: 8,
    },
    selectedRoleText: {
      color: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
      fontWeight: '700',
    },
    listContainer: {
      flex: 1,
      height: '100%',
    },
    searchContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    modal: {
      margin: 0,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      minHeight: 200,
    },
    roleOptionModal: {
      paddingVertical: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }); 

  const roleOptions: UserRole[] = ['Admin', 'Manager', 'User - Price', 'User - No Price', 'Pending'];

  useEffect(() => {
    console.log('Current user data:', userData);
    
    if (!userData) {
      console.log('No user data found');
      return;
    }

    if (!canManageUsers()) {
      console.log('User cannot manage users. Role:', userData.role);
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this page.'
      );
      router.replace('/(tabs)');
      return;
    }

    console.log('Loading users...');
    loadUsers();
  }, [userData]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // Don't allow non-admins to change roles
      if (userData?.role !== 'Admin') {
        Alert.alert('Error', 'Only administrators can modify user roles');
        return;
      }

      // Don't allow admins to remove their own admin role
      if (userId === userData.uid && newRole !== 'Admin') {
        const confirmed = await new Promise((resolve) => {
          Alert.alert(
            'Warning',
            'You are about to remove your own admin privileges. This cannot be undone. Are you sure?',
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Continue', onPress: () => resolve(true), style: 'destructive' }
            ]
          );
        });

        if (!confirmed) return;
      }

      // Get the user's current data to check if they're moving from Pending status
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      const currentUserData = userSnapshot.data();
      const isPendingToActive = currentUserData?.role === 'Pending' && newRole !== 'Pending';

      // Update the user's role
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });

      // If the user was pending and is now being activated, trigger the email notification
      if (isPendingToActive) {
        try {
          // For now, we'll just show an alert that we need to set up Firebase Cloud Functions
          console.log('User activated:', {
            userId,
            email: currentUserData?.email,
            newRole
          });
          Alert.alert(
            'Note',
            'Email notification system needs to be set up with Firebase Cloud Functions to send activation emails.'
          );
        } catch (error) {
          console.error('Error sending activation email:', error);
        }
      }

      await loadUsers();
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      
      Alert.alert('Success', 'User role updated successfully');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', error.message || 'Failed to update user role');
    }
  };

  const renderUserItem = ({ item: user }: { item: UserData }) => (
    <Pressable 
      style={styles.userItem}
      onPress={() => {
        setSelectedUser(user);
        setIsRoleModalVisible(true);
      }}
    >
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userName}>{user.name}</ThemedText>
        <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.roleButton}>
        <ThemedText style={styles.roleText}>{user.role}</ThemedText>
      </ThemedView>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Manage Users</ThemedText>
        </ThemedView>

        <ThemedView style={styles.searchContainer}>
          <Searchbar
            placeholder="Search users"
            onChangeText={handleSearch}
            value={searchQuery}
          />
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </ThemedView>
        ) : (
          <FlashList
            data={filteredUsers}
            renderItem={renderUserItem}
            estimatedItemSize={88}
            contentContainerStyle={styles.usersList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        <Modal
          isVisible={isRoleModalVisible}
          onBackdropPress={() => setIsRoleModalVisible(false)}
          style={styles.modal}
          backdropTransitionOutTiming={0}
        >
          <ThemedView style={styles.modalContent}>
            <ThemedText style={[styles.modalTitle, { marginBottom: 8 }]}>{selectedUser?.name}</ThemedText>
            <Picker
              selectedValue={selectedUser?.role}
              onValueChange={(value) => {
                if (selectedUser) {
                  handleRoleChange(selectedUser.uid, value as UserRole);
                  setIsRoleModalVisible(false);
                }
              }}
              style={{ width: '100%' }}
            >
              {roleOptions.map((role) => (
                <Picker.Item key={role} label={role} value={role} />
              ))}
            </Picker>
          </ThemedView>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}