const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const startMarker = "htmlContenidoDinamico = bloques.map";
const endMarker = "const browser = await puppeteer.launch";

let startIndex = code.indexOf(startMarker);
let endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find markers!");
    process.exit(1);
}

if (!code.includes("const ejs = require('ejs');")) {
    code = "const ejs = require('ejs');\n" + code;
    // update indexes
    startIndex += "const ejs = require('ejs');\n".length;
    endIndex += "const ejs = require('ejs');\n".length;
}

code = code.replace("let htmlContenidoDinamico = '';", "let htmlPlantilla = '';");

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

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

code = before + ejsBlock + after;
fs.writeFileSync('server.js', code);
console.log("Applied EJS fix successfully!");
