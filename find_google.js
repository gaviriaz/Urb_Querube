import fs from 'fs';
import path from 'path';

const searchDir = "c:/Users/AlbertG/IGGA.SAS/PERSONAL/DEV/SHEY/RENDER";
try {
    const files = fs.readdirSync(searchDir);
    console.log("All files in searchDir:", files);
    const matches = files.filter(f => f.toLowerCase().includes('google') || f.toLowerCase().includes('sat'));
    console.log("Matches:", matches);
} catch (e) {
    console.error(e);
}
