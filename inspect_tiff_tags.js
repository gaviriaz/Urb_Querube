import { fromFile } from 'geotiff';

const tiffPath = "c:/Users/AlbertG/IGGA.SAS/PERSONAL/DEV/SHEY/RENDER/GOOGLE_SAT_WM.tif";

async function run() {
    try {
        console.log("Reading TIFF image:", tiffPath);
        const tiff = await fromFile(tiffPath);
        const image = await tiff.getImage();
        
        console.log("TIFF Width:", image.getWidth());
        console.log("TIFF Height:", image.getHeight());
        
        // Print file directory
        const fd = image.fileDirectory;
        console.log("File Directory Tags:");
        for (const [key, val] of Object.entries(fd)) {
            // truncate large values
            let valStr = String(val);
            if (valStr.length > 200) {
                valStr = valStr.substring(0, 200) + "...";
            }
            console.log(`  Tag ${key}: ${valStr}`);
        }
    } catch (e) {
        console.error("TIFF tag inspection failed:", e.message, e.stack);
    }
}

run();
