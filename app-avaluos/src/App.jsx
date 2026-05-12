import { useState, useEffect } from 'react'

function App() {
  const [kpis, setKpis] = useState({ pendientes: 0, enProceso: 0, atrasados: 0 });
  const [avaluos, setAvaluos] = useState([]);
  
  // ESTADOS PARA UI
  const [busqueda, setBusqueda] = useState("");
  const [fechaVisitaFiltro, setFechaVisitaFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // NUEVO ESTADO: Filtro por Tarjetas KPI
  const [filtroKpi, setFiltroKpi] = useState(null); // Puede ser 'Pendientes', 'En Proceso', 'Atrasados'

  // ESTADOS PARA EL MODAL
  const [mostrarModal, setMostrarModal] = useState(false);
  const [avaluoEdit, setAvaluoEdit] = useState(null);
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState("");

  const hoy = new Date().toISOString().split('T')[0];

  const cargarDatos = () => {
    fetch('http://localhost:3000/api/dashboard')
      .then(res => res.json())
      .then(data => setKpis(data))
      .catch(err => console.error(err));

    fetch('http://localhost:3000/api/avaluos')
      .then(res => res.json())
      .then(data => setAvaluos(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // FUNCION PARA ACTIVAR/DESACTIVAR EL FILTRO DE LAS TARJETAS
  const toggleFiltroKpi = (tipo) => {
    if (filtroKpi === tipo) {
      setFiltroKpi(null); // Si ya estaba oprimido, lo suelta
    } else {
      setFiltroKpi(tipo); // Si no, lo oprime y aplica el filtro
      setPaginaActual(1);
    }
  };

  // FUNCION PARA CALCULAR EL ESTADO INTELIGENTE DE LA COLUMNA
  const obtenerEstadoSLA = (fecha_limite) => {
    if (!fecha_limite) return { texto: 'Pendiente', color: 'bg-info text-dark' };
    const fecha = fecha_limite.substring(0, 10);
    if (fecha < hoy) return { texto: 'Atrasado', color: 'bg-danger' };
    return { texto: 'En Proceso', color: 'bg-warning text-dark' };
  };

  // LÓGICA DE FILTRADO (Ahora incluye el filtro de los KPIs)
  const avaluosFiltrados = avaluos.filter((av) => {
    // 1. Filtro de Texto
    const termino = busqueda.toLowerCase();
    const coincideTexto = 
      av.id.toString().includes(termino) ||
      (av.solicitante && av.solicitante.toLowerCase().includes(termino)) ||
      (av.documento && av.documento.toString().includes(termino));

    // 2. Filtro de Fecha Visita
    let coincideFecha = true;
    if (fechaVisitaFiltro && av.fecha_vis_formato) {
        coincideFecha = av.fecha_vis_formato === fechaVisitaFiltro;
    } else if (fechaVisitaFiltro && !av.fecha_vis_formato) {
        coincideFecha = false;
    }

    // 3. NUEVO: Filtro de Tarjetas KPI
    let coincideKpi = true;
    if (filtroKpi === 'Pendientes') {
      coincideKpi = !av.fecha_limite_entrega;
    } else if (filtroKpi === 'Atrasados') {
      coincideKpi = av.fecha_limite_entrega && av.fecha_limite_entrega.substring(0, 10) < hoy;
    } else if (filtroKpi === 'En Proceso') {
      coincideKpi = av.fecha_limite_entrega && av.fecha_limite_entrega.substring(0, 10) >= hoy;
    }

    return coincideTexto && coincideFecha && coincideKpi;
  });

  const indiceUltimo = paginaActual * registrosPorPagina;
  const indicePrimer = indiceUltimo - registrosPorPagina;
  const registrosPaginados = avaluosFiltrados.slice(indicePrimer, indiceUltimo);
  const totalPaginas = Math.ceil(avaluosFiltrados.length / registrosPorPagina);

  const abrirModalTiempos = (avaluo) => {
    setAvaluoEdit(avaluo);
    setNuevaFechaLimite(avaluo.fecha_limite_entrega ? avaluo.fecha_limite_entrega.substring(0, 10) : "");
    setMostrarModal(true);
  };

  const guardarFecha = async () => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/avaluos/${avaluoEdit.id}/tiempo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_limite: nuevaFechaLimite })
      });

      if (respuesta.ok) {
        setMostrarModal(false);
        cargarDatos();
      } else {
        alert("Hubo un problema al guardar. Intenta de nuevo.");
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 p-0">
      
      <style>{`
        /* ESTILOS DE BOTONES DE ACCIÓN */
        .btn-editar-custom { background-color: #0d6efd; color: white; border: 1px solid #0d6efd; transition: all 0.3s ease; }
        .btn-editar-custom:hover { background-color: white; color: #0d6efd; }
        .btn-tiempo-custom { background-color: #ffc107; color: #000; border: 1px solid #ffc107; transition: all 0.3s ease; }
        .btn-tiempo-custom:hover { background-color: white; color: #ffc107; }
        .btn-pdf-custom { background-color: #dc3545; color: white; border: 1px solid #dc3545; transition: all 0.3s ease; }
        .btn-pdf-custom:hover { background-color: white; color: black; border: 1px solid #dc3545; }
        .btn-nuevo-custom { background-color: #1d429a; color: white; border: 1px solid #1d429a; font-weight: bold; }
        .btn-nuevo-custom:hover { background-color: #153275; color: white; }

        /* NUEVOS ESTILOS INTERACTIVOS PARA LAS TARJETAS KPI */
        .card-kpi {
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .card-kpi:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
        }
        .card-kpi.kpi-pressed {
          transform: scale(0.96);
          box-shadow: inset 0 4px 6px rgba(0,0,0,0.15) !important;
          opacity: 0.95;
        }
        .kpi-pressed.border-info { background-color: #eaf8fc !important; border-left-width: 8px !important; }
        .kpi-pressed.border-warning { background-color: #fff9e6 !important; border-left-width: 8px !important; }
        .kpi-pressed.border-danger { background-color: #fceeee !important; border-left-width: 8px !important; }
      `}</style>

      <nav className="navbar navbar-dark shadow-sm" style={{ backgroundColor: '#1d429a' }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand mb-0 h1 fw-bold">Candamil & Asociados - Avalúos 2.0</span>
        </div>
      </nav>

      <div className="row g-0">
        <div className="col-md-2 bg-white border-end min-vh-100 shadow-sm">
          <div className="list-group list-group-flush mt-3">
            <a href="#" className="list-group-item list-group-item-action active border-0 py-3" style={{ backgroundColor: '#1d429a' }}>Dashboard</a>
            <a href="#" className="list-group-item list-group-item-action text-secondary border-0 py-3">Listado Histórico</a>
          </div>
        </div>

        <div className="col-md-10 p-4">
          <h3 className="mb-4 fw-bold text-secondary">Control de Tiempos</h3>

          {/* TARJETAS KPI (AHORA CON EVENTO onClick Y CLASES DINÁMICAS) */}
          <div className="row mb-4">
            <div className="col-md-4 mb-2">
              <div 
                className={`card shadow-sm border-0 border-start border-info border-4 card-kpi ${filtroKpi === 'Pendientes' ? 'kpi-pressed' : ''}`}
                onClick={() => toggleFiltroKpi('Pendientes')}
              >
                <div className="card-body">
                  <h6 className="text-muted text-uppercase mb-2">Pendientes</h6>
                  <h2 className="fw-bold text-info">{kpis.pendientes}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div 
                className={`card shadow-sm border-0 border-start border-warning border-4 card-kpi ${filtroKpi === 'En Proceso' ? 'kpi-pressed' : ''}`}
                onClick={() => toggleFiltroKpi('En Proceso')}
              >
                <div className="card-body">
                  <h6 className="text-muted text-uppercase mb-2">En Proceso</h6>
                  <h2 className="fw-bold text-warning">{kpis.enProceso}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div 
                className={`card shadow-sm border-0 border-start border-danger border-4 card-kpi ${filtroKpi === 'Atrasados' ? 'kpi-pressed' : ''}`}
                onClick={() => toggleFiltroKpi('Atrasados')}
              >
                <div className="card-body">
                  <h6 className="text-muted text-uppercase mb-2">Atrasados</h6>
                  <h2 className="fw-bold text-danger">{kpis.atrasados}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
              <h5 className="mb-0 fw-bold text-secondary">
                Monitoreo de Radicados
                {filtroKpi && <span className="badge bg-secondary ms-2 small">Filtro: {filtroKpi}</span>}
              </h5>
              
              <div className="d-flex flex-grow-1 justify-content-center gap-2">
                <div className="input-group input-group-sm" style={{ maxWidth: '220px' }}>
                  <span className="input-group-text bg-light border-primary fw-bold">📅 F. Visita</span>
                  <input 
                    type="date" 
                    className="form-control border-primary" 
                    value={fechaVisitaFiltro}
                    onChange={(e) => { setFechaVisitaFiltro(e.target.value); setPaginaActual(1); }}
                  />
                  {fechaVisitaFiltro && <button className="btn btn-outline-danger" onClick={() => setFechaVisitaFiltro("")}>✖</button>}
                </div>

                <div style={{ width: '250px' }}>
                  <input 
                    type="text" 
                    className="form-control form-control-sm border-primary" 
                    placeholder="🔍 Buscar ID, Nombre o Doc..." 
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                  />
                </div>
              </div>

              <button className="btn btn-sm btn-nuevo-custom shadow-sm px-3">+ Nuevo Avalúo</button>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 text-center align-middle" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Solicitante</th>
                      <th># Documento</th>
                      <th>T. Avalúo</th>
                      <th>F. Visita</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosPaginados.length > 0 ? (
                      registrosPaginados.map((av) => {
                        // AQUÍ REEMPLAZAMOS EL "ACTIVO" ESTÁTICO POR LA LÓGICA INTELIGENTE
                        const estadoSLA = obtenerEstadoSLA(av.fecha_limite_entrega);

                        return (
                          <tr key={av.id}>
                            <td className="fw-bold text-primary">#{av.id}</td>
                            <td className="text-truncate" style={{ maxWidth: '160px' }}>{av.solicitante}</td>
                            <td>{av.documento}</td>
                            <td><span className="badge bg-light text-dark border">{av.tipo_avaluo}</span></td>
                            <td>{av.fecha_visita ? new Date(av.fecha_visita).toLocaleDateString() : '-'}</td>
                            <td>
                              {av.fecha_limite_entrega ? 
                                <span className={`fw-bold ${new Date(av.fecha_limite_entrega) < new Date(hoy) ? 'text-danger' : 'text-success'}`}>
                                  {new Date(av.fecha_limite_entrega).toLocaleDateString()}
                                </span> 
                                : <span className="text-muted fst-italic">Sin definir</span>}
                            </td>
                            <td>
                              {/* NUEVA ETIQUETA DE ESTADO DINÁMICA */}
                              <span className={`badge ${estadoSLA.color}`}>{estadoSLA.texto}</span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-editar-custom me-1" title="Editar Información">✏️</button>
                              <button className="btn btn-sm btn-tiempo-custom me-1" onClick={() => abrirModalTiempos(av)} title="Asignar Vencimiento">⏲️</button>
                              <button className="btn btn-sm btn-pdf-custom fw-bold">PDF</button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="8" className="py-4 text-muted">No hay resultados para este filtro...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
              <span className="text-muted small">Mostrando {indicePrimer + 1} a {Math.min(indiceUltimo, avaluosFiltrados.length)} de {avaluosFiltrados.length} registros</span>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button>
                </li>
                <li className={`page-item ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#ffc107' }}>
                <h5 className="modal-title fw-bold text-dark">⏲️ Asignar Plazo de Entrega - #{avaluoEdit?.id}</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <label className="form-label fw-bold text-secondary">Fecha Límite de Entrega</label>
                <input 
                  type="date" 
                  className="form-control form-control-lg border-warning" 
                  value={nuevaFechaLimite}
                  onChange={(e) => setNuevaFechaLimite(e.target.value)}
                />
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-warning fw-bold" onClick={guardarFecha}>Guardar Plazo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App