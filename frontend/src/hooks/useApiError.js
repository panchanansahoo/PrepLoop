import { useCallback } from 'react';
import { useGlobalToast } from '../context/ToastContext';

const ERROR_MESSAGES = {
  VALIDATION_ERROR: { title: 'Invalid Input', description: 'Please check your input and try again.' },
  NOT_FOUND: { title: 'Not Found', description: 'The requested resource was not found.' },
  UNAUTHORIZED: { title: 'Session Expired', description: 'Please sign in to continue.' },
  FORBIDDEN: { title: 'Access Denied', description: "You don't have permission for this action." },
  RATE_LIMITED: { title: 'Too Many Requests', description: 'Please wait a moment and try again.' },
  PAYMENT_FAILED: { title: 'Payment Failed', description: 'Your payment could not be processed. Please try again.' },
  AI_SERVICE_ERROR: { title: 'AI Unavailable', description: 'AI service is temporarily unavailable. Please try again shortly.' },
  DATABASE_ERROR: { title: 'Service Error', description: 'A temporary issue occurred. Please try again.' },
  EXTERNAL_SERVICE_ERROR: { title: 'Service Unavailable', description: 'An external service is temporarily unavailable.' },
  FILE_TOO_LARGE: { title: 'File Too Large', description: 'The file exceeds the maximum allowed size.' },
  INTERNAL_ERROR: { title: 'Something Went Wrong', description: 'An unexpected error occurred. Please try again.' },
};

export function useApiError() {
  const { showToast } = useGlobalToast();

  const handleError = useCallback((error, options = {}) => {
    const { silent = false, fallbackMessage = null } = options;

    // Don't show toast if silent mode
    if (silent) return;

    // Extract error info from axios error or raw error
    let code = 'INTERNAL_ERROR';
    let message = fallbackMessage || 'Something went wrong. Please try again.';
    let requestId = null;

    if (error?.response) {
      // Axios error with response
      const data = error.response.data;
      code = data?.code || 'INTERNAL_ERROR';
      message = data?.error || message;
      requestId = data?.requestId || null;

      // Handle specific HTTP status codes when no error code is present
      if (!data?.code) {
        const status = error.response.status;
        if (status === 401) code = 'UNAUTHORIZED';
        else if (status === 403) code = 'FORBIDDEN';
        else if (status === 404) code = 'NOT_FOUND';
        else if (status === 429) code = 'RATE_LIMITED';
        else if (status === 413) code = 'FILE_TOO_LARGE';
        else if (status >= 500) code = 'INTERNAL_ERROR';
      }
    } else if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
      code = 'NETWORK_ERROR';
    } else if (error?.code === 'ECONNABORTED') {
      code = 'TIMEOUT';
    }

    // Get user-friendly message
    const mapped = ERROR_MESSAGES[code];
    const toastConfig = {
      type: 'error',
      title: mapped?.title || 'Error',
      description: mapped?.description || message,
      duration: code === 'RATE_LIMITED' ? 8000 : 5000,
    };

    // Special cases
    if (code === 'NETWORK_ERROR') {
      toastConfig.title = 'Connection Lost';
      toastConfig.description = 'Please check your internet connection.';
    } else if (code === 'TIMEOUT') {
      toastConfig.title = 'Request Timed Out';
      toastConfig.description = 'The request took too long. Please try again.';
    }

    // Add request ID for support reference on server errors
    if (requestId && code === 'INTERNAL_ERROR') {
      toastConfig.description += ` (Ref: ${requestId.slice(0, 8)})`;
    }

    showToast(toastConfig);

    return { code, message, requestId };
  }, [showToast]);

  return { handleError };
}

export default useApiError;
