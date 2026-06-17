import { API_BASE_URL } from '../utils/config';

export async function getLotes() {
  const response = await fetch(`${API_BASE_URL}/lote`);
  if (!response.ok) {
    throw new Error('Error al obtener lotes');
  }
  return response.json();
}

export async function updateLoteEstado(loteId, estado) {
  const token = sessionStorage.getItem('admin_token') || localStorage.getItem('jwt_token');
  
  const response = await fetch(`${API_BASE_URL}/lote/${loteId}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ estado })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al actualizar estado del lote');
  }
  return response.json();
}

export async function crearReserva(reservaData) {
  const response = await fetch(`${API_BASE_URL}/reserva`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reservaData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al registrar la reserva');
  }
  return response.json();
}
