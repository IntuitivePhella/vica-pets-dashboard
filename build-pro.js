const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Iniciando build profissional do dashboard...\n');

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

    // Minificar index.html
    console.log('⚙️  Minificando index.html...');
    const htmlOriginal = fs.statSync('index.html').size;
    execSync('npx html-minifier-terser --input-dir . --output-dir dist --file-ext html --collapse-whitespace --remove-comments --minify-js true --minify-css true', { stdio: 'inherit' });
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

