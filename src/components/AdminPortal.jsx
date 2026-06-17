import React, { useState, useEffect } from 'react';

const AdminPortal = ({ 
  loteoGeojson, 
  adminOverrides, 
  onSaveOverrides, 
  onClose 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Selection and form states
  const [selectedLotId, setSelectedLotId] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('Disponible');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');

  // Get list of lots for the dropdown selection
  const lotsList = loteoGeojson 
    ? loteoGeojson.features.map(feat => ({
        id: feat.properties.fid || feat.properties.OBJECTID || feat.properties.GLOBALID,
        label: feat.properties.ETIQUETA || feat.properties.LOTE || `Lote ${feat.properties.fid}`
      })).sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }))
    : [];

  // Handle password login verification
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple admin password
      setIsAuthenticated(true);
      setLoginError('');
      // Autoselect first lot if available
      if (lotsList.length > 0) {
        setSelectedLotId(lotsList[0].id);
      }
    } else {
      setLoginError('Contraseña incorrecta. Inténtelo de nuevo.');
    }
  };

  // Update form values when selected lot changes
  useEffect(() => {
    if (selectedLotId) {
      const overrides = adminOverrides[selectedLotId] || {};
      setPrice(overrides.price || '');
      setStatus(overrides.status || 'Disponible');
      setTags(overrides.tags || '');
      setDescription(overrides.description || '');
    }
  }, [selectedLotId, adminOverrides]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedLotId) return;

    onSaveOverrides(selectedLotId, {
      price: price ? Number(price) : null,
      status,
      tags,
      description
    });
    
    // Simple feedback toast
    alert(`¡Cambios guardados con éxito para el Lote!`);
  };

  // If not logged in, show login form
  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(3, 7, 4, 0.85)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="glass-panel" style={{
          width: '380px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>
              🔑 Panel de Control
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Acceso exclusivo para el administrador
            </p>
          </div>
          
          <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)' }} />

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Ingrese la contraseña de administrador:
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#ffffff',
                  outline: 'none',
                  fontSize: '1rem'
                }}
                autoFocus
              />
              {loginError && (
                <span style={{ fontSize: '0.85rem', color: '#f87171', display: 'block', marginTop: '6px' }}>
                  ⚠️ {loginError}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '1rem',
                marginTop: '8px'
              }}
            >
              Iniciar Sesión
            </button>
          </form>

          <button 
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              fontSize: '0.9rem'
            }}
          >
            Volver al Mapa
          </button>
        </div>
      </div>
    );
  }

  // If logged in, show editing portal
  return (
    <div className="admin-portal-overlay" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(3, 7, 4, 0.8)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{
        width: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>
              🛠️ Editor de Lotes
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Modifique precios y etiquetas en tiempo real
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            Salir Editor
          </button>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)' }} />

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Lot Selection Dropdown */}
          <div>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              1. Seleccione el Lote a editar:
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none'
              }}
            >
              {lotsList.map(lot => (
                <option key={lot.id} value={lot.id} style={{ backgroundColor: '#070e08' }}>
                  {lot.label} (ID: {lot.id})
                </option>
              ))}
            </select>
          </div>

          {/* Availability Status */}
          <div>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              2. Estado de Disponibilidad:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {['Disponible', 'Reservado', 'Vendido'].map(state => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setStatus(state)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: status === state ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                    backgroundColor: status === state 
                      ? (state === 'Disponible' ? 'var(--primary-dark)' : state === 'Reservado' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(239, 68, 68, 0.4)')
                      : 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  {state === 'Disponible' ? '🟢' : state === 'Reservado' ? '🟠' : '🔴'} {state}
                </button>
              ))}
            </div>
          </div>

          {/* Commercial Value */}
          <div>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              3. Valor Comercial (COP - Solo números):
            </label>
            <input 
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 120000000"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              4. Etiquetas destacadas (Separadas por comas):
            </label>
            <input 
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: Vista al valle, Cerca a portería, Lote plano"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              5. Descripción personalizada:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escriba los detalles y ventajas de este lote..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="glass-panel-interactive"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              marginTop: '10px',
              boxShadow: '0 4px 15px rgba(21, 128, 61, 0.4)'
            }}
          >
            💾 Guardar Modificaciones
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPortal;
