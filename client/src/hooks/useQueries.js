import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import api from '../utils/api';

// Tours queries
export const useTours = () => {
  return useQuery({
    queryKey: ['tours'],
    queryFn: () => api.get('/tours').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 20, // 20 minutes (increased from 5)
    gcTime: 1000 * 60 * 60, // 1 hour cache
    retry: 2,
  });
};

// Get all tours for admin (including secret tours)
export const useAllToursAdmin = () => {
  return useQuery({
    queryKey: ['allToursAdmin'],
    queryFn: () => api.get('/tours/admin/all-tours').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 20, // 20 minutes (increased from 5)
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });
};

export const useTour = (id) => {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => api.get(`/tours/${id}`).then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 15, // 15 minutes (increased from 10)
    gcTime: 1000 * 60 * 60,
    retry: 2,
    enabled: !!id,
  });
};

// Get top 5 cheap tours
export const useTopCheapTours = () => {
  return useQuery({
    queryKey: ['topCheapTours'],
    queryFn: () => api.get('/tours/top-5-cheap').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 30, // 30 minutes (increased from 15)
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });
};

// Get tour statistics (admin)
export const useTourStats = () => {
  return useQuery({
    queryKey: ['tourStats'],
    queryFn: () => api.get('/tours/tour-stats').then((res) => res.data.data),
    staleTime: 1000 * 60 * 60, // 1 hour (increased from 30 min)
    gcTime: 1000 * 60 * 120,
    retry: 1,
  });
};

// Get monthly plan for a year (admin)
export const useMonthlyPlan = (year) => {
  return useQuery({
    queryKey: ['monthlyPlan', year],
    queryFn: () => api.get(`/tours/monthly-plan/${year}`).then((res) => res.data.data.plan),
    staleTime: 1000 * 60 * 60, // 1 hour (increased from 30 min)
    gcTime: 1000 * 60 * 120,
    retry: 1,
    enabled: !!year,
  });
};

// Get tours within distance
export const useToursWithin = (distance, lat, lng, unit = 'mi') => {
  return useQuery({
    queryKey: ['toursWithin', distance, lat, lng, unit],
    queryFn: async () => {
      if (!distance || !lat || !lng || distance === null || lat === null || lng === null) {
        throw new Error('Distance, latitude, and longitude are required');
      }

      const dist = parseFloat(distance);
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(dist) || isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid distance or coordinate values');
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      const response = await api.get(
        `/tours/tours-within/${dist}/center/${latitude},${longitude}/unit/${unit}`
      );
      return response.data.data.data;
    },
    staleTime: 1000 * 60 * 20, // 20 minutes (increased from 10)
    gcTime: 1000 * 60 * 60,
    retry: 1,
    enabled: !!(distance && lat && lng && distance !== null && lat !== null && lng !== null),
  });
};

// Get distances from a point
export const useDistances = (lat, lng, unit = 'mi') => {
  return useQuery({
    queryKey: ['distances', lat, lng, unit],
    queryFn: async () => {
      if (!lat || !lng || lat === null || lng === null) {
        throw new Error('Latitude and longitude are required');
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid latitude or longitude values');
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      const response = await api.get(`/tours/distances/${latitude},${longitude}/unit/${unit}`);
      return response.data.data.data;
    },
    staleTime: 1000 * 60 * 20, // 20 minutes (increased from 10)
    gcTime: 1000 * 60 * 60,
    retry: 1,
    enabled: !!(lat && lng && lat !== null && lng !== null),
  });
};

// Admin: Create tour
export const useCreateTourMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tourData) => {
      const response = await api.post('/tours', tourData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and immediately refetch tour lists (all instances)
      queryClient.invalidateQueries({
        queryKey: ['tours'],
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: ['allToursAdmin'],
        refetchType: 'all',
      });
    },
  });
};

// Admin: Update tour
export const useUpdateTourMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, data }) => api.patch(`/tours/${tourId}`, data),
    onSuccess: (response, variables) => {
      // Update the specific tour in cache
      queryClient.setQueryData(['tour', variables.tourId], response.data.data);
      // Invalidate and immediately refetch tour lists (all instances)
      queryClient.invalidateQueries({
        queryKey: ['tours'],
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: ['allToursAdmin'],
        refetchType: 'all',
      });
    },
  });
};

