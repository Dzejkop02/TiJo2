const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    console.warn(
        'Zmienna VITE_API_BASE_URL nie jest ustawiona w .env. Używam domyślnej wartości.'
    );
}

export const API_URL = API_BASE_URL || 'http://localhost:3001/api';
