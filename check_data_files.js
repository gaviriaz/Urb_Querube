import fs from 'fs';
try {
    console.log("Files in public/data/:", fs.readdirSync('./public/data'));
} catch (e) {
    console.error(e);
}
