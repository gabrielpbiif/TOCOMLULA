# Tô com Lula · Plenária de Mobilização da Vitória

Site estático: o eleitor coloca a foto no círculo da arte "Tô com Lula" (Plenária de Mobilização da Vitória, terça 13/10, 18h, GRESP — André Ceciliano e Andrezinho Ceciliano) e baixa/compartilha como **imagem** ou como **vídeo com música**.

## Músicas
1. Coloque os arquivos `.mp3` ou `.m4a` na pasta `musicas/`.
2. No topo do `app.js`, adicione uma linha por música na lista `MUSICAS`:
   `{ titulo: 'Nome', sub: 'Jingle Lula', arquivo: 'nome-do-arquivo.mp3', inicio: 0 },`
   (`inicio` = trecho sugerido; no site a pessoa escolhe o trecho arrastando na onda da música)
3. Commit + push. Sem música na lista, a aba de vídeo só oferece "usar música do celular".

## Segurança
- Foto e vídeo **nunca saem do aparelho**: tudo é montado no navegador (canvas + MediaRecorder). Sem backend, sem coleta de dados, sem rastreadores.
- `vercel.json`: CSP restrita (só arquivos do próprio site), anti-iframe, HSTS, nosniff, no-referrer, câmera/microfone/localização bloqueados.
- Fontes hospedadas no próprio site. Upload validado (só imagem, até 25 MB, até 60 MP).

## Deploy
Vercel → Add New Project → importar o repositório → Framework: **Other** → sem build → Deploy.
