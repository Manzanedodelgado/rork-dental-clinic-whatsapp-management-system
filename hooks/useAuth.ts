import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
}

const defaultUsers: User[] = [
  {
    id: '1',
    username: 'JMD',
    role: 'admin',
    permissions: ['all'],
    createdAt: '2025-01-01T00:00:00Z',
  }
];

const defaultCredentials = {
  'JMD': '190582'
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const storage = useStorage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(defaultUsers);
  const [credentials, setCredentials] = useState<Record<string, string>>(defaultCredentials);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [storedAuth, storedUsers, storedCredentials] = await Promise.all([
        storage.getItem('auth'),
        storage.getItem('users'),
        storage.getItem('credentials')
      ]);

      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        setIsAuthenticated(authData.isAuthenticated);
        setUser(authData.user);
      }

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }

      if (storedCredentials) {
        setCredentials(JSON.parse(storedCredentials));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (authData: { isAuthenticated: boolean; user: User | null }) => {
    try {
      await storage.setItem('auth', JSON.stringify(authData));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  const saveUsers = async (newUsers: User[]) => {
    try {
      await storage.setItem('users', JSON.stringify(newUsers));
      setUsers(newUsers);
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };

  const saveCredentials = async (newCredentials: Record<string, string>) => {
    try {
      await storage.setItem('credentials', JSON.stringify(newCredentials));
      setCredentials(newCredentials);
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Login attempt for:', username);
      
      if (credentials[username] === password) {
        const foundUser = users.find(u => u.username === username);
        if (foundUser) {
          const updatedUser = {
            ...foundUser,
            lastLogin: new Date().toISOString()
          };
          
          setIsAuthenticated(true);
          setUser(updatedUser);
          
          // Update user's last login in users array
          const updatedUsers = users.map(u => 
            u.id === updatedUser.id ? updatedUser : u
          );
          await saveUsers(updatedUsers);
          
          await saveAuthState({ isAuthenticated: true, user: updatedUser });
          
          console.log('✅ Login successful for:', username);
          return true;
        }
      }
      
      console.log('❌ Login failed for:', username);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setUser(null);
      await saveAuthState({ isAuthenticated: false, user: null });
      console.log('👋 User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createUser = async (username: string, password: string, role: 'admin' | 'user', permissions: string[]): Promise<boolean> => {
    try {
      if (users.find(u => u.username === username)) {
        return false; // User already exists
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        role,
        permissions,
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      const updatedCredentials = { ...credentials, [username]: password };

      await saveUsers(updatedUsers);
      await saveCredentials(updatedCredentials);

      console.log('✅ User created:', username);
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      return false;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      );
      
      await saveUsers(updatedUsers);
      
      // If updating current user, update auth state
      if (user?.id === userId) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await saveAuthState({ isAuthenticated: true, user: updatedUser });
      }
      
      console.log('✅ User updated:', userId);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) return false;

      const updatedUsers = users.filter(u => u.id !== userId);
      const updatedCredentials = { ...credentials };
      delete updatedCredentials[userToDelete.username];

      await saveUsers(updatedUsers);
      await saveCredentials(updatedCredentials);

      console.log('✅ User deleted:', userId);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const changePassword = async (username: string, newPassword: string): Promise<boolean> => {
    try {
      const updatedCredentials = { ...credentials, [username]: newPassword };
      await saveCredentials(updatedCredentials);
      console.log('✅ Password changed for:', username);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  };

  return {
    isAuthenticated,
    user,
    users,
    isLoading,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    hasPermission
  };
});