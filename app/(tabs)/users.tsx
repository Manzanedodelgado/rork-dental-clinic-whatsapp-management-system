import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
} from 'react-native';

import { useAuth, User } from '@/hooks/useAuth';
import Colors from '@/constants/colors';
import { Users, Plus, Edit3, Trash2, Shield, Key } from 'lucide-react-native';

export default function UsersScreen() {
  const { users, user: currentUser, createUser, updateUser, deleteUser, changePassword, hasPermission, resetToDefaults } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    permissions: [] as string[]
  });

  const availablePermissions = [
    'dashboard',
    'patients',
    'appointments',
    'whatsapp',
    'templates',
    'automations',
    'ai',
    'users'
  ];

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'user',
      permissions: []
    });
  };

  const handleCreateUser = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      console.log('Error: Todos los campos son requeridos');
      return;
    }

    const permissions = formData.role === 'admin' ? ['all'] : formData.permissions;
    const success = await createUser(formData.username.trim(), formData.password, formData.role, permissions);
    
    if (success) {
      console.log('Usuario creado exitosamente');
      setShowCreateModal(false);
      resetForm();
    } else {
      console.log('Error: El usuario ya existe');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    const permissions = formData.role === 'admin' ? ['all'] : formData.permissions;
    const success = await updateUser(selectedUser.id, {
      role: formData.role,
      permissions
    });

    if (success) {
      console.log('Usuario actualizado exitosamente');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      console.log('Error: No puedes eliminar tu propio usuario');
      return;
    }

    const success = await deleteUser(userId);
    if (success) {
      console.log('Usuario eliminado exitosamente');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !formData.password.trim()) {
      console.log('Error: La contraseña es requerida');
      return;
    }

    const success = await changePassword(selectedUser.username, formData.password);
    if (success) {
      console.log('Contraseña cambiada exitosamente');
      setShowPasswordModal(false);
      setSelectedUser(null);
      resetForm();
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      permissions: user.permissions.includes('all') ? [] : user.permissions
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...formData, password: '' });
    setShowPasswordModal(true);
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (!hasPermission('users') && !hasPermission('all')) {
    return (
      <View style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Shield size={64} color={Colors.light.textSecondary} />
          <Text style={styles.noPermissionText}>
            No tienes permisos para acceder a esta sección
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={24} color={Colors.light.primary} />
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefaults}
            testID="reset-button"
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            testID="add-user-button"
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <Text style={styles.username}>{user.username}</Text>
                <View style={[styles.roleBadge, user.role === 'admin' && styles.adminBadge]}>
                  <Text style={[styles.roleText, user.role === 'admin' && styles.adminRoleText]}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.userDetail}>
                Creado: {new Date(user.createdAt).toLocaleDateString()}
              </Text>
              
              {user.lastLogin && (
                <Text style={styles.userDetail}>
                  Último acceso: {new Date(user.lastLogin).toLocaleDateString()}
                </Text>
              )}

              <View style={styles.permissionsContainer}>
                <Text style={styles.permissionsLabel}>Permisos:</Text>
                <Text style={styles.permissionsText}>
                  {user.permissions.includes('all') ? 'Todos los permisos' : user.permissions.join(', ')}
                </Text>
              </View>
            </View>

            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(user)}
                testID={`edit-user-${user.id}`}
              >
                <Edit3 size={16} color={Colors.light.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openPasswordModal(user)}
                testID={`change-password-${user.id}`}
              >
                <Key size={16} color={Colors.light.secondary} />
              </TouchableOpacity>

              {user.id !== currentUser?.id && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteUser(user.id)}
                  testID={`delete-user-${user.id}`}
                >
                  <Trash2 size={16} color={Colors.light.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Usuario</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                placeholder="Nombre de usuario"
                autoCapitalize="none"
                testID="create-username-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Contraseña"
                secureTextEntry
                testID="create-password-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rol</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleOption, formData.role === 'user' && styles.roleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, role: 'user' }))}
                >
                  <Text style={[styles.roleOptionText, formData.role === 'user' && styles.roleOptionTextSelected]}>
                    Usuario
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, formData.role === 'admin' && styles.roleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                >
                  <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleOptionTextSelected]}>
                    Administrador
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.role === 'user' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Permisos</Text>
                {availablePermissions.map((permission) => (
                  <View key={permission} style={styles.permissionRow}>
                    <Text style={styles.permissionName}>
                      {permission.charAt(0).toUpperCase() + permission.slice(1)}
                    </Text>
                    <Switch
                      value={formData.permissions.includes(permission)}
                      onValueChange={() => togglePermission(permission)}
                      trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                      thumbColor="white"
                    />
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateUser}
              testID="create-user-submit"
            >
              <Text style={styles.submitButtonText}>Crear Usuario</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <Text style={styles.readOnlyText}>{formData.username}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rol</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleOption, formData.role === 'user' && styles.roleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, role: 'user' }))}
                >
                  <Text style={[styles.roleOptionText, formData.role === 'user' && styles.roleOptionTextSelected]}>
                    Usuario
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, formData.role === 'admin' && styles.roleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                >
                  <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleOptionTextSelected]}>
                    Administrador
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.role === 'user' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Permisos</Text>
                {availablePermissions.map((permission) => (
                  <View key={permission} style={styles.permissionRow}>
                    <Text style={styles.permissionName}>
                      {permission.charAt(0).toUpperCase() + permission.slice(1)}
                    </Text>
                    <Switch
                      value={formData.permissions.includes(permission)}
                      onValueChange={() => togglePermission(permission)}
                      trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                      thumbColor="white"
                    />
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleEditUser}
              testID="edit-user-submit"
            >
              <Text style={styles.submitButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <Text style={styles.readOnlyText}>{selectedUser?.username}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Nueva contraseña"
                secureTextEntry
                testID="change-password-input"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleChangePassword}
              testID="change-password-submit"
            >
              <Text style={styles.submitButtonText}>Cambiar Contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginRight: 12,
  },
  roleBadge: {
    backgroundColor: Colors.light.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminBadge: {
    backgroundColor: Colors.light.primary,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  adminRoleText: {
    color: 'white',
  },
  userDetail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  permissionsContainer: {
    marginTop: 8,
  },
  permissionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  permissionsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPermissionText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  cancelButton: {
    fontSize: 16,
    color: Colors.light.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.light.surface,
    color: Colors.light.text,
  },
  readOnlyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    paddingVertical: 12,
  },
  roleSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
  },
  roleOptionSelected: {
    backgroundColor: Colors.light.primary,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  roleOptionTextSelected: {
    color: 'white',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  permissionName: {
    fontSize: 16,
    color: Colors.light.text,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: Colors.light.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});