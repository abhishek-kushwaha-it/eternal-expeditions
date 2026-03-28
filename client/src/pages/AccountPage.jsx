import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Image,
  LoadingState,
  FormGroup,
  ConfirmDialog,
  useConfirmDialog,
} from '../core-components';
import {
  useCurrentUser,
  useUpdateMeMutation,
  useUpdatePasswordMutation,
  useDeleteAccountMutation,
} from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import { IMAGE_URL } from '../utils/api';
import './AccountPage.css';

export default function AccountPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useCurrentUser();
  const updateMeMutation = useUpdateMeMutation();
  const updatePasswordMutation = useUpdatePasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const { addToast } = useToasts();
  const {
    dialog: deleteDialog,
    open: openDeleteDialog,
    confirm: confirmDelete,
    cancel: cancelDelete,
  } = useConfirmDialog();
  const {
    dialog: passwordErrorDialog,
    open: openPasswordErrorDialog,
    confirm: confirmPasswordError,
    cancel: cancelPasswordError,
  } = useConfirmDialog();
  const photoFileInputRef = useRef(null);

  const initialFormData = useMemo(
    () => ({
      name: user?.name || '',
      email: user?.email || '',
      photo: null,
      photoPreview: null,
    }),
    [user?.name, user?.email]
  );

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const [passwordData, setPasswordData] = useState({
    passwordCurrent: '',
    password: '',
    passwordConfirm: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: file,
          photoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    if (formData.photo) {
      data.append('photo', formData.photo);
    }

    try {
      await updateMeMutation.mutateAsync(data);

      // Clear preview and photo after successful upload
      setFormData((prev) => ({
        ...prev,
        photo: null,
        photoPreview: null,
      }));

      // Reset file input
      if (photoFileInputRef.current) {
        photoFileInputRef.current.value = '';
      }

      addToast('Profile updated successfully!', 'success');
    } catch {
      // Error is handled by mutation
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.passwordConfirm) {
      addToast('Passwords do not match', 'error');
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        passwordCurrent: passwordData.passwordCurrent,
        password: passwordData.password,
        passwordConfirm: passwordData.passwordConfirm,
      });

      // Clear password fields on success
      setPasswordData({
        passwordCurrent: '',
        password: '',
        passwordConfirm: '',
      });

      addToast('Password updated successfully!', 'success');
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to update password';

      // Show error dialog for wrong password
      if (errorMessage.includes('current password')) {
        await openPasswordErrorDialog({
          title: '❌ Wrong Current Password',
          message: errorMessage,
          confirmLabel: 'Try Again',
          cancelLabel: null,
        });
      } else {
        addToast(errorMessage, 'error');
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await openDeleteDialog({
      title: '⚠️ Deactivate Account?',
      message:
        "Your account will be marked as inactive. Your reviews and bookings will be preserved, but you won't appear as a guide. You can contact support to reactivate.",
      confirmLabel: 'Deactivate',
      cancelLabel: 'Cancel',
      isDanger: true,
    });

    if (confirmed) {
      try {
        await deleteAccountMutation.mutateAsync();
        addToast('Account deactivated. Logging out...', 'success');
        // Redirect is handled by the mutation's onSuccess callback
        setTimeout(() => navigate('/'), 2000);
      } catch {
        addToast('Failed to deactivate account', 'error');
      }
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading account..." minHeight="500px" />;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="main">
      <div className="user-view">
        {/* Sidebar Navigation */}
        <nav className="user-view__menu">
          <ul className="side-nav">
            <li className="side-nav--active">
              <Link to="/me" className="nav-link">
                <svg>
                  <use xlinkHref="/img/icons.svg#icon-settings"></use>
                </svg>
                Settings
              </Link>
            </li>
            <li>
              <Link to="/my-tour-bookings" className="nav-link">
                <svg>
                  <use xlinkHref="/img/icons.svg#icon-briefcase"></use>
                </svg>
                My bookings
              </Link>
            </li>

            {/* Guide/Admin Management Routes */}
            {['admin', 'guide'].includes(user.role) && (
              <div className="admin-nav">
                <h5 className="admin-nav__heading">Management</h5>
                <ul className="side-nav">
                  <li>
                    <Link to="/manage/tours" className="nav-link">
                      <svg>
                        <use xlinkHref="/img/icons.svg#icon-map"></use>
                      </svg>
                      Manage tours
                    </Link>
                  </li>
                  <li>
                    <Link to="/manage/reviews" className="nav-link">
                      <svg>
                        <use xlinkHref="/img/icons.svg#icon-star"></use>
                      </svg>
                      Manage reviews
                    </Link>
                  </li>
                  <li>
                    <Link to="/manage/bookings" className="nav-link">
                      <svg>
                        <use xlinkHref="/img/icons.svg#icon-briefcase"></use>
                      </svg>
                      Manage bookings
                    </Link>
                  </li>
                  <li>
                    <Link to="/manage/stats" className="nav-link">
                      <svg>
                        <use xlinkHref="/img/icons.svg#icon-trending-up"></use>
                      </svg>
                      Tour statistics
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {/* Admin Only Routes */}
            {user.role === 'admin' && (
              <div className="admin-nav">
                <h5 className="admin-nav__heading">Admin Only</h5>
                <ul className="side-nav">
                  <li>
                    <Link to="/admin/users" className="nav-link">
                      <svg>
                        <use xlinkHref="/img/icons.svg#icon-users"></use>
                      </svg>
                      Manage users
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </ul>
        </nav>

        {/* Main Content */}
        <div className="user-view__content">
          {/* Settings Section */}
          <div className="user-view__form-container">
            <h2 className="heading-secondary ma-bt-md">Your account settings</h2>

            <form className="form form-user-data" onSubmit={handleUpdateProfile}>
              <FormGroup
                id="name"
                label="Name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                name="name"
                required
                disabled={updateMeMutation.isPending}
              />

              <FormGroup
                id="email"
                label="Email address"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                name="email"
                required
                disabled={updateMeMutation.isPending}
              />

              {/* Photo Upload Section */}
              <div className="photo-upload-section">
                <div className="photo-upload-section__photo">
                  <Image
                    src={formData.photoPreview || `${IMAGE_URL}/users/${user.photo}`}
                    alt="User photo"
                    className="photo-upload-section__image"
                  />
                </div>
                <div className="photo-upload-section__controls">
                  <input
                    ref={photoFileInputRef}
                    className="photo-upload-section__input"
                    type="file"
                    accept="image/*"
                    id="photo"
                    onChange={handleFileChange}
                    disabled={updateMeMutation.isPending}
                  />
                  <label htmlFor="photo" className="photo-upload-section__label">
                    {formData.photoPreview ? '✓ Photo selected' : '📷 Choose new photo'}
                  </label>
                  <p className="photo-upload-section__info">JPG, PNG or GIF (Max. 5MB)</p>
                </div>
              </div>

              <div className="form__group right">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={updateMeMutation.isPending}
                >
                  {updateMeMutation.isPending ? 'Saving...' : 'Save settings'}
                </Button>
              </div>
            </form>
          </div>

          <div className="line">&nbsp;</div>

          {/* Password Change Section */}
          <div className="user-view__form-container">
            <h2 className="heading-secondary ma-bt-md">Password change</h2>

            <form className="form form-user-password" onSubmit={handleUpdatePassword}>
              <FormGroup
                id="password-current"
                label="Current password"
                type="password"
                placeholder="••••••••"
                name="passwordCurrent"
                value={passwordData.passwordCurrent}
                onChange={handlePasswordChange}
                required
                minLength="8"
                disabled={updatePasswordMutation.isPending}
              />

              <FormGroup
                id="password"
                label="New password"
                type="password"
                placeholder="••••••••"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                required
                minLength="8"
                disabled={updatePasswordMutation.isPending}
              />

              <FormGroup
                id="password-confirm"
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                name="passwordConfirm"
                value={passwordData.passwordConfirm}
                onChange={handlePasswordChange}
                required
                minLength="8"
                disabled={updatePasswordMutation.isPending}
              />

              <div className="form__group right">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending ? 'Updating...' : 'Save password'}
                </Button>
              </div>
            </form>
          </div>

          <div className="line">&nbsp;</div>

          {/* Account Management Section */}
          <div className="user-view__form-container">
            <h2 className="heading-secondary ma-bt-md danger-zone-title">⚠️ Account Management</h2>
            <p className="danger-zone-description">
              Deactivating your account will mark it as inactive. Your reviews and bookings will be
              preserved, but you'll be removed as a tour guide. You can contact support to
              reactivate your account.
            </p>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? '🔄 Deactivating...' : '🔐 Deactivate My Account'}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog {...deleteDialog} onConfirm={confirmDelete} onCancel={cancelDelete} />
      <ConfirmDialog
        {...passwordErrorDialog}
        onConfirm={confirmPasswordError}
        onCancel={cancelPasswordError}
      />
    </main>
  );
}
