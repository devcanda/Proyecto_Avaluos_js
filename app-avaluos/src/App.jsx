import { useState } from 'react'
import Dashboard from './components/Dashboard'
import FormularioAvaluo from './components/FormularioAvaluo'

function App() {
  const [sesionIniciada, setSesionIniciada] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('dashboard'); 

  const cerrarSesion = () => { if (window.confirm("¿Deseas cerrar la sesión?")) setSesionIniciada(false); };
  const iniciarSesion = () => setSesionIniciada(true);
  const funcionEnConstruccion = (modulo) => alert(`🚧 El módulo de "${modulo}" se construirá pronto.`);

  if (!sesionIniciada) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="card shadow-lg border-0 rounded-3" style={{ width: '400px' }}>
          <div className="card-header text-center text-white py-4" style={{ backgroundColor: '#1d429a' }}>
            <h4 className="mb-0 fw-bold">Candamil & Asociados</h4>
            <span className="small text-light">Sistema de Gestión de Avalúos</span>
          </div>
          <div className="card-body p-4 text-center">
            <div className="mb-4"><span style={{ fontSize: '4rem' }}>🔐</span></div>
            <h5 className="text-secondary mb-4">Sesión Cerrada</h5>
            <button className="btn w-100 fw-bold py-2 text-white" onClick={iniciarSesion} style={{ backgroundColor: '#1d429a' }}>Volver a Entrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 p-0">
      <style>{`
        .sidebar-link { cursor: pointer; transition: 0.2s; }
        .sidebar-link:hover { background-color: #f8f9fa; }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar navbar-dark shadow-sm" style={{ backgroundColor: '#1d429a' }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand mb-0 h1 fw-bold">Candamil & Asociados - Avalúos 2.0</span>
          <div className="d-flex align-items-center">
            <span className="text-white me-3 fw-medium">👤 Administrador TI</span>
            <button className="btn btn-sm btn-light text-danger fw-bold shadow-sm" onClick={cerrarSesion}>Cerrar Sesión</button>
          </div>
        </div>
      </nav>

      <div className="row g-0">
        {/* SIDEBAR */}
        <div className="col-md-2 bg-white border-end min-vh-100 shadow-sm">
          <div className="list-group list-group-flush mt-3">
            <a className={`list-group-item list-group-item-action ${vistaActiva === 'dashboard' ? 'active fw-bold' : 'text-secondary sidebar-link fw-medium'} border-0 py-3`} 
               style={vistaActiva === 'dashboard' ? { backgroundColor: '#1d429a' } : {}} onClick={() => setVistaActiva('dashboard')}>📊 Dashboard</a>
            <a className={`list-group-item list-group-item-action ${vistaActiva === 'formulario' ? 'active fw-bold' : 'text-secondary sidebar-link fw-medium'} border-0 py-3`} 
               style={vistaActiva === 'formulario' ? { backgroundColor: '#1d429a' } : {}} onClick={() => setVistaActiva('formulario')}>📝 Nuevo Avalúo</a>
            <a className="list-group-item list-group-item-action text-secondary border-0 py-3 sidebar-link fw-medium" onClick={() => funcionEnConstruccion('Listado Histórico')}>📁 Listado Histórico</a>
            <hr className="my-1 mx-3 text-muted" />
            <a className="list-group-item list-group-item-action text-secondary border-0 py-3 sidebar-link fw-medium" onClick={() => funcionEnConstruccion('Configuración')}>⚙️ Configuración</a>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL (Llamado a los componentes) */}
        <div className="col-md-10 p-4">
          {vistaActiva === 'dashboard' && <Dashboard setVistaActiva={setVistaActiva} />}
          {vistaActiva === 'formulario' && <FormularioAvaluo setVistaActiva={setVistaActiva} />}
        </div>
      </div>
    </div>
  )
}

export default App