// Admin: Delete tour
export const useDeleteTourMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tourId) => api.delete(`/tours/${tourId}`),
    onSuccess: (response, tourId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['tour', tourId] });
      // Invalidate and immediately refetch tour lists (all instances)
      queryClient.invalidateQueries({
        queryKey: ['tours'],
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: ['allToursAdmin'],
        refetchType: 'all',
      });
    },
  });
};

// User queries
export const useCurrentUser = () => {
  const { isAuthenticated, user: authContextUser } = useAuth();
  const queryClient = useQueryClient();

  // On mount, prefill React Query cache with AuthContext user data
  useEffect(() => {
    if (authContextUser) {
      queryClient.setQueryData(['currentUser'], authContextUser);
    }
  }, [authContextUser, queryClient]);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get('/users/me').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 15, // 15 minutes - reduced API calls
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      if (error.response?.status === 401) return false;
      return failureCount < 2;
    },
    enabled: isAuthenticated,
    initialData: authContextUser || undefined,
  });
};

// My bookings
export const useMyBookings = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.get('/bookings/my-bookings').then((res) => res.data.data.bookings),
    staleTime: 1000 * 60 * 10, // 10 minutes (increased from always refetch)
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (error.response?.status === 401) return false;
      return failureCount < 2;
    },
    enabled: isAuthenticated,
  });
};

// Get all bookings (admin)
export const useAllBookings = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['allBookings'],
    queryFn: () => api.get('/bookings').then((res) => res.data.data.bookings || res.data.data.data),
    staleTime: 1000 * 60 * 10, // 10 minutes (increased from always refetch)
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (error.response?.status === 401 || error.response?.status === 403) return false;
      return failureCount < 2;
    },
    enabled: isAuthenticated,
  });
};

// Get specific booking
export const useBooking = (bookingId) => {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.get(`/bookings/${bookingId}`).then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 15, // 15 minutes (increased from 10)
    gcTime: 1000 * 60 * 60,
    retry: 1,
    enabled: !!bookingId,
  });
};

// Get all reviews
export const useAllReviews = () => {
  return useQuery({
    queryKey: ['allReviews'],
    queryFn: () => api.get('/reviews').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 15, // 15 minutes (increased from 5)
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });
};

// Get current user's reviews
export const useMyReviews = () => {
  return useQuery({
    queryKey: ['myReviews'],
    queryFn: () => api.get('/reviews/my-reviews').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 15, // 15 minutes (increased from 5)
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });
};

// Get specific review
export const useReview = (reviewId) => {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => api.get(`/reviews/${reviewId}`).then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 10,
    retry: 1,
    enabled: !!reviewId,
  });
};

// Auth mutations
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }) => api.post('/users/login', { email, password }),
    onSuccess: (response) => {
      const userData = response.data.data.user;
      // Set React Query cache
      queryClient.setQueryData(['currentUser'], userData);
    },
  });
};

export const useSignupMutation = () => {
  const queryClient = useQueryClient();
  const { login } = useAuth();

  return useMutation({
    mutationFn: ({ name, email, password, passwordConfirm }) =>
      api.post('/users/signup', { name, email, password, passwordConfirm }),
    onSuccess: (response) => {
      const userData = response.data.data.user;
      // Auto-authenticate after signup
      login(userData);
      // Set React Query cache
      queryClient.setQueryData(['currentUser'], userData);
    },
    // Disable retries for signup - it's not idempotent for duplicate prevention
    // User must manually retry if signup fails
    retry: 0,
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: () => api.get('/users/logout'),
    onSuccess: () => {
      // Update AuthContext
      logout();
      // Clear all cache
      queryClient.clear();
    },
  });
};

// Update mutations
export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (data) => api.patch('/users/updateMe', data),
    onSuccess: (response) => {
      const userData = response.data.data.user;
      // Update AuthContext
      updateUser(userData);
      // Update React Query cache directly (no refetch needed)
      queryClient.setQueryData(['currentUser'], userData);
    },
  });
};
export const useUpdatePasswordMutation = () => {
  return useMutation({
    mutationFn: ({ passwordCurrent, password, passwordConfirm }) =>
      api.patch('/users/updateMyPassword', {
        passwordCurrent,
        password,
        passwordConfirm,
      }),
    onError: (error) => {
      // Error will be caught and displayed in the component
      throw error;
    },
  });
};

