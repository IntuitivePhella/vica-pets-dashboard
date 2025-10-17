# 🚀 Guia de Instalação - Dashboard Público Vi.Ca

## 📋 Pré-requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet (para carregar bibliotecas CDN)

## 🌐 Opções de Hospedagem

### Opção 1: Servidor Local (Desenvolvimento/Teste)

#### Usando Python (Recomendado)
```bash
cd dash_public
python -m http.server 8000
```
Acesse: `http://localhost:8000`

#### Usando Node.js
```bash
cd dash_public
npx http-server -p 8000
```
Acesse: `http://localhost:8000`

#### Usando PHP
```bash
cd dash_public
php -S localhost:8000
```
Acesse: `http://localhost:8000`

### Opção 2: Netlify (Mais Simples) 🌟

1. Crie uma conta em [netlify.com](https://netlify.com)
2. Arraste e solte a pasta `dash_public` no Netlify
3. Pronto! Seu site estará no ar em segundos
4. Você receberá um link como: `https://seu-site.netlify.app`

**Personalize o domínio** (Opcional):
- Vá em Site settings → Domain management
- Clique em "Add custom domain"
- Configure seu domínio personalizado

### Opção 3: Vercel

1. Instale o Vercel CLI:
```bash
npm install -g vercel
```

2. No diretório `dash_public`:
```bash
vercel
```

3. Siga as instruções no terminal
4. Seu site estará disponível em `https://seu-projeto.vercel.app`

### Opção 4: GitHub Pages (Grátis)

1. Crie um repositório no GitHub
2. Faça upload dos arquivos da pasta `dash_public`
3. Vá em Settings → Pages
4. Selecione a branch e pasta
5. Salve e aguarde alguns minutos
6. Acesse: `https://seu-usuario.github.io/nome-do-repo`

### Opção 5: Firebase Hosting

1. Instale Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Faça login:
```bash
firebase login
```

3. Inicialize o projeto:
```bash
cd dash_public
firebase init hosting
```

4. Deploy:
```bash
firebase deploy
```

### Opção 6: Servidor Apache/Nginx (VPS/Dedicado)

#### Apache
1. Copie os arquivos para `/var/www/html/dash`:
```bash
sudo cp -r dash_public/* /var/www/html/dash/
```

2. Configure permissões:
```bash
sudo chown -R www-data:www-data /var/www/html/dash
sudo chmod -R 755 /var/www/html/dash
```

3. Acesse: `http://seu-dominio.com/dash`

#### Nginx
1. Copie os arquivos:
```bash
sudo cp -r dash_public/* /usr/share/nginx/html/dash/
```

2. Configure o Nginx (`/etc/nginx/sites-available/default`):
```nginx
location /dash {
    alias /usr/share/nginx/html/dash;
    index index.html;
}
```

3. Reinicie o Nginx:
```bash
sudo systemctl restart nginx
```

## ⚙️ Configuração

### CORS (Cross-Origin Resource Sharing)

Se você hospedar em um domínio diferente do Supabase, não precisa configurar nada! O código já está configurado com CORS liberado.

### HTTPS (Recomendado para Produção)

Todas as opções de hospedagem mencionadas (exceto servidor local) já fornecem HTTPS automaticamente.

Se você estiver usando Apache/Nginx, use [Let's Encrypt](https://letsencrypt.org/) para obter certificado SSL grátis:

```bash
sudo certbot --apache  # Para Apache
sudo certbot --nginx   # Para Nginx
```

## 🔧 Personalização (Opcional)

### Alterar Título da Página

Edite `index.html`, linha 6:
```html
<title>Seu Novo Título Aqui</title>
```

### Alterar Cores

As cores estão definidas no início do `styles.css` usando variáveis CSS:
```css
:root {
    --primary: #547193;      /* Cor principal */
    --secondary: #25AA94;    /* Cor secundária */
    --success: #8CC63F;      /* Cor de sucesso */
    /* ... outras cores */
}
```

### Alterar URL do Supabase

Se você quiser usar outro projeto Supabase, edite `app.js`:
```javascript
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';
```

## 🧪 Testando a Instalação

1. Abra o site no navegador
2. Abra as Ferramentas do Desenvolvedor (F12)
3. Vá na aba Console
4. Você deve ver: "Inicializando aplicação..." e "Status da inscrição Realtime: SUBSCRIBED"
5. Os cards devem aparecer nas colunas correspondentes

### Verificações de Segurança

✅ **Teste 1**: Verifique que apenas pets com status público aparecem
- Abra o console do navegador
- Digite: `console.log(pets)`
- Confirme que todos têm status: DISPONIVEL, EM_PROCESSO_ADOTIVO ou ADOTADO

✅ **Teste 2**: Verifique que dados sensíveis não aparecem
- Inspecione os dados no console
- Confirme que NÃO há: CPF, RG, emails, telefones de adotantes

✅ **Teste 3**: Teste o Real-time
- Abra o dashboard em duas abas
- No app Vi.Ca, mude o status de um pet
- Verifique se o card se move entre colunas automaticamente

## 🐛 Solução de Problemas

### Cards não aparecem

1. Verifique a conexão com internet
2. Abra o Console (F12) e veja se há erros
3. Confirme que a URL do Supabase está correta
4. Verifique se há pets com status público no banco

### Realtime não funciona

1. Verifique se o Realtime está habilitado no Supabase:
   - Vá em Database → Replication
   - Confirme que a tabela `pets` está com replicação ativa

2. Verifique as políticas RLS:
```sql
-- Execute no SQL Editor do Supabase
SELECT * FROM pg_policies WHERE tablename = 'pets';
```
Deve haver uma política permitindo SELECT para role 'anon'.

### Erros de CORS

Se você ver erros de CORS no console:
1. Verifique se está acessando via HTTPS (ou localhost)
2. Confirme que a chave anônima está correta
3. Verifique as configurações de CORS no Supabase

### Imagens não carregam

1. Verifique as permissões do bucket `pet-photos`:
   - Vá em Storage → pet-photos
   - Confirme que o bucket é público

2. Configure políticas de acesso:
```sql
-- Execute no SQL Editor do Supabase
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pet-photos');
```

## 📊 Monitoramento

### Google Analytics (Opcional)

Adicione antes do `</head>` em `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Plausible Analytics (Mais Privacy-Friendly)

```html
<script defer data-domain="seu-dominio.com" src="https://plausible.io/js/script.js"></script>
```

## 🔒 Checklist de Segurança Final

Antes de colocar em produção, confirme:

- [ ] Apenas dados públicos são exibidos (sem CPF, RG, telefones)
- [ ] HTTPS está ativo (cadeado verde no navegador)
- [ ] Chave anônima (ANON_KEY) está sendo usada, não a Service Role Key
- [ ] RLS está habilitado na tabela `pets`
- [ ] Bucket de fotos tem políticas de acesso público corretas
- [ ] Site carrega rápido (< 3 segundos)
- [ ] Real-time funciona corretamente
- [ ] Layout responsivo funciona em mobile

## 📞 Suporte

Se encontrar problemas:
1. Verifique a seção de Solução de Problemas acima
2. Consulte o README.md principal
3. Verifique os logs no console do navegador (F12)

---

💚 **Vi.Ca - Vilinha Catioro**  
Dashboard criado com ❤️ para ajudar mais pets a encontrarem um lar!

