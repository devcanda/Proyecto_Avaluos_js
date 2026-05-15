import { useState } from 'react'
import Dashboard from './components/Dashboard'
import FormularioAvaluo from './components/FormularioAvaluo'

function App() {
  const [sesionIniciada, setSesionIniciada] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('dashboard'); 
  // ESTADO CLAVE: Guarda el ID del avalúo a editar
  const [idEdicion, setIdEdicion] = useState(null);

  const cerrarSesion = () => { if (window.confirm("¿Deseas cerrar la sesión?")) setSesionIniciada(false); };
  const iniciarSesion = () => setSesionIniciada(true);

  // Función para abrir el formulario en modo edición
  const manejarEditar = (id) => {
    setIdEdicion(id);
    setVistaActiva('formulario');
  };

  // Función para abrir el formulario en modo nuevo (limpio)
  const manejarNuevo = () => {
    setIdEdicion(null);
    setVistaActiva('formulario');
  };

  if (!sesionIniciada) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="card shadow-lg border-0 rounded-3" style={{ width: '400px' }}>
          <div className="card-header text-center text-white py-4" style={{ backgroundColor: '#1d429a' }}>
            <h4 className="mb-0 fw-bold">Candamil & Asociados</h4>
          </div>
          <div className="card-body p-4 text-center">
            <button className="btn w-100 fw-bold py-2 text-white" onClick={iniciarSesion} style={{ backgroundColor: '#1d429a' }}>Entrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 p-0">
      <nav className="navbar navbar-dark shadow-sm" style={{ backgroundColor: '#1d429a' }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand mb-0 h1 fw-bold">Candamil & Asociados - Avalúos 2.0</span>
          <button className="btn btn-sm btn-light text-danger fw-bold shadow-sm" onClick={cerrarSesion}>Cerrar Sesión</button>
        </div>
      </nav>

      <div className="row g-0">
        <div className="col-md-2 bg-white border-end min-vh-100 shadow-sm">
          <div className="list-group list-group-flush mt-3">
            <a className={`list-group-item list-group-item-action ${vistaActiva === 'dashboard' ? 'active' : ''}`} 
               onClick={() => setVistaActiva('dashboard')} style={{cursor:'pointer'}}>📊 Dashboard</a>
            <a className={`list-group-item list-group-item-action ${vistaActiva === 'formulario' ? 'active' : ''}`} 
               onClick={manejarNuevo} style={{cursor:'pointer'}}>📝 Nuevo Avalúo</a>
          </div>
        </div>

        <div className="col-md-10 p-4">
          {vistaActiva === 'dashboard' && (
            <Dashboard 
              setVistaActiva={setVistaActiva} 
              onEditar={manejarEditar}
              onNuevo={manejarNuevo} // <-- PASAMOS LA FUNCIÓN AL DASHBOARD
            />
          )}
          {vistaActiva === 'formulario' && (
            <FormularioAvaluo 
              setVistaActiva={setVistaActiva} 
              idEdicion={idEdicion} // <-- PASAMOS EL ID AL FORMULARIO
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App