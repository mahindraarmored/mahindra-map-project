const fs = require('fs');
const path = require('path');

// 1. Get the secret token from GitHub Secrets
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; 
if (!MAPBOX_TOKEN) {
    console.error('ERROR: MAPBOX_TOKEN environment variable is missing!');
    process.exit(1);
}

const DIST = path.join(__dirname, 'dist');
const JS_DIST = path.join(DIST, 'js');
const COMP_DIST = path.join(DIST, 'components');

// 2. Create the folder structure
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);
if (!fs.existsSync(JS_DIST)) fs.mkdirSync(JS_DIST);
if (!fs.existsSync(COMP_DIST)) fs.mkdirSync(COMP_DIST);

// 3. SECURE THE HTML (index-3.html -> dist/index.html)
let html = fs.readFileSync('index-3.html', 'utf8');
fs.writeFileSync(path.join(DIST, 'index.html'), html.replace(/%%MAPBOX_TOKEN%%/g, MAPBOX_TOKEN));

// 4. SECURE THE CONFIG (js/config.js -> dist/js/config.js)
let config = fs.readFileSync(path.join('js', 'config.js'), 'utf8');
fs.writeFileSync(path.join(JS_DIST, 'config.js'), config.replace(/%%MAPBOX_TOKEN%%/g, MAPBOX_TOKEN));

// 5. COPY THE LOGIC (js/app.js -> dist/js/app.js)
fs.copyFileSync(path.join('js', 'app.js'), path.join(JS_DIST, 'app.js'));

// 6. COPY THE STYLES (components/style.css -> dist/components/style.css)
fs.copyFileSync(path.join('components', 'style.css'), path.join(COMP_DIST, 'style.css'));

// 7. COPY THE DOMAIN (CNAME -> dist/CNAME)
if (fs.existsSync('CNAME')) {
    fs.copyFileSync('CNAME', path.join(DIST, 'CNAME'));
}

console.log("🚀 Production build successful! Secured files are in /dist");
