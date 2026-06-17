import { fromFile } from 'geotiff';

const tiffPath = "../GOOGLE_SAT_WM.tif";

async function run() {
    try {
        console.log("Reading TIFF image:", tiffPath);
        const tiff = await fromFile(tiffPath);
        const image = await tiff.getImage();
        
        console.log("TIFF Width:", image.getWidth());
        console.log("TIFF Height:", image.getHeight());
        console.log("TIFF Bounding Box:", image.getBoundingBox());
        console.log("TIFF Origin:", image.getOrigin());
        console.log("TIFF Resolution:", image.getResolution());
        
        // Print Geotiff Keys
        const geoKeys = image.getGeoKeys();
        console.log("TIFF GeoKeys:", JSON.stringify(geoKeys, null, 2));
    } catch (e) {
        console.error("TIFF inspection failed:", e.message, e.stack);
    }
}

run();
