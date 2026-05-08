function App() {
  return (
    <div className="bg-light min-vh-100">
      {/* Barra de Navegación Superior */}
      <nav className="navbar navbar-dark bg-primary shadow-sm mb-4">
        <div className="container">
          <span className="navbar-brand mb-0 h1 fw-bold text-white">
            Candamil & Asociados - Avalúos 2.0
          </span>
        </div>
      </nav>

      {/* Contenedor Principal */}
      <div className="container">
        <h2 className="mb-4" style={{ color: '#1d429a' }}>Dashboard Principal</h2>
        
        {/* Fila de Tarjetas (KPIs) */}
        <div className="row">
          
          {/* Tarjeta 1 */}
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-0 border-start border-primary border-4">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-2">Total Avalúos</h6>
                <h2 className="mb-0 fw-bold" style={{ color: '#1d429a' }}>0</h2>
              </div>
            </div>
          </div>

          {/* Tarjeta 2 */}
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-0 border-start border-success border-4">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-2">Avalúos Este Mes</h6>
                <h2 className="mb-0 fw-bold text-success">0</h2>
              </div>
            </div>
          </div>

          {/* Tarjeta 3 */}
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-0 border-start border-warning border-4">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-2">Último Registro</h6>
                <h5 className="mb-0 fw-bold text-warning mt-2">Ninguno</h5>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App