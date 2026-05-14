import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

export const renderWithRouter = (component, options = {}) => {
  return render(
    <BrowserRouter>{component}</BrowserRouter>,
    options
  );
};

export const mockApiResponse = (data, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data }), delay);
  });
};

export const mockApiError = (error, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delay);
  });
};

export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
