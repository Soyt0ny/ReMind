// mobile/services/api.ts

// IMPORTANTE: Cambia "192.168.1.XX" por la IP real de tu computadora
const BASE_URL = 'http://192.168.1.23:8000';

export interface RegisterData {
    name: string;
    relationship: string;
    image: string;
}

export const api = {
    // Función para registrar una nueva persona
    register: async (data: RegisterData) => {
        try {
            const response = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: {
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Error al registrar a la persona');
            }

            return await response.json();
        } catch (error) {
            console.error("Error en api.register:", error);
            throw error;
        }
    }
};