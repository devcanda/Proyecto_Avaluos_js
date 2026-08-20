const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Ensure ejs is imported
if (!code.includes("const ejs = require('ejs');")) {
    code = "const ejs = require('ejs');\n" + code;
}

// Replace the htmlContenidoDinamico declaration
code = code.replace("let htmlContenidoDinamico = '';", "let htmlPlantilla = '';");

// Build a regex to match the entire block from htmlContenidoDinamico = bloques.map(...) to the closing </html>`;
// Since the block is huge, we can use a simpler approach: splitting the string.

const startString = "htmlContenidoDinamico = bloques.map(bloque => {";
const endString = "const browser = await puppeteer.launch({ headless: 'new' });";

const startIndex = code.indexOf(startString);
const endIndex = code.indexOf(endString);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const before = code.slice(0, startIndex);
const after = code.slice(endIndex);

const ejsBlock = `
            try {
                htmlPlantilla = await ejs.renderFile(path.join(__dirname, 'views', 'pdf-template.ejs'), {
                    datos,
                    bloques,
                    configMembrete,
                    b64Fachada,
                    b64Mapa,
                    b64MembreteFinal,
                    b64Firma,
                    b64Croquis,
                    anexosHTML,
                    formatDate,
                    procesarVariables
                });
            } catch (err) {
                console.error("Error rendering EJS:", err);
                return res.status(500).send("Error rendering PDF template");
            }
        } else {
            return res.status(404).send('<div style="padding: 50px; text-align: center; color: red;">No hay una plantilla configurada en el Gestor de Plantillas.</div>');
        }

        `;

code = before + ejsBlock + after;
fs.writeFileSync('server.js', code);
console.log("Patched successfully!");
