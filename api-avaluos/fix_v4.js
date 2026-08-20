const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// seccion_predio_dotacion
content = content.replace(
    /if \(bloque\.tipo === 'seccion_predio_dotacion'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>\s*<table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">\s*<tr>\s*<td style="width: 50%; vertical-align: top; padding-right: 15px;">([\s\S]*?)<\/td>\s*<td style="width: 50%; vertical-align: top;">([\s\S]*?)<\/td>\s*<\/tr>\s*<\/table>`/g,
    `if (bloque.tipo === 'seccion_predio_dotacion') {
                    return \`
                    <div style="column-count: 2; column-gap: 4%; column-fill: auto; widows: 1; orphans: 1; margin-bottom: 15px;">
                        <div class="corp-block-item" style="break-inside: auto; page-break-inside: auto;">$1</div>
                        <div class="corp-block-item" style="break-before: column; break-inside: auto; page-break-inside: auto;">$2</div>
                    </div>\``
);

// seccion_sector
content = content.replace(
    /if \(bloque\.tipo === 'seccion_sector'\) \{\s*return `\s*<div style="page-break-before: always;"><\/div>\s*<table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">\s*<tr>\s*<td style="width: 50%; vertical-align: top; padding-right: 15px;">([\s\S]*?)<\/td>\s*<td style="width: 50%; vertical-align: top; padding-left: 10px;">([\s\S]*?)<\/td>\s*<\/tr>\s*<\/table>`/g,
    `if (bloque.tipo === 'seccion_sector') {
                    return \`
                    <div style="column-count: 2; column-gap: 4%; column-fill: auto; widows: 1; orphans: 1; margin-bottom: 15px;">
                        <div class="corp-block-item" style="break-inside: auto; page-break-inside: auto;">$1</div>
                        <div class="corp-block-item" style="break-before: column; break-inside: auto; page-break-inside: auto;">$2</div>
                    </div>\``
);

fs.writeFileSync('server.js', content);
console.log("Successfully converted seccion_predio_dotacion and seccion_sector.");
