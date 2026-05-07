export class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

export function handleAPIError(error) {
  // Network errors
  if (!navigator.onLine) {
    return {
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      type: 'network',
    };
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      title: 'Request Timed Out',
      message: 'The request took too long. Please try again.',
      type: 'timeout',
    };
  }

  // API errors
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: error.message || 'Please check your input and try again.',
          type: 'validation',
        };
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Please log in to continue.',
          type: 'auth',
          action: () => window.location.href = '/login',
        };
      case 403:
        return {
          title: 'Access Denied',
          message: "You don't have permission to perform this action.",
          type: 'forbidden',
        };
      case 404:
        return {
          title: 'Not Found',
          message: 'The requested resource was not found.',
          type: 'not-found',
        };
      case 429:
        return {
          title: 'Too Many Requests',
          message: 'Please wait a moment before trying again.',
          type: 'rate-limit',
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          type: 'server',
        };
      case 503:
        return {
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again later.',
          type: 'unavailable',
        };
      default:
        return {
          title: 'Error',
          message: error.message || 'An unexpected error occurred.',
          type: 'unknown',
        };
    }
  }

  // Generic error
  return {
    title: 'Unexpected Error',
    message: error.message || 'An unexpected error occurred. Please try again.',
    type: 'unknown',
  };
}

export function getUserFriendlyMessage(error) {
  const handled = handleAPIError(error);
  return handled;
}
