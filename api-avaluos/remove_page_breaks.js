const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// Remove page break from seccion_areas_normatividad
content = content.replace(
    /if \(bloque\.tipo === 'seccion_areas_normatividad'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_areas_normatividad') {
                    return \``
);

// Remove page break from seccion_predio_dotacion
content = content.replace(
    /if \(bloque\.tipo === 'seccion_predio_dotacion'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_predio_dotacion') {
                    return \``
);

// Remove page break from seccion_sector
content = content.replace(
    /if \(bloque\.tipo === 'seccion_sector'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_sector') {
                    return \``
);

// Remove page break from seccion_usos_propuestos
content = content.replace(
    /if \(bloque\.tipo === 'seccion_usos_propuestos'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_usos_propuestos') {
                    return \``
);

// Leave seccion_croquis and seccion_comparables_valoracion as they are!

// Also, let's fix the font sizes and margins to make it look good, as I did before
content = content.replace(/@page \{ margin: 0; size: letter; \}/, `@page { margin: 0; size: letter; }`);
content = content.replace(/body \{ font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 8px; line-height: 1.4; margin: 0; padding: 0; \}/, `body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 10px; line-height: 1.4; margin: 0; padding: 0; }`);

// Reduce massive gaps in Descripcion General (found inside seccion_areas_normatividad)
content = content.replace(/<p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-bottom: 30px;">/g, '<p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-bottom: 15px;">');

fs.writeFileSync('server.js', content);
console.log("Successfully removed forced page breaks from text sections to eliminate dead space.");