// Book tour mutation
export const useBookTourMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tourId) => api.get(`/bookings/checkout-session/${tourId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });
};

// Forgot password
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: ({ email }) => api.post('/users/forgotPassword', { email }),
  });
};

// Verify reset token
export const useVerifyResetToken = (token) => {
  return useQuery({
    queryKey: ['verifyResetToken', token],
    queryFn: () => api.get(`/users/verifyResetToken/${token}`),
    enabled: !!token, // Only run if token exists
    staleTime: 1000 * 60, // 1 minute
    retry: false,
  });
};

// Reset password
export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: ({ token, password, passwordConfirm }) =>
      api.patch(`/users/resetPassword/${token}`, { password, passwordConfirm }),
  });
};

// Create booking (manual - admin/guide only)
export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tour, user, price, paid = false, paymentMethod = 'other' }) =>
      api.post('/bookings', {
        tour,
        user,
        price,
        paid,
        paymentMethod,
      }),
    onSuccess: () => {
      // Invalidate queries so they refetch with fresh data
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
    },
  });
};

// Get booking (admin)
export const useGetBookingMutation = () => {
  return useMutation({
    mutationFn: (bookingId) => api.get(`/bookings/${bookingId}`),
  });
};

// Update booking (admin)
export const useUpdateBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, data }) => api.patch(`/bookings/${bookingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });
};

// Delete booking
export const useDeleteBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId) => api.delete(`/bookings/${bookingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });
};

// Create review
export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tour, rating, review }) => api.post('/reviews', { tour, rating, review }),
    onSuccess: (response) => {
      // Invalidate user's reviews and all reviews (reviews are read-heavy, cache invalidation is reasonable)
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });

      // Invalidate the specific tour to update its rating stats
      let tourId = null;
      try {
        tourId = response.data?.data?.tour?._id || response.data?.data?.tour;
      } catch {
        // Silently ignore - tourId extraction is not critical
      }

      if (tourId) {
        queryClient.invalidateQueries({ queryKey: ['tour', tourId] });
      }
    },
  });
};

// Update review
export const useUpdateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, rating, review }) =>
      api.patch(`/reviews/${reviewId}`, { rating, review }),
    onSuccess: (response, variables) => {
      // Invalidate user's reviews and all reviews
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });

      // Invalidate specific tour if tourId provided
      if (variables.tourId) {
        queryClient.invalidateQueries({ queryKey: ['tour', variables.tourId] });
      }
    },
  });
};

// Delete review
export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId }) => api.delete(`/reviews/${reviewId}`),
    onSuccess: (response, variables) => {
      // Invalidate user's reviews and all reviews
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });

      // Invalidate specific tour if tourId provided
      if (variables.tourId) {
        queryClient.invalidateQueries({ queryKey: ['tour', variables.tourId] });
      }
    },
  });
};

// Delete account
export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: () => api.delete('/users/deleteMe'),
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
};

// Admin: Get all users
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: () => api.get('/users').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

// Admin: Get specific user
export const useGetUserMutation = () => {
  return useMutation({
    mutationFn: (userId) => api.get(`/users/${userId}`),
  });
};

// Admin: Create user
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => api.post('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
};

// Admin: Update user
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }) => api.patch(`/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
};

// Admin: Delete user
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
};

// Get all guides
export const useGuides = () => {
  return useQuery({
    queryKey: ['guides'],
    queryFn: () => api.get('/users?role=guide').then((res) => res.data.data.data),
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });
};

// Get all admin users for guide assignment
export const useAdminAndGuides = () => {
  return useQuery({
    queryKey: ['adminAndGuides'],
    queryFn: async () => {
      const [guidesRes, adminsRes] = await Promise.all([
        api.get('/users?role=guide'),
        api.get('/users?role=admin'),
      ]);
      return [...(guidesRes.data.data.data || []), ...(adminsRes.data.data.data || [])];
    },
    staleTime: 1000 * 60 * 15,
    retry: 2,
  });
};
