import { useState, useCallback, useMemo } from 'react';
import { useAllUsers, useDeleteUserMutation, useUpdateUserMutation } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import {
  Button,
  Image,
  LoadingState,
  ErrorState,
  ConfirmDialog,
  useConfirmDialog,
} from '../core-components';
import { IMAGE_URL } from '../utils/api';
import './ManageUsers.css';

const USER_ROLES = ['user', 'admin', 'guide'];

// Status Badge Components for User Management
const RoleBadge = ({ role }) => {
  const getVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'guide':
        return 'info';
      case 'user':
        return 'default';
      default:
        return 'default';
    }
  };

  const variant = getVariant(role);
  return (
    <span className={`status-badge status-badge--${variant}`}>
      <span className="status-badge__icon"></span>
      <span className="status-badge__text">{role}</span>
    </span>
  );
};

const ActiveBadge = ({ isActive }) => {
  const variant = isActive ? 'success' : 'warning';
  const text = isActive ? 'Active' : 'Inactive';
  return (
    <span className={`status-badge status-badge--${variant}`}>
      <span className="status-badge__icon"></span>
      <span className="status-badge__text">{text}</span>
    </span>
  );
};

export default function ManageUsers() {
  const { data: users = [], isLoading, error } = useAllUsers();
  const deleteUserMutation = useDeleteUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const { addToast } = useToasts();
  const {
    dialog: deleteDialog,
    open: openDeleteDialog,
    confirm: confirmDelete,
    cancel: cancelDelete,
  } = useConfirmDialog();

  const [filterRole, setFilterRole] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('user');

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (filterRole !== 'all' && u.role !== filterRole) return false;
        if (searchName && !u.name?.toLowerCase().includes(searchName.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, filterRole, searchName]);

  const handleUpdateRole = useCallback(
    async (userId) => {
      try {
        await updateUserMutation.mutateAsync({
          userId,
          data: { role: editRole },
        });
        addToast('User role updated successfully!', 'success');
        setEditingId(null);
      } catch (error) {
        addToast(error?.message || 'Failed to update user', 'error');
      }
    },
    [editRole, updateUserMutation, addToast]
  );

  const handleDeleteUser = useCallback(
    async (userId) => {
      const confirmed = await openDeleteDialog({
        title: 'Delete User?',
        message: 'This action cannot be undone. All user data will be permanently deleted.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        isDanger: true,
      });

      if (confirmed) {
        try {
          await deleteUserMutation.mutateAsync(userId);
          addToast('User deleted successfully!', 'success');
        } catch (error) {
          addToast(error?.message || 'Failed to delete user', 'error');
        }
      }
    },
    [deleteUserMutation, addToast, openDeleteDialog]
  );

  if (isLoading) {
    return <LoadingState message="Loading users..." minHeight="60vh" />;
  }

  if (error) {
    return (
      <main className="main">
        <ErrorState
          title="Failed to Load Users"
          message={error?.message || 'An error occurred while loading users.'}
          emoji="⚠️"
          showAction={false}
        />
      </main>
    );
  }

  return (
    <main className="main">
      <div className="page__container">
        <div className="manage-users__header">
          <h2 className="page__title">👥 Manage Users ({users.length})</h2>
          <p className="manage-users__info">Users are created through the sign-up process</p>
        </div>

        <div className="manage-users__filters">
          <div className="filters__grid">
            <div className="form__group">
              <label className="form__label">Filter by Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="form__select"
              >
                <option value="all">All Roles</option>
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form__group">
              <label className="form__label">Search by Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="User name..."
                className="form__input"
              />
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__text">No users match your filters</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table__head">
                <tr>
                  <th className="table__header">Photo</th>
                  <th className="table__header">Name</th>
                  <th className="table__header">Email</th>
                  <th className="table__header">Role</th>
                  <th className="table__header">Status</th>
                  <th className="table__header table__header--center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isEditing = editingId === user._id;

                  return (
                    <tr key={user._id} className="table__row">
                      <td className="table__cell">
                        <Image
                          src={`${IMAGE_URL}/users/${user.photo}`}
                          alt={user.name}
                          loading="lazy"
                          className="user-avatar"
                        />
                      </td>
                      <td className="table__cell table__cell--name">{user.name}</td>
                      <td className="table__cell">{user.email}</td>
                      <td className="table__cell">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="role-select"
                          >
                            {USER_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={user.role} />
                        )}
                      </td>
                      <td className="table__cell">
                        <ActiveBadge isActive={user.active !== false} />
                      </td>
                      <td className="table__cell table__cell--center table__cell--actions">
                        <div className="actions-group">
                          {isEditing ? (
                            <>
                              <Button
                                onClick={() => handleUpdateRole(user._id)}
                                variant="success"
                                size="sm"
                                disabled={updateUserMutation.isPending}
                                loading={updateUserMutation.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingId(null)}
                                variant="secondary"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  setEditingId(user._id);
                                  setEditRole(user.role);
                                }}
                                variant="primary"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteUser(user._id)}
                                variant="danger"
                                size="sm"
                                disabled={deleteUserMutation.isPending}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmDialog {...deleteDialog} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </main>
  );
}
