import fs from 'fs';

const viasPath = "./public/data/vias.geojson";

function run() {
    try {
        const data = JSON.parse(fs.readFileSync(viasPath, 'utf8'));
        console.log("GeoJSON Type:", data.type);
        console.log("Features:", data.features.length);
        
        data.features.forEach((feat, idx) => {
            console.log(`Feature ${idx}: type=${feat.geometry.type}, coords_length=${feat.geometry.coordinates.length}`);
            if (feat.properties) {
                console.log(`  Properties:`, feat.properties);
            }
            // print first and last coordinate
            const coords = feat.geometry.coordinates;
            if (coords.length > 0) {
                console.log(`  Start:`, coords[0], `End:`, coords[coords.length - 1]);
            }
        });
    } catch (e) {
        console.error("Vias inspection failed:", e.message);
    }
}

run();
