// build.js
const fs = require('fs');
const path = require('path');

// 1. Get the secret token from Environment Variables
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; 

if (!MAPBOX_TOKEN) {
    console.error('ERROR: MAPBOX_TOKEN environment variable is missing!');
    process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, 'dist');
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR);
}

// --- STEP A: HANDLE HTML ---
const INPUT_HTML = path.join(__dirname, 'index-3.html');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');

let htmlContent = fs.readFileSync(INPUT_HTML, 'utf8');
const finalHtml = htmlContent.replace('%%MAPBOX_TOKEN%%', MAPBOX_TOKEN);
fs.writeFileSync(OUTPUT_HTML, finalHtml);
console.log(`✅ HTML secured: ${OUTPUT_HTML}`);


// --- STEP B: HANDLE CONFIG.JS (New Logic) ---
// This ensures the MAPBOX_TOKEN inside your modular JS is also replaced
const CONFIG_DIR = path.join(OUTPUT_DIR, 'js');
if (!fs.existsSync(CONFIG_DIR)){
    fs.mkdirSync(CONFIG_DIR);
}

const INPUT_CONFIG = path.join(__dirname, 'js', 'config.js');
const OUTPUT_CONFIG = path.join(CONFIG_DIR, 'config.js');

let configContent = fs.readFileSync(INPUT_CONFIG, 'utf8');
const finalConfig = configContent.replace('%%MAPBOX_TOKEN%%', MAPBOX_TOKEN);
fs.writeFileSync(OUTPUT_CONFIG, finalConfig);
console.log(`✅ Config.js secured: ${OUTPUT_CONFIG}`);
