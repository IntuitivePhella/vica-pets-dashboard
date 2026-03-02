const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔨 Iniciando build do dashboard...\n');

// Função para gerar hash curto do conteúdo (cache busting)
function generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Função para minificar JavaScript
function minifyJS(code) {
    // Proteção: evitar que "https://", "http://", etc. sejam tratados como comentário de linha.
    // O minificador abaixo remove tudo após "//" na linha; sem essa proteção, URLs são corrompidas.
    const PROTOCOL_PLACEHOLDER = '__COLON_SLASH_SLASH__';
    code = code.replace(/:\/\//g, PROTOCOL_PLACEHOLDER);

    // Remove comentários
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    code = code.replace(/\/\/.*/g, '');

    // Restaura separador de protocolo
    code = code.replace(new RegExp(PROTOCOL_PLACEHOLDER, 'g'), '://');
    
    // Remove espaços em branco extras
    code = code.replace(/\s+/g, ' ');
    
    // Remove espaços ao redor de operadores
    code = code.replace(/\s*([+\-*/%=<>!&|,;:?(){}[\]])\s*/g, '$1');
    
    // Remove quebras de linha desnecessárias
    code = code.replace(/\n+/g, '');
    
    return code.trim();
}

// Função para minificar CSS
function minifyCSS(code) {
    // Remove comentários
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove espaços em branco extras
    code = code.replace(/\s+/g, ' ');
    
    // Remove espaços ao redor de : ; { }
    code = code.replace(/\s*([{}:;,])\s*/g, '$1');
    
    // Remove quebras de linha
    code = code.replace(/\n+/g, '');
    
    return code.trim();
}

// Função para minificar HTML
function minifyHTML(code) {
    // Remove comentários HTML
    code = code.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove espaços em branco entre tags
    code = code.replace(/>\s+</g, '><');
    
    // Remove múltiplos espaços
    code = code.replace(/\s+/g, ' ');
    
    return code.trim();
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSupabaseRedirectRule(netlifyToml) {
    const blocks = netlifyToml.split('[[redirects]]').slice(1);
    for (const block of blocks) {
        const fromMatch = block.match(/from\s*=\s*"([^"]+)"/);
        if (!fromMatch || fromMatch[1] !== '/supabase-img/*') continue;

        const toMatch = block.match(/to\s*=\s*"([^"]+)"/);
        const statusMatch = block.match(/status\s*=\s*(\d+)/);
        const forceMatch = block.match(/force\s*=\s*(true|false)/);

        if (!toMatch || !statusMatch) return null;

        const forceSuffix = forceMatch && forceMatch[1] === 'true' ? '!' : '';
        return `${fromMatch[1]}  ${toMatch[1]}  ${statusMatch[1]}${forceSuffix}`;
    }

    return null;
}

function upsertSupabaseRedirect(redirectsContent, supabaseRuleLine) {
    if (!supabaseRuleLine) return redirectsContent;

    const ruleRegex = new RegExp(`^\\s*${escapeRegExp('/supabase-img/*')}\\s+.*$`, 'm');
    if (ruleRegex.test(redirectsContent)) {
        return redirectsContent.replace(ruleRegex, supabaseRuleLine);
    }

    return `${supabaseRuleLine}\n\n${redirectsContent.trimStart()}`;
}

// Criar diretório dist se não existir
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

try {
    // Minificar app.js
    console.log('⚙️  Minificando app.js...');
    const appJS = fs.readFileSync('app.js', 'utf8');
    const minifiedJS = minifyJS(appJS);
    fs.writeFileSync('dist/app.js', minifiedJS);
    console.log(`✅ app.js: ${appJS.length} bytes → ${minifiedJS.length} bytes (${Math.round((1 - minifiedJS.length/appJS.length) * 100)}% redução)\n`);

    // Minificar styles.css
    console.log('⚙️  Minificando styles.css...');
    const stylesCSS = fs.readFileSync('styles.css', 'utf8');
    const minifiedCSS = minifyCSS(stylesCSS);
    fs.writeFileSync('dist/styles.css', minifiedCSS);
    console.log(`✅ styles.css: ${stylesCSS.length} bytes → ${minifiedCSS.length} bytes (${Math.round((1 - minifiedCSS.length/stylesCSS.length) * 100)}% redução)\n`);

    // Cache busting: gerar hashes baseados no conteúdo minificado
    const jsHash = generateHash(minifiedJS);
    const cssHash = generateHash(minifiedCSS);
    console.log(`🔑 Cache busting hashes: app.js?v=${jsHash} | styles.css?v=${cssHash}\n`);

    // Minificar index.html e injetar hashes de cache busting
    console.log('⚙️  Minificando index.html...');
    let indexHTML = fs.readFileSync('index.html', 'utf8');
    
    // Injetar query strings de cache busting nas referências de arquivos
    indexHTML = indexHTML.replace('href="styles.css"', `href="styles.css?v=${cssHash}"`);
    indexHTML = indexHTML.replace('src="app.js"', `src="app.js?v=${jsHash}"`);
    
    const minifiedHTML = minifyHTML(indexHTML);
    fs.writeFileSync('dist/index.html', minifiedHTML);
    console.log(`✅ index.html: ${indexHTML.length} bytes → ${minifiedHTML.length} bytes (${Math.round((1 - minifiedHTML.length/indexHTML.length) * 100)}% redução)\n`);

    // Copiar outros arquivos
    console.log('📦 Copiando arquivos estáticos...');
    
    // Copiar netlify.toml
    fs.copyFileSync('netlify.toml', 'dist/netlify.toml');

    // Copiar service worker
    fs.copyFileSync('sw.js', 'dist/sw.js');
    
    // Copiar _redirects garantindo proxy de imagens do Supabase
    const netlifyToml = fs.readFileSync('netlify.toml', 'utf8');
    const supabaseRuleLine = getSupabaseRedirectRule(netlifyToml);
    const redirectsContent = fs.readFileSync('_redirects', 'utf8');
    const updatedRedirects = upsertSupabaseRedirect(redirectsContent, supabaseRuleLine);
    fs.writeFileSync('dist/_redirects', updatedRedirects);
    
    // Copiar pasta icons
    const iconsDir = path.join(distDir, 'icons');
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir);
    }
    
    const iconsFiles = fs.readdirSync('icons');
    iconsFiles.forEach(file => {
        fs.copyFileSync(path.join('icons', file), path.join(iconsDir, file));
    });
    
    console.log('✅ Arquivos estáticos copiados\n');
    
    console.log('🎉 Build concluído com sucesso!');
    console.log(`📁 Arquivos de produção em: ${distDir}`);
    
} catch (error) {
    console.error('❌ Erro durante o build:', error);
    process.exit(1);
}

