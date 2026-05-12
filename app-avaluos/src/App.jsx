import { useState, useEffect } from 'react'

function App() {
  const [kpis, setKpis] = useState({ pendientes: 0, enProceso: 0, atrasados: 0 });
  const [avaluos, setAvaluos] = useState([]);

  useEffect(() => {
    // Cargar indicadores de las tarjetas
    fetch('http://localhost:3000/api/dashboard')
      .then(res => res.json())
      .then(data => setKpis(data))
      .catch(err => console.error("Error en dashboard:", err));

    // Cargar registros para la tabla
    fetch('http://localhost:3000/api/avaluos')
      .then(res => res.json())
      .then(data => setAvaluos(data))
      .catch(err => console.error("Error en tabla:", err));
  }, []);

  return (
    <div className="container-fluid bg-light min-vh-100 p-0">
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

          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0 border-start border-info border-4">
                <div className="card-body">
                  <h6 className="text-muted text-uppercase mb-2">Pendientes</h6>
                  <h2 className="fw-bold text-info">{kpis.pendientes}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm border-0 border-start border-warning border-4">
                <div className="card-body">
                  <h6 className="text-muted text-uppercase mb-2">En Proceso</h6>
                  <h2 className="fw-bold text-warning">{kpis.enProceso}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm border-0 border-start border-danger border-4">
                <div className="card-body">
                  <h6 className="text-muted text-uppercase mb-2">Atrasados</h6>
                  <h2 className="fw-bold text-danger">{kpis.atrasados}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold text-secondary">Monitoreo de Radicados Reales</h5>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0 text-center">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Registro</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {avaluos.map((av) => (
                    <tr key={av.id}>
                      <td className="fw-bold text-primary">#{av.id}</td>
                      <td>{new Date(av.fechaRegistro).toLocaleDateString()}</td>
                      <td>{av.fecha_limite_entrega ? new Date(av.fecha_limite_entrega).toLocaleDateString() : 'Sin definir'}</td>
                      <td>
                        <span className={`badge ${av.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}`}>
                          {av.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App