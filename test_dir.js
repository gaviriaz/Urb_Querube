import fs from 'fs';
try {
    console.log("Current working directory:", process.cwd());
    console.log("Files in current directory:", fs.readdirSync('.'));
    console.log("Files in parent directory:", fs.readdirSync('..'));
} catch (e) {
    console.error(e);
}
