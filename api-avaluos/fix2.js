const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// The file might be mangled! Let's restore the deleted part from line 222
// Let's just fix it properly

const deletedPart = `                    }
                });
            } catch(e){}
        }

        const [plantillas] = await db.query('SELECT * FROM plantillas_pdf WHERE es_predeterminada = 1 LIMIT 1');
        let htmlPlantilla = '';
        let configMembrete = { ejeX: 0, ejeY: 0, escala: 100 };
        let b64MembreteFinal = b64Membrete;

        if (plantillas.length > 0) {
            const p = plantillas[0];
            if (p.membrete_url) b64MembreteFinal = getBase64Image(p.membrete_url);
            try { configMembrete = JSON.parse(p.ajustes_membrete || '{"ejeX":0,"ejeY":0,"escala":100}'); } catch(e){}`;

// Let's see if the file is mangled
if (content.includes("let bloques = [];") && !content.includes("const [plantillas] = await db.query")) {
    // it was mangled, we need to insert the missing part before `let bloques = [];`
    // Wait, let's find `let bloques = [];`
    let idx = content.indexOf("let bloques = [];");
    if (idx !== -1) {
        // insert deletedPart right before it
        content = content.substring(0, idx) + deletedPart + "\n            " + content.substring(idx);
        fs.writeFileSync('server.js', content);
        console.log("Restored missing code in server.js!");
    }
} else {
    // maybe it wasn't mangled or already fixed
    console.log("No mangled code detected or already fixed.");
}
