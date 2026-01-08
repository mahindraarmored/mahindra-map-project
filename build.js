// build.js
const fs = require('fs');
const path = require('path');

// 1. Get the secret token from Environment Variables (GitHub Secrets)
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; 

if (!MAPBOX_TOKEN) {
    console.error('ERROR: MAPBOX_TOKEN environment variable is missing!');
    process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, 'dist');

// Create 'dist' folder if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR);
}

// --- STEP 1: SECURE THE HTML ---
// This handles any tokens inside your index-3.html
const INPUT_HTML = path.join(__dirname, 'index-3.html');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');

if (fs.existsSync(INPUT_HTML)) {
    let htmlContent = fs.readFileSync(INPUT_HTML, 'utf8');
    const finalHtml = htmlContent.replace(/%%MAPBOX_TOKEN%%/g, MAPBOX_TOKEN);
    fs.writeFileSync(OUTPUT_HTML, finalHtml);
    console.log(`✅ HTML secured: ${OUTPUT_HTML}`);
}

// --- STEP 2: SECURE THE CONFIG.JS (The missing piece) ---
// This replaces the placeholder inside your modular JS folder
const JS_DIST_DIR = path.join(OUTPUT_DIR, 'js');
if (!fs.existsSync(JS_DIST_DIR)){
    fs.mkdirSync(JS_DIST_DIR);
}

const INPUT_CONFIG = path.join(__dirname, 'js', 'config.js');
const OUTPUT_CONFIG = path.join(JS_DIST_DIR, 'config.js');

if (fs.existsSync(INPUT_CONFIG)) {
    let configContent = fs.readFileSync(INPUT_CONFIG, 'utf8');
    // Replace all instances of the placeholder with the real token
    const finalConfig = configContent.replace(/%%MAPBOX_TOKEN%%/g, MAPBOX_TOKEN);
    fs.writeFileSync(OUTPUT_CONFIG, finalConfig);
    console.log(`✅ Config.js secured: ${OUTPUT_CONFIG}`);
}

console.log(`🚀 Build complete. The "dist" folder is ready for deployment.`);

if (fs.existsSync(INPUT_CONFIG)) {
    let configContent = fs.readFileSync(INPUT_CONFIG, 'utf8');
    const finalConfig = configContent.replace(/%%MAPBOX_TOKEN%%/g, MAPBOX_TOKEN);
    fs.writeFileSync(OUTPUT_CONFIG, finalConfig);
    console.log(`✅ Config.js secured: ${OUTPUT_CONFIG}`);

    // --- NEW STEP: COPY APP.JS TO DIST ---
    const INPUT_APP = path.join(__dirname, 'js', 'app.js');
    const OUTPUT_APP = path.join(JS_DIST_DIR, 'app.js');
    if (fs.existsSync(INPUT_APP)) {
        fs.copyFileSync(INPUT_APP, OUTPUT_APP);
        console.log(`✅ app.js copied to dist`);
    }
}

console.log(`🚀 Build complete. The "dist" folder is ready for deployment.`);

// ... [Keep your existing build.js code until Step 2] ...

if (fs.existsSync(INPUT_CONFIG)) {
    let configContent = fs.readFileSync(INPUT_CONFIG, 'utf8');
    const finalConfig = configContent.replace(/%%MAPBOX_TOKEN%%/g, MAPBOX_TOKEN);
    fs.writeFileSync(OUTPUT_CONFIG, finalConfig);
    console.log(`✅ Config.js secured`);

    // --- ADD THIS: Copy app.js ---
    const INPUT_APP = path.join(__dirname, 'js', 'app.js');
    const OUTPUT_APP = path.join(JS_DIST_DIR, 'app.js');
    if (fs.existsSync(INPUT_APP)) fs.copyFileSync(INPUT_APP, OUTPUT_APP);

    // --- ADD THIS: Copy CSS folder ---
    const CSS_DIST_DIR = path.join(OUTPUT_DIR, 'components');
    if (!fs.existsSync(CSS_DIST_DIR)) fs.mkdirSync(CSS_DIST_DIR);
    const INPUT_CSS = path.join(__dirname, 'components', 'style.css');
    const OUTPUT_CSS = path.join(CSS_DIST_DIR, 'style.css');
    if (fs.existsSync(INPUT_CSS)) fs.copyFileSync(INPUT_CSS, OUTPUT_CSS);
}

// Copy app.js so the map logic actually runs
const INPUT_APP = path.join(__dirname, 'js', 'app.js');
const OUTPUT_APP = path.join(JS_DIST_DIR, 'app.js');
if (fs.existsSync(INPUT_APP)) fs.copyFileSync(INPUT_APP, OUTPUT_APP);

// Copy CSS so the panel and chips look right
const CSS_DIST_DIR = path.join(OUTPUT_DIR, 'components');
if (!fs.existsSync(CSS_DIST_DIR)) fs.mkdirSync(CSS_DIST_DIR);
const INPUT_CSS = path.join(__dirname, 'components', 'style.css');
const OUTPUT_CSS = path.join(CSS_DIST_DIR, 'style.css');
if (fs.existsSync(INPUT_CSS)) fs.copyFileSync(INPUT_CSS, OUTPUT_CSS);
