/* ============================================
   ERROR HANDLING UTILITIES
   ============================================ */

/**
 * Get error message from API response
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.statusText) {
    return error.statusText;
  }

  return 'An unexpected error occurred';
};

/**
 * Get error details from API response
 */
export const getErrorDetails = (error) => {
  return {
    message: getErrorMessage(error),
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    data: error?.response?.data,
    isNetworkError: error?.code === 'ERR_NETWORK' || !error?.response,
    isTimeoutError: error?.code === 'ECONNABORTED',
  };
};
