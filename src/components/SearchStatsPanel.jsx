import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Navigation, ChevronLeft, ChevronRight, TrendingUp, User, Car, Bike, Award } from 'lucide-react';
import { extractLotInfo } from '../utils/lotUtils.js';

/* ─ Spring config ─────────────────────────────────────────────── */
const PANEL_SPRING = { type: 'spring', stiffness: 340, damping: 34 };
const ITEM_SPRING  = { type: 'spring', stiffness: 400, damping: 40 };

/* ─ Status helpers ────────────────────────────────────────────── */
const STATUS_META = {
  Disponible: { color: '#3ecf8e', cls: 'status-available', dot: '#3ecf8e' },
  Reservado:  { color: '#f59e0b', cls: 'status-reserved',  dot: '#f59e0b' },
  Vendido:    { color: '#f26b6b', cls: 'status-sold',       dot: '#f26b6b' },
};
const getStatus = (s) => STATUS_META[s] || STATUS_META.Disponible;

/* ─ Main Component ────────────────────────────────────────────── */
const SearchStatsPanel = ({
  loteoGeojson, adminOverrides, onSelectLot,
  onNavigateToLot, selectedLotId, isCollapsed, setIsCollapsed,
}) => {
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [areaFilter,   setAreaFilter]   = useState('Todos');
  const [navMenuLotId, setNavMenuLotId] = useState(null);
  const searchRef = useRef(null);

  /* Process lots */
  const processedLots = useMemo(() => {
    if (!loteoGeojson?.features) return [];
    return loteoGeojson.features
      .filter(f => f.properties?.LOTE !== 'REMANENTE')
      .map(f => {
        const info     = extractLotInfo(f);
        const override = adminOverrides[info.id] || {};
        return { ...info, status: override.status || 'Disponible', price: override.price || null, _manzana: info.manzana };
      })
      .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));
  }, [loteoGeojson, adminOverrides]);

  /* Stats */
  const stats = useMemo(() => {
    const total      = processedLots.length;
    if (total === 0) return { total: 0, disponible: 0, reservado: 0, vendido: 0, pctSold: 0, pctReserved: 0 };
    let disponible = 0, reservado = 0, vendido = 0;
    processedLots.forEach(l => {
      if (l.status === 'Vendido')    vendido++;
      else if (l.status === 'Reservado') reservado++;
      else disponible++;
    });
    return {
      total, disponible, reservado, vendido,
      pctSold:     Math.round((vendido    / total) * 100),
      pctReserved: Math.round((reservado  / total) * 100),
      pctAvail:    Math.round((disponible / total) * 100),
    };
  }, [processedLots]);

  /* Filtered list */
  const filteredLots = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return processedLots.filter(lot => {
      const matchSearch = !q || lot.label.toLowerCase().includes(q) || lot.npn.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'Todos' || lot.status === statusFilter;
      let matchArea = true;
      if      (areaFilter === 'Pequeño')  matchArea = lot.area < 130;
      else if (areaFilter === 'Mediano')  matchArea = lot.area >= 130 && lot.area <= 200;
      else if (areaFilter === 'Grande')   matchArea = lot.area > 200;
      return matchSearch && matchStatus && matchArea;
    });
  }, [processedLots, searchTerm, statusFilter, areaFilter]);

  const handleSelect = useCallback((lot) => {
    onSelectLot(lot);
    setNavMenuLotId(null);
  }, [onSelectLot]);

  // Keyboard navigation through lots
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (filteredLots.length === 0) return;
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const firstLot = filteredLots[0];
          if (firstLot) {
            handleSelect(firstLot);
          }
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = filteredLots.findIndex(l => l.id === selectedLotId);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % filteredLots.length;
        handleSelect(filteredLots[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredLots.findIndex(l => l.id === selectedLotId);
        const prevIndex = currentIndex === -1 ? filteredLots.length - 1 : (currentIndex - 1 + filteredLots.length) % filteredLots.length;
        handleSelect(filteredLots[prevIndex]);
      } else if (e.key === 'Enter') {
        const selected = filteredLots.find(l => l.id === selectedLotId);
        if (selected) {
          e.preventDefault();
          onSelectLot(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredLots, selectedLotId, handleSelect, onSelectLot]);

  /* ─ Collapsed trigger ─ */
  if (isCollapsed) {
    return (
      <motion.button
        key="catalog-fab"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -60, opacity: 0 }}
        transition={PANEL_SPRING}
        onClick={() => setIsCollapsed(false)}
        className="fab"
        style={{ position: 'absolute', top: '50%', left: 16, zIndex: 20, transform: 'translateY(-50%)' }}
        title="Abrir Catálogo"
      >
        <ChevronRight size={20} />
      </motion.button>
    );
  }

  return (
    <motion.div
      key="catalog-panel"
      className="catalog-panel"
      initial={{ x: -340, opacity: 0 }}
      animate={{ x: 0,    opacity: 1 }}
      exit={{    x: -340, opacity: 0 }}
      transition={PANEL_SPRING}
    >
      {/* Collapse tab */}
      <button className="catalog-toggle-btn" onClick={() => setIsCollapsed(true)} title="Cerrar">
        <ChevronLeft size={18} />
      </button>

      {/* ── Header ── */}
      <div className="catalog-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'linear-gradient(135deg, var(--gold-400), var(--gold-600))',
            display: 'flex', alignItems: 'center', justifycontent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15,
            color: 'var(--text-100)',
          }}>Q</div>
          <div>
            <div className="catalog-title" style={{ fontSize: '1.15rem' }}>Querube</div>
            <div className="catalog-subtitle" style={{ fontSize: '0.62rem' }}>Visualizador Catastral 3D</div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="catalog-stats">
        {[
          { n: stats.total,      l: 'Lotes',      c: 'var(--text-100)' },
          { n: stats.disponible, l: 'Libres', c: 'var(--status-available)' },
          { n: stats.vendido + stats.reservado, l: 'Reservados', c: 'var(--status-reserved)' },
        ].map(({ n, l, c }) => (
          <div key={l} className="stat-cell">
            <span className="stat-number" style={{ color: c }}>{n}</span>
            <span className="stat-label">{l}</span>
          </div>
        ))}
      </div>

      {/* ── Progress ── */}
      <div className="catalog-progress-bar">
        <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <TrendingUp size={11} style={{ display: 'inline', marginRight: 4 }} />
            Progreso de Ventas
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-300)' }}>
            {stats.vendido}/{stats.total}
          </span>
        </div>
        <div className="catalog-progress-track">
          <motion.div
            className="catalog-progress-fill"
            style={{ background: 'var(--status-sold)' }}
            initial={{ width: 0 }}
            animate={{ width: `${stats.pctSold}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <motion.div
            className="catalog-progress-fill"
            style={{ background: 'var(--status-reserved)' }}
            initial={{ width: 0 }}
            animate={{ width: `${stats.pctReserved}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.62rem', color: 'var(--text-400)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-sold)', display: 'inline-block' }} />
            Vendidos {stats.pctSold}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-reserved)', display: 'inline-block' }} />
            Reservados {stats.pctReserved}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-available)', display: 'inline-block' }} />
            Libres {stats.pctAvail}%
          </span>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="catalog-search-area">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            ref={searchRef}
            type="text"
            className="search-input"
            placeholder="Buscar lote, NPN…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="search-clear" onClick={() => setSearchTerm('')}
              >
                <X size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Status filters */}
        <div className="filter-row">
          {['Todos','Disponible','Reservado','Vendido'].map(s => (
            <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>

        {/* Area filters */}
        <div className="filter-row">
          {[
            { id: 'Todos', lbl: 'Todos' },
            { id: 'Pequeño', lbl: '< 130m²' },
            { id: 'Mediano', lbl: '130–200m²' },
            { id: 'Grande',  lbl: '> 200m²' },
          ].map(({ id, lbl }) => (
            <button key={id} className={`filter-btn ${areaFilter === id ? 'active' : ''}`}
              onClick={() => setAreaFilter(id)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* ── Lot list ── */}
      <div className="lot-list custom-scrollbar">
        <div style={{ fontSize: '0.62rem', color: 'var(--text-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 2 }}>
          {filteredLots.length} lotes · {statusFilter !== 'Todos' ? statusFilter : 'Todos los estados'}
        </div>

        <AnimatePresence initial={false}>
          {filteredLots.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-400)', fontSize: '0.82rem' }}
            >
              No se encontraron lotes para este criterio
            </motion.div>
          ) : (
            filteredLots.map((lot, idx) => {
              const meta      = getStatus(lot.status);
              const isSelected = lot.id === selectedLotId;
              const showNav    = navMenuLotId === lot.id;

              return (
                <motion.div
                  key={lot.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ ...ITEM_SPRING, delay: Math.min(idx * 0.025, 0.3) }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <div style={{ display: 'flex', gap: 5 }}>
                    {/* Main lot card */}
                    <div
                      className={`lot-card ${isSelected ? 'selected' : ''}`}
                      style={{ flex: 1 }}
                      onClick={() => handleSelect(lot)}
                      role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleSelect(lot)}
                    >
                      <span className="lot-status-dot" style={{ color: meta.dot, backgroundColor: meta.dot }} />
                      <div className="lot-card-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="lot-card-name">{lot.label}</span>
                          {lot.area > 200 && (
                            <span className="featured-badge" style={{
                              fontSize: '0.55rem', fontWeight: 700,
                              color: 'var(--gold-300)', background: 'rgba(2, 132, 199, 0.12)',
                              border: '1px solid rgba(2, 132, 199, 0.25)',
                              padding: '1px 4px', borderRadius: 3, display: 'inline-flex', alignItems: 'center', gap: 2
                            }}>
                              <Award size={8} /> Especial
                            </span>
                          )}
                        </div>
                        <div className="lot-card-sub">{lot._manzana || 'Sin Manzana'}</div>
                      </div>
                      <div className="lot-card-area" style={{ fontFamily: 'var(--font-body)' }}>{Math.round(lot.area)} m²</div>
                    </div>
                    {/* Navigate button */}
                    <button
                      className="lot-nav-btn"
                      title="Simular recorrido"
                      onClick={e => { e.stopPropagation(); setNavMenuLotId(showNav ? null : lot.id); }}
                    >
                      <Navigation size={14} />
                    </button>
                  </div>

                  {/* Vehicle picker */}
                  <AnimatePresence>
                    {showNav && (
                      <motion.div
                        className="vehicle-menu"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        {[
                          { key: 'person', icon: <User size={12} />, lbl: 'Caminar' },
                          { key: 'moto',   icon: <Bike size={12} />, lbl: 'Moto'    },
                          { key: 'car',    icon: <Car size={12} />, lbl: 'Vehículo' },
                        ].map(v => (
                          <button key={v.key} className="vehicle-btn"
                            onClick={() => { onNavigateToLot(lot, v.key); setNavMenuLotId(null); }}>
                            {v.icon}
                            <span>{v.lbl}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SearchStatsPanel;
