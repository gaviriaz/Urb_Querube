import fs from 'fs';

const geojsonPath = "./public/data/loteo.geojson";

function run() {
    try {
        const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
        console.log("GeoJSON Type:", data.type);
        console.log("Number of features:", data.features.length);
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        data.features.forEach(feat => {
            if (feat.geometry && feat.geometry.coordinates) {
                const coords = feat.geometry.coordinates;
                const processCoords = (arr) => {
                    if (typeof arr[0] === 'number') {
                        const [x, y] = arr;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    } else {
                        arr.forEach(processCoords);
                    }
                };
                processCoords(coords);
            }
        });
        
        console.log("Bounding Box in WGS84:");
        console.log(`Min Lng (X): ${minX}, Max Lng (X): ${maxX}`);
        console.log(`Min Lat (Y): ${minY}, Max Lat (Y): ${maxY}`);
        
        // Print the first feature properties
        if (data.features.length > 0) {
            console.log("\nFirst feature properties:", JSON.stringify(data.features[0].properties, null, 2));
        }
    } catch (e) {
        console.error("GeoJSON inspection failed:", e.message);
    }
}

run();
