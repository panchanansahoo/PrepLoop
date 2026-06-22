import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';

// Custom render that wraps components with required providers
export const renderWithProviders = (ui, options) => {
    return render(
        <MantineProvider>
            <BrowserRouter
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                {ui}
            </BrowserRouter>
        </MantineProvider>,
        options
    );
};

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { renderWithProviders as render };
