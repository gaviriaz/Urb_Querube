import React, { useState, useMemo } from 'react';
import { extractLotInfo } from '../utils/lotUtils.js';

const SearchStatsPanel = ({ 
  loteoGeojson, 
  adminOverrides, 
  onSelectLot, 
  onNavigateToLot,
  selectedLotId,
  isCollapsed,
  setIsCollapsed
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState('Todos');
  const [navMenuLotId, setNavMenuLotId] = useState(null); // Which lot shows nav menu

  // Extract and process all lots from GeoJSON
  const processedLots = useMemo(() => {
    if (!loteoGeojson || !loteoGeojson.features) return [];

    return loteoGeojson.features
      .filter((feat) => feat.properties?.LOTE !== 'REMANENTE')
      .map((feat) => {
        const info = extractLotInfo(feat);
        const override = adminOverrides[info.id] || {};
        return {
          ...info,
          status: override.status || 'Disponible',
          price: override.price || null,
          _manzana: info.manzana
        };
      })
      .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));
  }, [loteoGeojson, adminOverrides]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedLots.length;
    if (total === 0) return { total: 0, disponible: 0, reservado: 0, vendido: 0, percentSold: 0 };

    let disponible = 0;
    let reservado = 0;
    let vendido = 0;

    processedLots.forEach(lot => {
      if (lot.status === 'Vendido') vendido++;
      else if (lot.status === 'Reservado') reservado++;
      else disponible++;
    });

    const percentSold = Math.round((vendido / total) * 100);
    const percentReserved = Math.round((reservado / total) * 100);

    return {
      total,
      disponible,
      reservado,
      vendido,
      percentSold,
      percentReserved
    };
  }, [processedLots]);

  // Filter lots based on user selection
  const filteredLots = useMemo(() => {
    return processedLots.filter(lot => {
      // 1. Search filter
      const matchesSearch = lot.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            lot.npn.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Status filter
      const matchesStatus = statusFilter === 'Todos' || lot.status === statusFilter;

      // 3. Area filter
      let matchesArea = true;
      if (areaFilter === 'Chicos') {
        matchesArea = lot.area < 150;
      } else if (areaFilter === 'Medianos') {
        matchesArea = lot.area >= 150 && lot.area <= 250;
      } else if (areaFilter === 'Grandes') {
        matchesArea = lot.area > 250;
      }

      return matchesSearch && matchesStatus && matchesArea;
    });
  }, [processedLots, searchTerm, statusFilter, areaFilter]);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="glass-panel glass-panel-interactive animate-float"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 10,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        title="Buscar & Estadísticas"
      >
        🔍
      </button>
    );
  }

  return (
    <div className="search-stats-panel glass-panel animate-float" style={{
      position: 'absolute',
      top: '24px',
      left: '24px',
      zIndex: 10,
      width: '320px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxHeight: 'calc(100vh - 48px)',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-gold)', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📊 Catálogo de Lotes
        </h3>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Colapsar Panel"
        >
          ◀
        </button>
      </div>

      {/* Progress Stats bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>Progreso de Ventas:</span>
          <strong>{stats.vendido} / {stats.total} Vendidos ({stats.percentSold}%)</strong>
        </div>
        
        {/* Visual Stacked Progress Bar */}
        <div style={{
          height: '10px',
          borderRadius: '5px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          display: 'flex',
          overflow: 'hidden',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ width: `${stats.percentSold}%`, backgroundColor: '#22c55e' }} title={`Vendido: ${stats.percentSold}%`} />
          <div style={{ width: `${stats.percentReserved}%`, backgroundColor: '#f97316' }} title={`Reservado: ${stats.percentReserved}%`} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>🟢 Disponibles: {stats.disponible}</span>
          <span>🟠 Reservados: {stats.reservado}</span>
        </div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar por lote o NPN..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter by Status */}
      <div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
          Filtrar por Estado:
        </span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['Todos', 'Disponible', 'Reservado', 'Vendido'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="glass-panel-interactive"
              style={{
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '4px',
                border: statusFilter === st ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: statusFilter === st ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                color: '#ffffff',
                fontWeight: statusFilter === st ? 'bold' : 'normal'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Filter by Area size */}
      <div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
          Filtrar por Área:
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'Todos', label: 'Todos' },
            { id: 'Chicos', label: '< 150m²' },
            { id: 'Medianos', label: '150-250m²' },
            { id: 'Grandes', label: '> 250m²' }
          ].map(ar => (
            <button
              key={ar.id}
              onClick={() => setAreaFilter(ar.id)}
              className="glass-panel-interactive"
              style={{
                flex: 1,
                fontSize: '0.7rem',
                padding: '4px 2px',
                borderRadius: '4px',
                border: areaFilter === ar.id ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: areaFilter === ar.id ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                color: '#ffffff',
                fontWeight: areaFilter === ar.id ? 'bold' : 'normal'
              }}
            >
              {ar.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Resultados: ({filteredLots.length})</span>
        </div>
        
        <div style={{
          maxHeight: '180px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          paddingRight: '4px'
        }}>
          {filteredLots.length > 0 ? (
            filteredLots.map((lot, index) => {
              const statusColors = {
                'Disponible': '#4ade80',
                'Reservado': '#fb923c',
                'Vendido': '#f87171'
              };
              const dotColor = statusColors[lot.status] || '#4ade80';
              const isSelected = lot.id === selectedLotId;
              const showNavMenu = navMenuLotId === lot.id;

              return (
                <div key={`${lot.id}-${lot._manzana || 'na'}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {/* Main lot button */}
                    <button
                      onClick={() => onSelectLot(lot)}
                      className="glass-panel-interactive"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.05)',
                        backgroundColor: isSelected ? 'rgba(234,179,8,0.1)' : 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: dotColor, display: 'inline-block'
                        }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{lot.label}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7 }}>{lot._manzana || ''}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {Math.round(lot.area)} m²
                      </span>
                    </button>
                    {/* Navigate button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setNavMenuLotId(showNavMenu ? null : lot.id); }}
                      title="Navegar al lote"
                      style={{
                        width: '32px', minWidth: '32px',
                        borderRadius: '6px',
                        border: '1px solid rgba(56,189,248,0.2)',
                        backgroundColor: showNavMenu ? 'rgba(56,189,248,0.15)' : 'rgba(0,0,0,0.2)',
                        color: '#7dd3fc',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🚗
                    </button>
                  </div>
                  {/* Vehicle selection dropdown */}
                  {showNavMenu && (
                    <div style={{
                      display: 'flex', gap: '4px', padding: '4px 0 2px 16px',
                      animation: 'slide-in 0.2s ease'
                    }}>
                      {[{ key: 'person', emoji: '🚶', label: 'Caminar' }, { key: 'moto', emoji: '🏍️', label: 'Moto' }, { key: 'car', emoji: '🚗', label: 'Carro' }].map(v => (
                        <button
                          key={v.key}
                          onClick={() => { onNavigateToLot(lot, v.key); setNavMenuLotId(null); }}
                          style={{
                            flex: 1, padding: '4px 2px', borderRadius: '4px',
                            border: '1px solid rgba(56,189,248,0.15)',
                            backgroundColor: 'rgba(56,189,248,0.06)',
                            color: '#bae6fd', fontSize: '0.7rem',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '3px'
                          }}
                        >
                          {v.emoji} {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No se encontraron lotes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchStatsPanel;
