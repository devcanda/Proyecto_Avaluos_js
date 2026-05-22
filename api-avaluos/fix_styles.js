const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// seccion_sector
code = code.replace(
    /<table style="width: 100%; border:none; margin-bottom:15px; font-size: 8px;">[\s\S]*?Comentarios de la estructura[\s\S]*?<\/table>/,
    `<table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                                <div class="corp-title"><span class="corp-bullet"></span>Sector</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0; width:45%;">Demanda/Interés</td><td>\${datos.DemandaInteres || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Uso predominante</td><td>\${datos.UsoPredominante || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Legalidad</td><td>\${datos.Legalidad || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Transporte</td><td>\${datos.Transporte || ''}</td></tr>
                                </table>
                                
                                <div class="corp-subtitle" style="margin-top: 10px;">Impacto ambiental negativo</div>
                                <div style="margin-bottom: 8px; font-size: 11px; color:#2d56a0; display: flex; align-items: center; gap: 4px;">
                                    <span style="display:inline-block;">\${datos.Aire ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Aire</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.AguasServidas ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Aguas Servidas</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.Basura ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Basura</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.Inseguridad ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Inseguridad</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.Ruido ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Ruido</span>
                                </div>
                                <div class="corp-subtitle">Observaciones</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-top:2px;">\${datos.SectorObservaciones || 'No se evidencia ningún impacto ambiental negativo, excepto por la polución vehicular.'}</p>
                                
                                <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Equipamiento</div>
                                <table class="comparables-table">
                                    <tr>
                                        <th>EQUIPAMIENTO</th>
                                        <th>NIVEL DE EQUIPAMIENTO</th>
                                        <th>DISTANCIA APROX EN METROS</th>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Áreas Verdes</td>
                                        <td>\${datos.AreasVerdesNE || ''}</td>
                                        <td>\${datos.AreasVerdesDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Asistencial</td>
                                        <td>\${datos.AsistencialNE || ''}</td>
                                        <td>\${datos.AsistencialDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Comercial</td>
                                        <td>\${datos.ComercialNE || ''}</td>
                                        <td>\${datos.ComercialDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Escolar</td>
                                        <td>\${datos.EscolarNE || ''}</td>
                                        <td>\${datos.EscolarDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Estacionamientos</td>
                                        <td>\${datos.EstacionamientosNE || ''}</td>
                                        <td>\${datos.EstacionamientosDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Áreas recreativas</td>
                                        <td>\${datos.AreasRecreativasNE || ''}</td>
                                        <td>\${datos.AreasRecreativasDAM || ''}</td>
                                    </tr>
                                </table>

                                <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Infraestructura urbana del sector</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Vías de acceso</td><td>\${datos.ViasDeAcceso || ''}</td><td style="color:#2d56a0;">Pavimentadas</td><td>\${datos.Pavimentadas || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Andenes</td><td>\${datos.Andenes || ''}</td><td style="color:#2d56a0;">Sardineles</td><td>\${datos.Sardineles || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Acueducto</td><td>\${datos.Acueducto || ''}</td><td style="color:#2d56a0;">Alcantarillado</td><td>\${datos.Alcantarillado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Energía eléctrica</td><td>\${datos.EnergiaElectrica || ''}</td><td style="color:#2d56a0;">Telefonía</td><td>\${datos.Telefonia || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Gas natural</td><td colspan="3">\${datos.GasNatural || ''}</td></tr>
                                </table>

                                <div class="corp-subtitle">Amoblamiento urbano</div>
                                <div style="margin-bottom: 8px; font-size: 11px; color:#2d56a0; line-height: 1.5;">
                                    <span style="display:inline-block;">\${datos.Alamedas ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Alamedas</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.Alumbrado ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Alumbrado</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.Arborizacion ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Arborización</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.Ciclorutas ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Ciclorutas</span><br/>
                                    <span style="display:inline-block;">\${datos.Paradero ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Paradero</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.Parques ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Parques</span> &nbsp;
                                    <span style="display:inline-block;">\${datos.ZonasVerdes ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Zonas verdes</span>
                                </div>

                                <div class="corp-subtitle">Perspectivas de valorización</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-top:2px;">\${datos.PerspectivasDeValorizacion || 'De acuerdo con las condiciones del sector y a la dinámica del mercado, se consideran perspectivas de valoración altas.'}</p>
                            </td>
                            <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                                <div class="corp-title"><span class="corp-bullet"></span>Edificación estructura</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Estado de la construcción</td><td>\${datos.EstadoDeLaConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Avance (en construcción)</td><td>\${datos.AvanceEnConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estado de conservación</td><td>\${datos.EstadoDeConservacion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">No. de pisos del inmueble</td><td>\${datos.NoDePisosDelInmueble || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Número de sótanos</td><td>\${datos.NumeroDeSotanos || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Vida útil</td><td>\${datos.VidaUtil || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Vida remanente</td><td>\${datos.VidaRemanente || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Año de construcción</td><td>\${datos.YearDeConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Edad</td><td>\${datos.Edad || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estructura</td><td>\${datos.Estructura || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Material de Estructura</td><td>\${datos.MaterialDeEstructura || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estado</td><td>\${datos.EstructuraEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Remodelado</td><td>\${datos.Remodelado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Uso Actual Predominante</td><td>\${datos.UsoActualPredominante || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Ajuste sismorresistente</td><td>\${datos.AjusteSismorresistente || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Cubierta</td><td>\${datos.Cubierta || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Fachada</td><td>\${datos.Fachada || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Tipo de fachada en metros</td><td>\${datos.TipoDeFachadaEnMetros || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estructura reforzada</td><td>\${datos.EstructuraReforzada || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Daños previos</td><td>\${datos.DanosPrevios || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Material de construcción</td><td>\${datos.MaterialDeConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Iluminación</td><td>\${datos.Iluminacion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Ventilación</td><td>\${datos.Ventilacion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Irregularidad planta</td><td>\${datos.IrregularidadPlanta || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Irregularidad altura</td><td>\${datos.IrregularidadAltura || ''}</td></tr>
                                </table>
                                <div class="corp-subtitle">Comentarios de la estructura</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-top:2px;">\${datos.ComentariosDeLaEstructura || 'No se evidencia ninguna clase de construcción sobre el lote objeto de avalúo.'}</p>
                            </td>
                        </tr>
                    </table>`
);

