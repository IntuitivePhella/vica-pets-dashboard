const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🔨 Iniciando build profissional do dashboard...\n');

// Função para gerar hash curto do conteúdo (cache busting)
function generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Criar diretório dist se não existir
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

try {
    // Verificar se ferramentas estão instaladas
    console.log('📦 Verificando dependências...');
    try {
        execSync('npx terser --version', { stdio: 'ignore' });
        console.log('✅ Terser disponível\n');
    } catch (e) {
        console.log('⚠️  Terser não encontrado, instalando...');
        execSync('npm install', { stdio: 'inherit' });
    }

    // Minificar app.js com Terser (preserva funcionalidade)
    console.log('⚙️  Minificando app.js com Terser...');
    const appJSOriginal = fs.statSync('app.js').size;
    execSync('npx terser app.js -o dist/app.js --compress --mangle --keep-fnames', { stdio: 'inherit' });
    const appJSMinified = fs.statSync('dist/app.js').size;
    console.log(`✅ app.js: ${appJSOriginal} bytes → ${appJSMinified} bytes (${Math.round((1 - appJSMinified/appJSOriginal) * 100)}% redução)\n`);

    // Minificar styles.css com clean-css
    console.log('⚙️  Minificando styles.css...');
    const cssOriginal = fs.statSync('styles.css').size;
    execSync('npx cleancss -o dist/styles.css styles.css', { stdio: 'inherit' });
    const cssMinified = fs.statSync('dist/styles.css').size;
    console.log(`✅ styles.css: ${cssOriginal} bytes → ${cssMinified} bytes (${Math.round((1 - cssMinified/cssOriginal) * 100)}% redução)\n`);

    // Cache busting: gerar hashes baseados no conteúdo minificado
    const jsContent = fs.readFileSync('dist/app.js', 'utf8');
    const cssContent = fs.readFileSync('dist/styles.css', 'utf8');
    const jsHash = generateHash(jsContent);
    const cssHash = generateHash(cssContent);
    console.log(`🔑 Cache busting hashes: app.js?v=${jsHash} | styles.css?v=${cssHash}\n`);

    // Minificar index.html com cache busting
    console.log('⚙️  Minificando index.html...');
    const htmlOriginal = fs.statSync('index.html').size;
    
    // Primeiro, injetar hashes de cache busting no HTML
    let htmlContent = fs.readFileSync('index.html', 'utf8');
    htmlContent = htmlContent.replace('href="styles.css"', `href="styles.css?v=${cssHash}"`);
    htmlContent = htmlContent.replace('src="app.js"', `src="app.js?v=${jsHash}"`);
    
    // Salvar HTML temporário com hashes para o minificador processar
    const tempHtmlPath = path.join(distDir, 'index.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    // Minificar o HTML já com os hashes injetados
    execSync(`npx html-minifier-terser --collapse-whitespace --remove-comments --minify-js true --minify-css true -o dist/index.html dist/index.html`, { stdio: 'inherit' });
    const htmlMinified = fs.statSync('dist/index.html').size;
    console.log(`✅ index.html: ${htmlOriginal} bytes → ${htmlMinified} bytes (${Math.round((1 - htmlMinified/htmlOriginal) * 100)}% redução)\n`);

    // Copiar outros arquivos
    console.log('📦 Copiando arquivos estáticos...');
    
    // Copiar netlify.toml
    fs.copyFileSync('netlify.toml', 'dist/netlify.toml');
    
    // Copiar _redirects
    fs.copyFileSync('_redirects', 'dist/_redirects');
    
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
    
    console.log('🎉 Build profissional concluído com sucesso!');
    console.log(`📁 Arquivos de produção em: ${distDir}`);
    console.log('\n💡 Os arquivos foram minificados com ferramentas profissionais que preservam a funcionalidade!');
    
} catch (error) {
    console.error('❌ Erro durante o build:', error.message);
    process.exit(1);
}

