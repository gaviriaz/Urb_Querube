import { fromFile } from 'geotiff';
import fs from 'fs';
import { PNG } from 'pngjs';

const tiffPath = "../GOOGLE_SAT_WM.tif";
const pngOutputPath = "./public/GOOGLE_SAT_WM.png";

async function run() {
    try {
        console.log("Reading TIFF image from:", tiffPath);
        const tiff = await fromFile(tiffPath);
        const image = await tiff.getImage();
        
        const width = image.getWidth();
        const height = image.getHeight();
        console.log(`TIFF Dimensions: Width = ${width}px, Height = ${height}px`);
        
        console.log("Reading RGB channels...");
        const rgb = await image.readRGB();
        
        console.log("Encoding PNG...");
        const png = new PNG({ width, height });
        
        // Check if rgb is an array of channel arrays (planar) or a single flat array (interleaved)
        if (Array.isArray(rgb) && rgb.length === 3 && (rgb[0] instanceof Float32Array || rgb[0] instanceof Uint8Array || rgb[0] instanceof Uint16Array)) {
            console.log("Detected planar RGB configuration (3 separate channel arrays).");
            const r = rgb[0];
            const g = rgb[1];
            const b = rgb[2];
            const numPixels = r.length;
            console.log(`Copying ${numPixels} pixels from planar channels...`);
            
            let pngOffset = 0;
            for (let i = 0; i < numPixels; i++) {
                png.data[pngOffset] = Math.min(255, Math.max(0, Math.round(r[i])));
                png.data[pngOffset + 1] = Math.min(255, Math.max(0, Math.round(g[i])));
                png.data[pngOffset + 2] = Math.min(255, Math.max(0, Math.round(b[i])));
                png.data[pngOffset + 3] = 255; // Opaque
                pngOffset += 4;
            }
        } else {
            console.log("Detected interleaved RGB configuration (flat array).");
            const numPixels = rgb.length / 3;
            console.log(`Copying ${numPixels} pixels from interleaved array...`);
            
            let pngOffset = 0;
            for (let i = 0; i < rgb.length; i += 3) {
                png.data[pngOffset] = Math.min(255, Math.max(0, Math.round(rgb[i])));
                png.data[pngOffset + 1] = Math.min(255, Math.max(0, Math.round(rgb[i + 1])));
                png.data[pngOffset + 2] = Math.min(255, Math.max(0, Math.round(rgb[i + 2])));
                png.data[pngOffset + 3] = 255; // Opaque
                pngOffset += 4;
            }
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
