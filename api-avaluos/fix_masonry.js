const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// The original map loop starts here:
const startIndex = content.indexOf(`htmlContenidoDinamico = bloques.map(bloque => {`);

if (startIndex !== -1) {
    let replaced = content.substring(0, startIndex);
    
    replaced += `let currentLeft = '';
            let currentRight = '';
            const flushColumns = () => {
                if (currentLeft || currentRight) {
                    htmlContenidoDinamico += \`<div class="corp-row"><div class="corp-col-left" style="padding-right: 15px;">\${currentLeft}</div><div class="corp-col-right" style="padding-left: 15px;">\${currentRight}</div><div style="clear:both;"></div></div>\`;
                    currentLeft = '';
                    currentRight = '';
                }
            };
            
            bloques.forEach(bloque => {
`;

    // Now we need to process the blocks inside the original map function.
    // Instead of replacing everything, let's just use string replacement on the block returns.
    
    // We can define a helper to extract left and right columns from the returned HTML.
    replaced += `
                let bloqueHtml = (function() {
    `;
    
    // Copy the original block generation logic inside an IIFE
    const endIndex = content.indexOf(`}).join('\\n');`, startIndex);
    let originalLogic = content.substring(startIndex + `htmlContenidoDinamico = bloques.map(bloque => {`.length, endIndex);
    
    // Clean up original logic - remove page break from seccion_areas_normatividad in the raw HTML string
    // because we handle it outside now.
    originalLogic = originalLogic.replace(/<div style="page-break-before: always; clear: both;"><\/div>/g, '');
    
    replaced += originalLogic;
    
    replaced += `
                })();
                
                if (!bloqueHtml) return;

                if (bloque.tipo === 'seccion_general_imagenes' || bloque.tipo === 'seccion_areas_normatividad') {
                    flushColumns();
                }
                
                if (bloque.tipo === 'seccion_areas_normatividad') {
                    htmlContenidoDinamico += \`<div style="page-break-before: always; clear: both;"></div>\`;
                }

                if (bloque.tipo === 'seccion_comparables_valoracion' || bloque.tipo === 'imagenes_portada' || bloque.tipo === 'seccion_croquis' || bloque.tipo === 'titulo' || bloque.tipo === 'texto_libre' || bloque.tipo === 'tabla_info') {
                    flushColumns();
                    htmlContenidoDinamico += bloqueHtml;
                    return;
                }

                // If it's a two column block, extract left and right inner content
                const leftStart = bloqueHtml.indexOf('<div class="corp-col-left"');
                const rightStart = bloqueHtml.indexOf('<div class="corp-col-right"');
                
                if (leftStart !== -1 && rightStart !== -1) {
                    // Find the end of the opening tag for left
                    const leftContentStart = bloqueHtml.indexOf('>', leftStart) + 1;
                    const leftContentEnd = rightStart; // Left ends where right begins
                    
                    const leftContentHtml = bloqueHtml.substring(leftContentStart, leftContentEnd).trim().replace(/<\\/div>$/, '').trim();
                    
                    const rightContentStart = bloqueHtml.indexOf('>', rightStart) + 1;
                    // Right content goes until the second to last </div> (the last one closes the row)
                    let rightContentHtml = bloqueHtml.substring(rightContentStart).trim();
                    
                    // Remove trailing <!-- removed clearfix --> </div>
                    rightContentHtml = rightContentHtml.replace(/<\\/div>\\s*$/, '').trim();
                    rightContentHtml = rightContentHtml.replace(/<!-- removed clearfix -->\\s*$/, '').trim();
                    rightContentHtml = rightContentHtml.replace(/<\\/div>\\s*$/, '').trim();

                    currentLeft += leftContentHtml;
                    currentRight += rightContentHtml;
                } else {
                    flushColumns();
                    htmlContenidoDinamico += bloqueHtml;
                }
            });
            flushColumns();
    `;
    
    replaced += content.substring(endIndex + `}).join('\\n');`.length);
    
    fs.writeFileSync('server.js', replaced);
    console.log("Successfully patched server.js for masonry layout.");
} else {
    console.log("Could not find the map loop.");
}
