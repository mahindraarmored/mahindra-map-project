// build.js
const fs = require('fs');
const path = require('path');

// 1. Get the secret token from the Environment Variables (provided by GitHub Actions)
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; 
const INPUT_FILE = path.join(__dirname, 'index-3.html');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.html'); // Naming as index.html for default deployment

if (!MAPBOX_TOKEN) {
    console.error('ERROR: MAPBOX_TOKEN environment variable is missing!');
    process.exit(1);
}

// 2. Read, replace, and write the final file
let htmlContent = fs.readFileSync(INPUT_FILE, 'utf8');
const finalHtml = htmlContent.replace('%%MAPBOX_TOKEN%%', MAPBOX_TOKEN);

// 3. Create 'dist' folder and write output
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR);
}
fs.writeFileSync(OUTPUT_FILE, finalHtml);

console.log(`✅ Secured file written to ${OUTPUT_FILE}`);
