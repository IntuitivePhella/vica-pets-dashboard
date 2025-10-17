# 🚀 Deploy no Netlify - Guia Completo

## 📋 Pré-requisitos

- Conta no [Netlify](https://netlify.com) (grátis)
- Projeto na pasta `dash_public` pronto

---

## 🎯 Método 1: Deploy via Drag & Drop (Mais Rápido) ⚡

### Passo 1: Preparar o Projeto
1. Certifique-se de que todos os arquivos estão na pasta `dash_public`
2. Verifique se não há erros no console do navegador em ambiente local

### Passo 2: Deploy
1. Acesse [app.netlify.com](https://app.netlify.com)
2. Faça login ou crie uma conta
3. Clique em **"Add new site"** → **"Deploy manually"**
4. Arraste a pasta `dash_public` para a área indicada
5. Aguarde o upload e deploy (1-2 minutos)
6. Pronto! ✅

### Resultado
Você receberá um link como:
```
https://random-name-123456.netlify.app
```

---

## 🎯 Método 2: Deploy via CLI (Recomendado para Updates)

### Passo 1: Instalar Netlify CLI
```bash
npm install -g netlify-cli
```

### Passo 2: Login
```bash
netlify login
```
Isso abrirá o navegador para autenticação.

### Passo 3: Deploy
Na pasta `dash_public`:
```bash
cd dash_public
netlify deploy
```

Siga as instruções:
1. **Create & configure a new site**: Yes
2. **Team**: Escolha seu time
3. **Site name**: `vica-dashboard` (ou outro nome)
4. **Publish directory**: `.` (diretório atual)

### Passo 4: Deploy para Produção
```bash
netlify deploy --prod
```

---

## 🎯 Método 3: Deploy via GitHub (Continuous Deployment)

### Passo 1: Criar Repositório no GitHub
```bash
cd dash_public
git init
git add .
git commit -m "Initial commit: Dashboard Vi.Ca"
git branch -M main
git remote add origin https://github.com/seu-usuario/vica-dashboard.git
git push -u origin main
```

### Passo 2: Conectar ao Netlify
1. No Netlify, clique em **"Add new site"** → **"Import an existing project"**
2. Escolha **"GitHub"**
3. Autorize o Netlify
4. Selecione seu repositório `vica-dashboard`
5. Configure:
   - **Branch to deploy**: `main`
   - **Build command**: (deixe vazio)
   - **Publish directory**: `.`
6. Clique em **"Deploy site"**

### Vantagem
Cada push para o repositório fará deploy automático! 🎉

---

## 🎨 Personalizar Domínio

### Domínio Netlify (Grátis)
1. Vá em **Site settings** → **Domain management**
2. Clique em **"Options"** → **"Edit site name"**
3. Mude para algo como: `vica-pets`
4. Seu site ficará: `https://vica-pets.netlify.app`

### Domínio Customizado (Seu próprio domínio)
1. Vá em **Site settings** → **Domain management**
2. Clique em **"Add custom domain"**
3. Digite seu domínio: `pets.vica.org.br`
4. Siga as instruções para configurar DNS
5. Netlify fornece SSL/HTTPS automático! 🔒

---

## ⚙️ Configurações Recomendadas

### Build Settings
Já configuradas no `netlify.toml`:
- ✅ Publish directory: `.`
- ✅ Redirects configurados
- ✅ Headers de segurança
- ✅ Cache otimizado

### Environment Variables (Se Necessário no Futuro)
Se precisar adicionar variáveis de ambiente:
1. Vá em **Site settings** → **Environment variables**
2. Adicione as variáveis necessárias
3. Elas estarão disponíveis durante o build

---

## 🔒 Checklist de Segurança Pré-Deploy

Antes de fazer o deploy, verifique:

- [ ] Chave ANON_KEY está correta (não é Service Role Key)
- [ ] Políticas RLS estão ativas no Supabase
- [ ] Apenas dados públicos são expostos
- [ ] Não há logs de console com informações sensíveis
- [ ] CORS está configurado corretamente
- [ ] Realtime está funcionando

---

## 📊 Monitoramento Pós-Deploy

### Analytics (Opcional)

#### Netlify Analytics (Pago)
- Vá em **Site settings** → **Analytics**
- Ative o plano

#### Google Analytics (Grátis)
Adicione antes do `</head>` em `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Plausible Analytics (Privacy-Friendly, Pago)
```html
<script defer data-domain="vica-pets.netlify.app" src="https://plausible.io/js/script.js"></script>
```

---

## 🧪 Testar Após Deploy

1. **Abra o link do Netlify**
2. **Verifique o Console (F12)**
   - Não deve haver erros
   - Deve ver: "Status da inscrição Realtime: SUBSCRIBED"
3. **Teste em diferentes dispositivos**
   - Desktop
   - Tablet
   - Mobile
4. **Teste o Real-time**
   - Abra o dashboard em uma aba
   - Mude status de um pet no app Vi.Ca
   - Verifique se o card se move automaticamente

---

## 🔄 Atualizações Futuras

### Via Drag & Drop
1. Faça as alterações localmente
2. Arraste a pasta novamente no Netlify
3. Confirme substituição

### Via CLI
```bash
cd dash_public
# Faça suas alterações
netlify deploy --prod
```

### Via GitHub (Automático)
```bash
git add .
git commit -m "Atualização: descrição da mudança"
git push
```
Deploy automático em 1-2 minutos! 🚀

---

## 🐛 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se a ANON_KEY está correta
- Limpe o cache do navegador

### Cards não aparecem
- Verifique políticas RLS no Supabase
- Veja logs no console (F12)
- Confirme que há pets com status público

### Realtime não funciona
- Verifique se Realtime está ativo no Supabase
- Veja se o WebSocket conectou (console)

### Site muito lento
- Otimize imagens dos pets
- Verifique se está usando CDN do Supabase para fotos
- Ative compressão no Netlify (geralmente automático)

---

## 📞 Suporte Netlify

- [Documentação oficial](https://docs.netlify.com/)
- [Fórum da comunidade](https://answers.netlify.com/)
- [Status do serviço](https://www.netlifystatus.com/)

---

## ✅ Checklist Final

Antes de compartilhar o link:

- [ ] Site está no ar e funcionando
- [ ] Cards aparecem nas colunas corretas
- [ ] Real-time funciona
- [ ] Design está correto (cores, layout)
- [ ] Funciona em mobile
- [ ] Sem erros no console
- [ ] SSL/HTTPS ativo (cadeado verde)
- [ ] Velocidade aceitável (< 3 segundos)
- [ ] Domínio personalizado configurado (se aplicável)

---

## 🎉 Pronto!

Seu dashboard está no ar! Agora você pode:

1. ✅ Compartilhar o link nas redes sociais
2. ✅ Adicionar na bio do Instagram
3. ✅ Enviar para potenciais adotantes
4. ✅ Usar em campanhas de adoção
5. ✅ Exibir em eventos do Vi.Ca

---

💚 **Vi.Ca - Vilinha Catioro**  
Dashboard criado com ❤️ para ajudar mais pets a encontrarem um lar!

**Versão**: 1.0  
**Data**: Outubro 2025  
**Status**: ✅ Pronto para produção

