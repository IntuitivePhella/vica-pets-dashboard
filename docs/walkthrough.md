# Walkthrough: Otimização Drástica de Imagens (Netlify CDN)

## Problema Original
Descobrimos através da aba Observability que a aplicação gera entre **20.000 a 35.000 requisições diárias**. Cada uma dessas requisições de imagem forçava o download de fotos de 2MB a 5MB direto da "origem" do CDN Supabase, consumindo assim **152.5GB de Cached Egress em apenas 4 dias**.

Além disso, descobrimos que seu plano Pro do Supabase lhe limita estritamente a **100 Transformações de Imagem** gratuitas por mês.

## O que foi realizado
Descartamos as caríssimas transformações do Supabase e desviamos **todo o tráfego pesado de imagens para os servidores gratuitos do Netlify**, onde você já hospeda a aplicação:

1. **Configuração Netlify autorizada:** 
   Adicionamos ao arquivo [netlify.toml](file:///c:/Users/femat/Projetos%20Python/Vi.Ca_Project/Vi.Ca_App/dash_public/netlify.toml) o domínio `https://dwrtskjadoocdxojkrlu.supabase.co` para a ferramenta *Netlify Image* manipular de forma autorizada.

2. **Refatoração no Frontend ([app.js](file:///c:/Users/femat/Projetos%20Python/Vi.Ca_Project/Vi.Ca_App/dash_public/app.js)):**
   Modifiquei a função [buildCardImageUrl()](file:///c:/Users/femat/Projetos%20Python/Vi.Ca_Project/Vi.Ca_App/dash_public/app.js#61-74) para remover as antigas transformações do Supabase e encapsular as URLs pelo caminho de proxy:
   `/.netlify/images?url=[URL_ORIGINAL_DO_SUPABASE]&w=400&q=80`

   Em vez de baixar a imagem Master inteira de vários MBs, a tela do usuário agora sempre pede uma versão super leve com 400px de largura.

3. **Correção de Cache Offline ([sw.js](file:///c:/Users/femat/Projetos%20Python/Vi.Ca_Project/Vi.Ca_App/dash_public/sw.js)):**
   O *Service Worker* do navegador dos usuários foi ensinado a reter e cachear no celular/navegador as imagens com esse caminho `/.netlify/images`, blindando ainda mais solicitações repetidas na internet.

## Como testar as alterações
1. Faça o deploy via Git (ou Netlify CLI) das alterações geradas nos arquivos [netlify.toml](file:///c:/Users/femat/Projetos%20Python/Vi.Ca_Project/Vi.Ca_App/dash_public/netlify.toml), [app.js](file:///c:/Users/femat/Projetos%20Python/Vi.Ca_Project/Vi.Ca_App/dash_public/app.js) e [sw.js](file:///c:/Users/femat/Projetos%20Python/Vi.Ca_Project/Vi.Ca_App/dash_public/sw.js).
2. Acesse `https://adocoes-tempo-real.adotevica.com.br/`.
3. Abra a aba de desenvolvedor (F12) > Aba de **Network (Rede)** > Filtre por `Img`.
4. Procure o domínio das imagens que estão carregando (agora elas aparecerão carregando a partir do seu próprio domínio Netlify acompanhadas de `w=400` no final URL).
5. Verifique a coluna **Size**. Os tamanhos das imagens, agora minúsculos (20KB - 50KB), demonstram o total alívio providenciado.

O gráfico de "Cached Egress" reportado no painel do seu Supabase começará a desenhar uma linha plana drasticamente mais baixa nas próximas horas após o deploy!
