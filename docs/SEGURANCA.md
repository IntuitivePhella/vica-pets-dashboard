# 🔒 Segurança do Dashboard Público Vi.Ca

## ⚠️ Importante: Limitações de Segurança em Aplicações Frontend

### **Realidade:**
**Qualquer código JavaScript executado no navegador é SEMPRE visível** de alguma forma. Não é possível ocultar 100% o código-fonte em aplicações frontend.

---

## 🛡️ Medidas de Proteção Implementadas

### **1. Minificação e Ofuscação**
✅ **Implementado** via `build.js`
- Remove comentários
- Remove espaços em branco
- Reduz nomes de variáveis
- Comprime o código
- Torna difícil de ler para humanos

**Como usar:**
```bash
npm run build
```

### **2. Proteção de Imagens**
✅ **Implementado** em `app.js` e `styles.css`
- Desabilita clique direito
- Desabilita arrastar imagens
- Bloqueia Ctrl+S, Ctrl+C
- Marca d'água com logo Vi.Ca
- `user-select: none` em CSS

### **3. Headers de Segurança**
✅ **Configurado** em `netlify.toml`
- `X-Frame-Options: DENY` - Previne clickjacking
- `X-Content-Type-Options: nosniff` - Previne MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Proteção contra XSS
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Restringe APIs do navegador

---

## 🔑 Sobre as Chaves do Supabase

### **SUPABASE_ANON_KEY - É SEGURA?**

✅ **SIM!** A chave anônima (anon key) **FOI PROJETADA** para ser exposta publicamente.

**Por quê é seguro?**
1. A chave anon é **read-only por padrão**
2. A segurança real vem do **Row Level Security (RLS)** no Supabase
3. Sem RLS configurado corretamente = dados expostos (mesmo com chave privada)

### **O que NÃO deve ser exposto:**
❌ **SUPABASE_SERVICE_ROLE_KEY** - Esta chave NUNCA deve estar no frontend!

### **RLS (Row Level Security) no Supabase**

O RLS é a **verdadeira proteção** dos dados. Certifique-se de que:

1. **Tabela `pets`** tem políticas RLS ativas:
```sql
-- Permitir leitura pública apenas de pets disponíveis/processo/adotados
CREATE POLICY "Público pode ver pets disponíveis"
ON pets FOR SELECT
TO public
USING (
  status IN ('DISPONIVEL', 'EM_PROCESSO_ADOTIVO', 'ADOTADO')
);
```

2. **Tabela `adocoes`** tem acesso restrito:
```sql
-- Permitir leitura apenas da data de adoção
CREATE POLICY "Público pode ver data de adoção"
ON adocoes FOR SELECT
TO public
USING (true)
WITH CHECK (false);
```

---

## 🎯 O que Usuários Técnicos AINDA Podem Fazer

Mesmo com todas as proteções, usuários avançados podem:

1. **Ver código minificado** (mas será difícil de ler)
2. **Ver requisições no Network tab** (URLs, payloads)
3. **Ver as chaves do Supabase** (mas RLS protege os dados)
4. **Fazer screenshots** (marca d'água desencoraja uso)
5. **Inspecionar HTML/CSS**

### **Por que isso é aceitável?**
- A **chave anon é pública por design**
- **RLS protege os dados** no servidor
- **Marca d'água** desencoraja uso indevido de imagens
- **Minificação** dificulta reverse engineering

---

## 🚀 Melhores Práticas para Máxima Segurança

### **1. Configuração do Supabase**
```sql
-- Ativar RLS em TODAS as tabelas
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE adocoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar políticas específicas para cada caso de uso
```

### **2. Variáveis de Ambiente no Netlify**
Embora não seja necessário para chaves anon, você pode:
1. Ir em **Site settings** → **Environment variables**
2. Adicionar `SUPABASE_URL` e `SUPABASE_ANON_KEY`
3. Referenciar via `process.env` (se usar bundler)

### **3. Rate Limiting no Supabase**
Configure limites de requisições no Supabase Dashboard:
- **Settings** → **API** → **Rate Limiting**
- Limite requisições por IP
- Previne abuso da API

### **4. Monitoramento**
- Monitore logs no Supabase Dashboard
- Configure alertas para uso anormal
- Revise logs de acesso regularmente

### **5. CORS Configuration**
Configure CORS no Supabase para aceitar apenas seu domínio:
```
https://vica-realtime-pets.netlify.app
```

---

## 📊 Níveis de Proteção Alcançados

### **Dados do Backend:**
🟢 **ALTO** - Protegido por RLS no Supabase

### **Código JavaScript:**
🟡 **MÉDIO** - Minificado, dificulta leitura casual

### **Imagens dos Pets:**
🟡 **MÉDIO** - Marca d'água + proteções JS/CSS

### **Chaves de API:**
🟢 **SEGURO** - Chave anon é pública por design

---

## 🔍 Como Verificar Sua Segurança

### **1. Teste RLS no Supabase:**
```sql
-- Conectar como anonymous user
SET ROLE anon;

-- Tentar ler dados sensíveis (deve falhar)
SELECT * FROM users;

-- Ler pets públicos (deve funcionar)
SELECT * FROM pets WHERE status = 'DISPONIVEL';
```

### **2. Teste de Penetração Básico:**
1. Abra DevTools → Network
2. Tente fazer requisições manuais via console
3. Verifique se apenas dados públicos são acessíveis
4. Tente modificar dados (deve falhar se RLS estiver correto)

### **3. Verificar Build:**
```bash
npm run build
cat dist/app.js  # Deve estar minificado
```

---

## 📝 Checklist de Segurança

Antes de deploy em produção:

- [ ] RLS ativado em todas as tabelas do Supabase
- [ ] Políticas RLS testadas e funcionando
- [ ] Build minificado gerado (`npm run build`)
- [ ] Headers de segurança configurados no Netlify
- [ ] Rate limiting configurado no Supabase
- [ ] CORS configurado para seu domínio apenas
- [ ] Monitoramento de logs ativado
- [ ] Marca d'água nas imagens funcionando
- [ ] Service role key NUNCA no código frontend
- [ ] Domínio personalizado com HTTPS

---

## 🆘 Em Caso de Exposição de Chave Sensível

Se você **acidentalmente expôs a SERVICE ROLE KEY**:

1. **Revogue imediatamente** no Supabase Dashboard
2. Gere nova chave service role
3. Atualize apenas no backend/ambiente seguro
4. Revise logs para detectar uso não autorizado
5. Considere rotação de outras credenciais

---

## 📚 Recursos Adicionais

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Netlify Security Headers](https://docs.netlify.com/routing/headers/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Lembre-se:** A segurança em frontend é sobre **dificultar e desencoraja**r, não sobre **impedir completamente**. A verdadeira segurança está no **backend** (RLS, autenticação, autorização).

