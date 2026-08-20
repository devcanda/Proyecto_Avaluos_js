const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// We will selectively replace the `<table>` wrapper with a CSS multi-column wrapper
// ONLY for seccion_areas_normatividad, seccion_predio_dotacion, seccion_sector.

// 1. seccion_areas_normatividad
content = content.replace(
    /if \(bloque\.tipo === 'seccion_areas_normatividad'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>\s*<table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">\s*<tr>\s*<td style="width: 50%; vertical-align: top; padding-right: 20px; word-wrap: break-word; overflow-wrap: break-word;">([\s\S]*?)<\/td>\s*<td style="width: 50%; vertical-align: top; padding-left: 10px; word-wrap: break-word; overflow-wrap: break-word;">([\s\S]*?)<\/td>\s*<\/tr>\s*<\/table>`/g,
    `if (bloque.tipo === 'seccion_areas_normatividad') {
                    return \`
                    <div style="column-count: 2; column-gap: 4%; column-fill: auto; widows: 1; orphans: 1; margin-bottom: 15px;">
                        <div class="corp-block-item">$1</div>
                        <div class="corp-block-item">$2</div>
                    </div>\``
);

// 2. seccion_predio_dotacion
content = content.replace(
    /if \(bloque\.tipo === 'seccion_predio_dotacion'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>\s*<table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">\s*<tr>\s*<td style="width: 50%; vertical-align: top; padding-right: 15px;">([\s\S]*?)<\/td>\s*<td style="width: 50%; vertical-align: top; padding-left: 10px;">([\s\S]*?)<\/td>\s*<\/tr>\s*<\/table>`/g,
    `if (bloque.tipo === 'seccion_predio_dotacion') {
                    return \`
                    <div style="column-count: 2; column-gap: 4%; column-fill: auto; widows: 1; orphans: 1; margin-bottom: 15px;">
                        <div class="corp-block-item">$1</div>
                        <div class="corp-block-item">$2</div>
                    </div>\``
);

// 3. seccion_sector (which also uses table)
content = content.replace(
    /if \(bloque\.tipo === 'seccion_sector'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>\s*<table style="width: 100%; border:none; margin-bottom:15px; font-size: 8px;">\s*<tr>\s*<td style="width: 50%; vertical-align: top; padding-right: 15px;">([\s\S]*?)<\/td>\s*<td style="width: 50%; vertical-align: top; padding-left: 10px;">([\s\S]*?)<\/td>\s*<\/tr>\s*<\/table>`/g,
    `if (bloque.tipo === 'seccion_sector') {
                    return \`
                    <div style="column-count: 2; column-gap: 4%; column-fill: auto; widows: 1; orphans: 1; margin-bottom: 15px;">
                        <div class="corp-block-item">$1</div>
                        <div class="corp-block-item">$2</div>
                    </div>\``
);

// 4. seccion_comparables_valoracion should KEEP its page-break, so we do nothing to it!
// BUT wait, it already has <div style="page-break-before: always;"></div>. We ensure it's independent.

// 5. Add CSS for corp-block-item and reduce font size / margin gaps
content = content.replace(/<\/style>/, `
                .corp-block-item { width: 100%; margin-bottom: 20px; break-inside: avoid; page-break-inside: avoid; }
            </style>`);
            
content = content.replace(/@page \{ margin: 0; size: letter; \}/, `@page { margin: 0; size: letter; }`);
content = content.replace(/body \{ font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 8px; line-height: 1.4; margin: 0; padding: 0; \}/, `body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 10px; line-height: 1.4; margin: 0; padding: 0; }`);

// Reduce massive gaps in Descripcion General (found inside seccion_areas_normatividad)
content = content.replace(/<p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-bottom: 30px;">/g, '<p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-bottom: 15px;">');

fs.writeFileSync('server.js', content);
console.log("Successfully targeted CSS columns without breaking the global layout.");
