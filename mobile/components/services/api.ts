// direccion IP
const BASE_URL = 'http://192.168.1.22:8000';

export interface RegisterData {
    name: string;
    relationship: string;
    image: string;
    extra?: string; // <-- Le decimos que ahora también mandamos características
}

export const api = {
    register: async (data: RegisterData) => {
        try {
            console.log("Enviando datos a:", BASE_URL); // Para ver en la terminal si intenta conectar

            const response = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            // Si el servidor de Python nos batea (error 400, 422, 500)
            if (!response.ok) {
                // Leemos el error como texto puro para que ya no diga [object Object]
                const errText = await response.text();
                console.error("El servidor de Python respondió con error:", errText);
                throw new Error("El servidor rechazó los datos. Revisa la terminal.");
            }

            return await response.json();
        } catch (error) {
            console.error("Fallo la conexión:", error);
            throw error;
        }
    }
};