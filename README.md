# Dashboard Público Vi.Ca - Pets Disponíveis

Dashboard em tempo real para visualização pública dos pets disponíveis para adoção no Vi.Ca.

## 📋 Descrição

Interface HTML pública que exibe os pets em 3 colunas tipo Kanban:
- **Disponível**: Pets prontos para adoção
- **Em Processo Adotivo**: Pets com adoção em andamento
- **Adotado Hoje**: Pets que foram adotados no dia atual (atualiza automaticamente à meia-noite)

Os cards se movem automaticamente entre as colunas conforme o status dos pets é atualizado no banco de dados, em tempo real.

## 🎨 Design

O design segue fielmente o padrão visual do aplicativo Vi.Ca:
- Paleta de cores oficial Vi.Ca
- Layout de cards similar ao `PetsList.tsx`
- Animações suaves para transições
- Design responsivo para desktop, tablet e mobile

## 🔒 Segurança

A aplicação utiliza uma arquitetura segura para proteger o banco de dados:

1. **Edge Function**: A busca de dados é feita através da Edge Function `get-public-pets` que:
   - Usa credenciais server-side
   - Expõe apenas dados públicos necessários
   - Filtra apenas pets com status público (DISPONIVEL, EM_PROCESSO_ADOTIVO, ADOTADO)
   - Não expõe informações sensíveis

2. **Supabase Realtime**: Para atualizações em tempo real:
   - Usa a chave anônima pública (segura)
   - Escuta apenas mudanças na tabela `pets`
   - Filtra pelo status público

## 📦 Estrutura de Arquivos

```
dash_public/
├── index.html          # Estrutura HTML da página
├── styles.css          # Estilos CSS (baseados no tema Vi.Ca)
├── app.js              # Lógica JavaScript e integração Supabase
└── README.md           # Este arquivo
```

## 🚀 Como Usar

### Desenvolvimento Local

1. Abra o arquivo `index.html` diretamente no navegador, ou
2. Use um servidor HTTP local:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server -p 8000
   ```
3. Acesse `http://localhost:8000` no navegador

### Produção

Para colocar em produção, você pode:

1. **Hospedar como site estático**:
   - Vercel, Netlify, GitHub Pages, etc.
   - Simplesmente faça upload dos arquivos da pasta `dash_public`

2. **Integrar ao backend atual**:
   - Adicione os arquivos ao seu servidor web existente
   - Configure CORS se necessário

3. **Usar Supabase Storage**:
   ```bash
   supabase storage upload --bucket public dash_public/
   ```

## 🔧 Configuração

### Edge Function

A Edge Function `get-public-pets` já está implantada no Supabase.

URL da função:
```
https://dwrtskjadoocdxojkrlu.supabase.co/functions/v1/get-public-pets
```

### Variáveis de Ambiente

As seguintes constantes estão configuradas no `app.js`:
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: Chave pública anônima
- `EDGE_FUNCTION_URL`: URL da Edge Function

## ⚡ Funcionalidades

- ✅ Busca inicial de pets via Edge Function
- ✅ Atualização em tempo real via Supabase Realtime
- ✅ Cards animados ao mudar de status
- ✅ Layout responsivo (desktop, tablet, mobile)
- ✅ Fallback: recarrega dados a cada 5 minutos
- ✅ Loading states e empty states
- ✅ Exibição de características especiais dos pets
- ✅ Design idêntico ao app mobile

## 🎯 Dados Exibidos por Pet

- Foto principal
- Nome
- Espécie (cão/gato)
- Raça ou SRD
- Idade
- Sexo
- Características especiais (se houver)

## 🛠 Tecnologias

- HTML5
- CSS3 (variáveis CSS, Flexbox, Grid)
- JavaScript (ES6+)
- Supabase Client Library
- Supabase Edge Functions
- Supabase Realtime
- Font Awesome Icons

## 📱 Responsividade

- **Desktop** (>1200px): 3 colunas lado a lado
- **Tablet** (768px-1200px): 2 colunas
- **Mobile** (<768px): 1 coluna

## 🔄 Atualizações em Tempo Real

O dashboard escuta mudanças na tabela `pets` e atualiza automaticamente quando:
- Um novo pet é cadastrado com status público
- O status de um pet muda
- Um pet é removido ou seu status muda para não-público
- Qualquer campo do pet é atualizado

## 🐛 Troubleshooting

### Cards não aparecem
- Verifique se a Edge Function está ativa
- Abra o console do navegador para ver erros
- Verifique a conexão com a internet

### Realtime não funciona
- Verifique se o Realtime está ativado no projeto Supabase
- Confira as configurações de RLS na tabela `pets`
- Veja logs no console do navegador

### Fotos não carregam
- Verifique as permissões do bucket `pet-photos`
- Confirme que as URLs das fotos são públicas

## 📄 Licença

Uso interno Vi.Ca - Vilinha Catioro

