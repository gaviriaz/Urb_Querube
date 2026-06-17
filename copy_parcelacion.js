import fs from 'fs';
const src = "C:/Users/AlbertG/.gemini/antigravity-ide/brain/f5193aea-3d75-42c2-8f71-aef56620f265/scratch/parcelacion.geojson";
const dest = "./public/data/parcelacion.geojson";
try {
    fs.copyFileSync(src, dest);
    console.log("Copied parcelacion.geojson successfully!");
} catch (e) {
    console.error("Error copying file:", e);
}
