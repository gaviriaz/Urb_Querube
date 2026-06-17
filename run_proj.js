import proj4 from 'proj4';

const epsg3857 = "EPSG:3857";
const epsg4326 = "EPSG:4326";

const ulX = -9391970.539456178;
const ulY = 1251732.7751980494;
const xPixelSize = 1222.99245256282;
const yPixelSize = -1222.99245256282;

const width = 1792;
const height = 1024;

const corners3857 = {
    topLeft: [ulX, ulY],
    topRight: [ulX + (width * xPixelSize), ulY],
    bottomRight: [ulX + (width * xPixelSize), ulY + (height * yPixelSize)],
    bottomLeft: [ulX, ulY + (height * yPixelSize)]
};

console.log("3857 corners:", corners3857);

const corners4326 = {
    topLeft: proj4(epsg3857, epsg4326, corners3857.topLeft),
    topRight: proj4(epsg3857, epsg4326, corners3857.topRight),
    bottomRight: proj4(epsg3857, epsg4326, corners3857.bottomRight),
    bottomLeft: proj4(epsg3857, epsg4326, corners3857.bottomLeft)
};

console.log("4326 corners (Lng/Lat):");
console.log(corners4326);