// seccion_textos_legales
code = code.replace(
    /<div style="font-size: 8px; text-align: justify; margin-bottom: 10px;">[\s\S]*?<\/div>/,
    `<div style="font-size: 11px; text-align: justify; margin-bottom: 15px; line-height: 1.45;">
                        <div class="corp-title"><span class="corp-bullet"></span>Definición de Términos y Conceptos</div>
                        <p><b>AVALÚO:</b> Es el estudio o proceso mediante el cual se estima y documenta el valor de un bien raíz o bien inmueble, de acuerdo a la apreciación personal expresada por un profesional...</p>
                        <p><b>VALOR COMERCIAL:</b> Es la cantidad estimada de dinero circulante a cambio de la cual el vendedor y el comprador del bien que se valúa...</p>
                        
                        <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Condicionantes y Salvedades al Avalúo</div>
                        <p>Conforme al artículo 18 de la Resolución 620, del 23/09/2008, del IGAC; por la cual se establece la metodología...</p>
                        <p>La información y antecedentes de propiedad asentados en el presente Avalúo es la contenida en la documentación oficial...</p>
                        
                        <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Metodología Valuatoria</div>
                        <p>Método Físico, Directo o enfoque de COSTOS, es el proceso técnico necesario para estimar el costo de reproducción o de reemplazo...</p>
                        <p>Método Comparativo o de MERCADO, es el desarrollo analítico a través del cual se obtiene un valor que resulta de comparar el bien que se valúa...</p>
                    </div>`
);

// seccion_usos_propuestos
code = code.replace(
    /<div style="font-size: 8px; margin-bottom: 15px;">[\s\S]*?<\/div>/,
    `<div style="margin-bottom: 15px;">
                        <div class="corp-title"><span class="corp-bullet"></span>Usos Propuestos</div>
                        <table class="comparables-table">
                            <tr>
                                <th>Globo de Terreno</th>
                                <th>Uso Principal</th>
                                <th>Uso Complementario</th>
                                <th>Uso Compatible</th>
                                <th>Normas Particulares</th>
                            </tr>
                            <tr>
                                <td style="text-align: center; font-weight: bold; color: #2d56a0;">M 01 A</td>
                                <td>\${datos.UsoPrincipal || 'Dotacional Servicios Básicos'}</td>
                                <td>Comercial C3, Actividades relacionadas...</td>
                                <td>Estaciones de Servicio...</td>
                                <td>Uso Principal de cobertura regional</td>
                            </tr>
                        </table>
                    </div>`
);

// seccion_croquis
code = code.replace(
    /<div style="color: #1d429a; font-size: 10px; margin-bottom: 5px;">CROQUIS<\/div>/,
    `<div class="corp-title"><span class="corp-bullet"></span>Croquis</div>`
);

fs.writeFileSync('server.js', code);
console.log('Styles updated.');
