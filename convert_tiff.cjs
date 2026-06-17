const GeoTIFF = require('geotiff');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const tiffPath = "../GOOGLE_SAT_WM.tif";
const pngOutputPath = "./public/GOOGLE_SAT_WM.png";

async function run() {
    try {
        console.log("Reading TIFF image from:", tiffPath);
        const data = fs.readFileSync(tiffPath);
        const tiff = await GeoTIFF.fromBuffer(data);
        const image = await tiff.getImage();
        
        const width = image.getWidth();
        const height = image.getHeight();
        console.log(`TIFF Dimensions: Width = ${width}px, Height = ${height}px`);
        
        console.log("Reading RGB channels...");
        const rgb = await image.readRGB();
        console.log("RGB channels read. Buffer size:", rgb.length);
        
        console.log("Encoding PNG...");
        const png = new PNG({ width, height });
        
        let pngOffset = 0;
        for (let i = 0; i < rgb.length; i += 3) {
            png.data[pngOffset] = Math.min(255, Math.max(0, Math.round(rgb[i])));
            png.data[pngOffset + 1] = Math.min(255, Math.max(0, Math.round(rgb[i + 1])));
            png.data[pngOffset + 2] = Math.min(255, Math.max(0, Math.round(rgb[i + 2])));
            png.data[pngOffset + 3] = 255; // Opaque
            pngOffset += 4;
        }
        
        console.log("Writing PNG to:", pngOutputPath);
        png.pack()
           .pipe(fs.createWriteStream(pngOutputPath))
           .on('finish', () => {
               console.log("Successfully converted and saved PNG!");
           })
           .on('error', (err) => {
               console.error("Error writing PNG stream:", err.message);
           });
           
    } catch (e) {
        console.error("TIFF conversion failed:", e.message, e.stack);
    }
}

run();
