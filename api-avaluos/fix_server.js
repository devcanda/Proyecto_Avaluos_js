const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const targetStartStr = `            } catch (err) {
                console.error("Error rendering EJS:", err);
                return res.status(500).send("Error rendering PDF template");
            }`;

const targetEndStr = `res.sendFile(rutaPDF);`;

let startIdx = content.indexOf(targetStartStr);
let endIdx = content.indexOf(targetEndStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `            } catch (err) {
                console.error("Error rendering EJS:", err);
                return res.status(500).send("Error rendering PDF template");
            }
        } else {
            return res.status(404).send('<div style="padding: 50px; text-align: center; color: red;">No hay una plantilla configurada en el Gestor de Plantillas.</div>');
        }

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(htmlPlantilla, { waitUntil: 'networkidle0' });
        
        await page.pdf({ 
            path: rutaPDF, 
            format: 'Letter', 
            printBackground: true,
            displayHeaderFooter: false, 
            margin: { top: '0', bottom: '0', left: '0', right: '0' }
        });
        
        await browser.close();
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.sendFile(rutaPDF);`;

    const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + targetEndStr.length);
    fs.writeFileSync('server.js', newContent);
    console.log("Fixed server.js!");
} else {
    console.log("Could not find targets");
}
