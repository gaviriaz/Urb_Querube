import { useEffect, useState, useRef } from 'react';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [nuevaReserva, setNuevaReserva] = useState(null);
  const [loteEstadoActualizado, setLoteEstadoActualizado] = useState(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let ws = null;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // resolves e.g. localhost:5173 or querube.com
      const wsUrl = `${protocol}//${host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        console.log('WebSocket conectado a Querube Sync Engine');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.event === 'nuevaReserva') {
            setNuevaReserva(message.data);
          }
          
          if (message.event === 'loteEstadoActualizado') {
            setLoteEstadoActualizado(message.data);
          }
        } catch (err) {
          console.error('Error al decodificar mensaje WebSocket:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket desconectado. Intentando reconectar en 3 segundos...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop on component unmount
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connected,
    nuevaReserva,
    loteEstadoActualizado
  };
}
