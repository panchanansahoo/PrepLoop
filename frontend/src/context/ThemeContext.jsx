import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('theme');
        const initialTheme = stored === 'light' ? 'light' : 'dark';
        console.log('[ThemeProvider] Initializing with stored:', stored, 'resolved:', initialTheme);
        return initialTheme;
    });

    useEffect(() => {
        console.log('[ThemeProvider] Setting data-theme to:', theme);
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Verify it was set
        const verifyAttr = document.documentElement.getAttribute('data-theme');
        console.log('[ThemeProvider] Verified data-theme is now:', verifyAttr);
        
        // Check CSS variables
        const styles = getComputedStyle(document.documentElement);
        console.log('[ThemeProvider] CSS vars after toggle:');
        console.log('  --bg-primary:', styles.getPropertyValue('--bg-primary'));
        console.log('  --text-primary:', styles.getPropertyValue('--text-primary'));
    }, [theme]);

    const toggleTheme = () => {
        console.log('[ThemeProvider] Toggle called, current:', theme);
        setTheme(prev => {
            const newTheme = prev === 'dark' ? 'light' : 'dark';
            console.log('[ThemeProvider] Toggle result:', newTheme);
            return newTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
