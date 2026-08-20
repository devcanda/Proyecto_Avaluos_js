const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// 1. Remove page break from seccion_textos_legales
content = content.replace(
    /if \(bloque\.tipo === 'seccion_textos_legales'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_textos_legales') {
                    return \``
);

// 2. Remove page break from seccion_usos_propuestos
content = content.replace(
    /if \(bloque\.tipo === 'seccion_usos_propuestos'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_usos_propuestos') {
                    return \``
);

// 3. Remove page break from seccion_areas_normatividad
content = content.replace(
    /if \(bloque\.tipo === 'seccion_areas_normatividad'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_areas_normatividad') {
                    return \``
);

// 4. Remove page break from seccion_predio_dotacion
content = content.replace(
    /if \(bloque\.tipo === 'seccion_predio_dotacion'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_predio_dotacion') {
                    return \``
);

// 5. Remove page break from seccion_sector
content = content.replace(
    /if \(bloque\.tipo === 'seccion_sector'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>/g,
    `if (bloque.tipo === 'seccion_sector') {
                    return \``
);

// 6. Fix font-size 8px bug in seccion_sector table to match other tables
content = content.replace(
    /<table style="width: 100%; border:none; margin-bottom:15px; font-size: 8px;">/g,
    `<table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">`
);

// 7. General fixes to make things tighter so they don't jump pages unnecessarily
content = content.replace(/@page \{ margin: 0; size: letter; \}/, `@page { margin: 0; size: letter; }`);
content = content.replace(/body \{ font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 8px; line-height: 1.4; margin: 0; padding: 0; \}/, `body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 10px; line-height: 1.4; margin: 0; padding: 0; }`);
content = content.replace(/<p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-bottom: 30px;">/g, '<p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-bottom: 15px;">');

fs.writeFileSync('server.js', content);
console.log("Successfully removed all forced page breaks except croquis and comparables.");
