'use strict';
(() => {
  // Medidas da arte (pixels do modelo 2418×3224)
  const W = 2418, H = 3224;
  const CIRC = { x: 1208, y: 1388, r: 779 };   // buraco transparente da foto
  // Lista de músicas: arquivos publicados junto com a página (pasta musicas/). inicio = segundo em que o vídeo começa a tocar.
  // >>> MÚSICAS: coloque os arquivos .mp3/.m4a na pasta musicas/ e adicione uma linha por música.
  // titulo = nome que aparece; sub = linha pequena embaixo; arquivo = nome do arquivo; inicio = segundo sugerido (a pessoa pode mudar o trecho).
  const MUSICAS = [
    { titulo: 'Lula Lá (Sem medo de ser feliz)', sub: '3:18', arquivo: 'lula-la.mp3', inicio: 0 },
    { titulo: 'Bora Lula', sub: '1:41', arquivo: 'bora-lula.mp3', inicio: 0 },
    { titulo: 'Tapete Vermelho', sub: '3:32', arquivo: 'tapete-vermelho.mp3', inicio: 0 },
    { titulo: 'Rap do Silva', sub: '1:35', arquivo: 'rap-do-silva.mp3', inicio: 0 },
    { titulo: 'O Show Tem Que Continuar', sub: '3:30', arquivo: 'o-show-tem-que-continuar.mp3', inicio: 0 },
  ].map(m => ({ ...m, url: 'musicas/' + encodeURIComponent(m.arquivo) }));

  const tela = document.getElementById('tela'), ctx = tela.getContext('2d');
  const preview = document.getElementById('preview'), inp = document.getElementById('arquivo');
  const zoom = document.getElementById('zoom'), zoomVal = document.getElementById('zoomVal');
  const status = document.getElementById('status');
  const modelo = new Image();
  modelo.src = 'img/modelo.webp';

  let foto = null, original = null, escala = 1, offX = 0, offY = 0, giro = 0;
  const base = () => Math.max(CIRC.r * 2 / foto.width, CIRC.r * 2 / foto.height);
  function limitar(){
    const s = base() * escala, mx = (foto.width * s - CIRC.r * 2) / 2, my = (foto.height * s - CIRC.r * 2) / 2;
    offX = Math.max(-mx, Math.min(mx, offX)); offY = Math.max(-my, Math.min(my, offY));
  }

  // desenha a arte num contexto qualquer (k = escala de saída; pulso = zoom extra animado do vídeo)
  function pintar(g, k, pulso){
    g.save(); g.scale(k, k);
    g.clearRect(0, 0, W, H);
    g.save();
    g.beginPath(); g.arc(CIRC.x, CIRC.y, CIRC.r + 4, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#ffffff'; g.fillRect(CIRC.x - CIRC.r - 6, CIRC.y - CIRC.r - 6, CIRC.r * 2 + 12, CIRC.r * 2 + 12);
    if (foto){
      limitar();
      const s = base() * escala * (pulso || 1), dw = foto.width * s, dh = foto.height * s;
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(foto, CIRC.x + offX - dw / 2, CIRC.y + offY - dh / 2, dw, dh);
    } else {
      g.fillStyle = '#f2b8b2'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '400 150px Anton, Impact, sans-serif'; g.fillText('SUA FOTO AQUI', CIRC.x, CIRC.y - 140);
    }
    g.restore();
    if (modelo.complete && modelo.naturalWidth) g.drawImage(modelo, 0, 0, W, H);
    g.restore();
  }
  const desenhar = () => pintar(ctx, 1, 1);
  modelo.onload = desenhar;
  if (document.fonts && document.fonts.load) document.fonts.load('400 100px Anton').then(desenhar).catch(() => {});

  // ---------- foto ----------
  const setZoom = v => { escala = v; zoom.value = Math.round(v * 100); zoomVal.textContent = zoom.value + '%'; };
  function aplicarGiro(){
    if (!giro){ foto = original; return; }
    const c = document.createElement('canvas'), vira = giro % 180 !== 0;
    c.width = vira ? original.height : original.width; c.height = vira ? original.width : original.height;
    const g = c.getContext('2d'); g.translate(c.width / 2, c.height / 2); g.rotate(giro * Math.PI / 180);
    g.drawImage(original, -original.width / 2, -original.height / 2); foto = c;
  }
  const aviso = document.getElementById('avisoFoto');
  function avisoFoto(msg, neutro){ aviso.textContent = msg; aviso.hidden = !msg; aviso.classList.toggle('neutro', !!neutro); }
  inp.addEventListener('click', () => { inp.value = ''; });
  inp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (f.type && !/^image\//i.test(f.type)){ avisoFoto('Esse arquivo não é uma foto. Escolha uma imagem da galeria.'); inp.value = ''; return; }
    if (f.size > 25 * 1024 * 1024){ avisoFoto('Foto muito grande (máx. 25 MB). Escolha outra.'); inp.value = ''; return; }
    avisoFoto('Carregando foto…', true);
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!img.width || !img.height || img.width * img.height > 60e6){ avisoFoto('Não consegui usar essa foto. Tente outra.'); return; }
      const k = Math.min(1, 2400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      avisoFoto(''); original = c; giro = 0; aplicarGiro(); offX = offY = 0; setZoom(1);
      preview.classList.add('tem-foto');
      const dc = document.getElementById('dica'); dc.hidden = false; setTimeout(() => { dc.hidden = true; }, 3500);
      document.getElementById('ajuste').hidden = false;
      document.getElementById('txtFoto').textContent = 'Trocar foto';
      status.textContent = 'Pronto! Escolha imagem ou vídeo no passo 2.';
      desenhar();
      if (window.innerWidth < 840) preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    img.onerror = () => { URL.revokeObjectURL(url); avisoFoto(/hei[cf]/i.test((f.type || '') + (f.name || '')) ? 'Esse celular salvou a foto em HEIC, que o navegador não abre. Tire um print da foto e envie o print.' : 'Não consegui abrir essa foto. Tente outra imagem.'); };
    img.src = url; inp.value = '';
  });
  zoom.addEventListener('input', () => { setZoom(zoom.value / 100); desenhar(); });
  document.getElementById('girar').addEventListener('click', () => { if (!original) return; giro = (giro + 90) % 360; aplicarGiro(); offX = offY = 0; desenhar(); });
  document.getElementById('centralizar').addEventListener('click', () => { offX = offY = 0; setZoom(1); desenhar(); });

  const toques = new Map(); let dist0 = 0;
  const fator = () => W / tela.getBoundingClientRect().width;
  tela.addEventListener('pointerdown', e => {
    if (!foto || gravando) return; document.getElementById('dica').hidden = true; tela.setPointerCapture(e.pointerId);
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.size === 2){ const [a, b] = [...toques.values()]; dist0 = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  tela.addEventListener('pointermove', e => {
    if (!foto || !toques.has(e.pointerId)) return;
    const ant = toques.get(e.pointerId), at = { x: e.clientX, y: e.clientY }; toques.set(e.pointerId, at);
    if (toques.size === 1){ const k = fator(); offX += (at.x - ant.x) * k; offY += (at.y - ant.y) * k; }
    else if (toques.size === 2){
      const [a, b] = [...toques.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist0) setZoom(Math.max(1, Math.min(3, escala * d / dist0))); dist0 = d;
    }
    desenhar(); limparVideo();
  });
  const soltar = e => { toques.delete(e.pointerId); if (toques.size < 2) dist0 = 0; };
  tela.addEventListener('pointerup', soltar); tela.addEventListener('pointercancel', soltar);
  tela.addEventListener('wheel', e => {
    if (!foto || gravando) return; e.preventDefault();
    setZoom(Math.max(1, Math.min(3, escala * (e.deltaY < 0 ? 1.06 : 0.94)))); desenhar(); limparVideo();
  }, { passive: false });

  // ---------- salvar / compartilhar (comum) ----------
  async function salvar(blob, nome, okMsg){
    if (window.claude && window.claude.use){
      try {
        const dl = await window.claude.use('downloads');
        if (dl){ await dl.save({ filename: nome, data: blob }); status.textContent = okMsg; return; }
      } catch (err){ status.textContent = err && err.code === 'declined' ? 'Download cancelado.' : 'Não deu pra salvar aqui. Tente de novo.'; return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = okMsg;
  }
  async function compartilhar(blob, nome, tipo){
    try { await navigator.share({ files: [new File([blob], nome, { type: tipo })] }); status.textContent = 'Enviado! Mande também o link do site no grupo.'; }
    catch (err){ if (!err || err.name !== 'AbortError') status.textContent = 'Não abriu o compartilhamento. Baixe o arquivo e anexe no WhatsApp.'; }
  }
  const podeCompartilhar = tipo => {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'], { type: tipo })], 't', { type: tipo })] })); } catch (e){ return false; }
  };
  const precisaFoto = () => { if (foto) return true; status.textContent = 'Coloque sua foto no passo 1.'; return false; };

  // ---------- imagem ----------
  const gerarImg = () => new Promise(r => {
    desenhar();
    const c = document.createElement('canvas'); c.width = 1620; c.height = 2160;
    const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(tela, 0, 0, c.width, c.height); c.toBlob(r, 'image/jpeg', 0.9);
  });
  document.getElementById('baixar').addEventListener('click', async () => {
    if (!precisaFoto()) return;
    await salvar(await gerarImg(), 'to-com-lula-plenaria.jpg', 'Imagem salva! No WhatsApp, anexe pela Galeria (não por "Documento") pra ir como foto.');
  });
  const btnZap = document.getElementById('compartilhar');
  btnZap.addEventListener('click', async () => { if (precisaFoto()) compartilhar(await gerarImg(), 'to-com-lula-plenaria.jpg', 'image/jpeg'); });
  btnZap.hidden = !podeCompartilhar('image/jpeg');

  // ---------- abas ----------
  const abaImg = document.getElementById('abaImg'), abaVid = document.getElementById('abaVid');
  function aba(v){
    abaImg.setAttribute('aria-pressed', !v); abaVid.setAttribute('aria-pressed', v);
    document.getElementById('painelImg').hidden = v; document.getElementById('painelVid').hidden = !v;
  }
  abaImg.addEventListener('click', () => aba(false)); abaVid.addEventListener('click', () => aba(true));

  // ---------- músicas ----------
  const lista = document.getElementById('musicas');
  let escolhida = null, audioProprio = null, duracao = 15;
  let ac = null, buf = null, bufId = null, inicio = 0, pre = null, preFim = 0;
  const trechoBox = document.getElementById('trecho'), onda = document.getElementById('onda'), og = onda.getContext('2d');
  const inicioEl = document.getElementById('inicio'), trechoTxt = document.getElementById('trechoTxt'), btnOuvir = document.getElementById('ouvirTrecho');
  const mmss = t => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const audioCtx = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; };
  const durTrecho = () => buf ? Math.min(duracao, buf.duration) : duracao;
  const maxInicio = () => buf ? Math.max(0, buf.duration - durTrecho()) : 0;
  let picos = null;

  function calcPicos(){
    const d = buf.getChannelData(0), n = 240, passo = Math.floor(d.length / n), p = new Float32Array(n);
    for (let i = 0; i < n; i++){ let m = 0; for (let k = i * passo, e = k + passo; k < e; k += 16){ const v = Math.abs(d[k]); if (v > m) m = v; } p[i] = m; }
    const mx = Math.max(...p) || 1; picos = p.map(v => v / mx);
  }
  function desenharOnda(){
    const r = onda.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    onda.width = Math.round(r.width * dpr); onda.height = Math.round(r.height * dpr);
    const w = onda.width, h = onda.height; og.clearRect(0, 0, w, h);
    if (!buf || !picos) return;
    const a = inicio / buf.duration * w, b = (inicio + durTrecho()) / buf.duration * w;
    og.fillStyle = 'rgba(232,4,12,.10)'; og.fillRect(a, 0, b - a, h);
    const bw = w / picos.length;
    picos.forEach((v, i) => {
      const x = i * bw, hh = Math.max(2 * dpr, v * h * 0.86);
      og.fillStyle = (x + bw / 2 >= a && x + bw / 2 <= b) ? '#e8040c' : '#e9c4c0';
      og.fillRect(x + bw * 0.15, (h - hh) / 2, bw * 0.7, hh);
    });
    og.strokeStyle = '#e8040c'; og.lineWidth = 2 * dpr; og.strokeRect(a + dpr, dpr, b - a - 2 * dpr, h - 2 * dpr);
    if (pre && preFim){
      const t = Math.min(audioCtx().currentTime - pre.t0, durTrecho()), x = (inicio + Math.max(0, t)) / buf.duration * w;
      og.fillStyle = '#0433c9'; og.fillRect(x - dpr, 0, 2 * dpr, h);
    }
  }
  function atualizarTrecho(){
    inicio = Math.max(0, Math.min(maxInicio(), inicio));
    inicioEl.max = Math.floor(maxInicio() * 10); inicioEl.value = Math.round(inicio * 10);
    trechoTxt.textContent = buf ? mmss(inicio) + ' até ' + mmss(inicio + durTrecho()) + ' de ' + mmss(buf.duration) : 'Carregando a música…';
    desenharOnda();
  }
  async function carregar(m){
    pararPre(); buf = null; picos = null; bufId = m.id; trechoBox.hidden = false; btnOuvir.disabled = true; atualizarTrecho();
    try {
      const r = await fetch(m.url); if (!r.ok) throw 0;
      const dados = await r.arrayBuffer();
      const b = await new Promise((ok, erro) => { const p = audioCtx().decodeAudioData(dados, ok, erro); if (p && p.catch) p.catch(erro); });
      if (bufId !== m.id) return;
      buf = b; calcPicos(); inicio = Math.min(m.inicio || 0, maxInicio()); btnOuvir.disabled = false; atualizarTrecho();
    } catch (e){ if (bufId === m.id){ trechoTxt.textContent = 'Não consegui abrir essa música. Escolha outra.'; } }
  }
  function pararPre(){
    if (pre){ try { pre.src.stop(); } catch (e){} pre = null; }
    preFim = 0; btnOuvir.textContent = '▶ Ouvir trecho';
  }
  function tocarPre(){
    if (!buf) return; pararPre(); const c = audioCtx(); c.resume();
    const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; src.connect(g); g.connect(c.destination);
    const t0 = c.currentTime + 0.03, d = durTrecho();
    g.gain.setValueAtTime(1, t0); g.gain.setValueAtTime(1, t0 + d - 0.8); g.gain.linearRampToValueAtTime(0, t0 + d);
    src.start(t0, inicio, d); pre = { src, t0 }; preFim = 1; btnOuvir.textContent = '■ Parar';
    src.onended = () => { if (pre && pre.src === src) pararPre(); desenharOnda(); };
    const anim = () => { if (pre && pre.src === src){ desenharOnda(); requestAnimationFrame(anim); } }; requestAnimationFrame(anim);
  }
  btnOuvir.addEventListener('click', () => { if (pre) pararPre(); else tocarPre(); desenharOnda(); });
  inicioEl.addEventListener('input', () => { inicio = inicioEl.value / 10; atualizarTrecho(); if (pre) tocarPre(); });
  // arrastar na onda: o trecho fica centralizado onde o dedo está
  let arrastando = false;
  const moverPara = e => { if (!buf) return; const r = onda.getBoundingClientRect(); inicio = (e.clientX - r.left) / r.width * buf.duration - durTrecho() / 2; atualizarTrecho(); };
  onda.addEventListener('pointerdown', e => { if (!buf) return; arrastando = true; onda.setPointerCapture(e.pointerId); pararPre(); moverPara(e); });
  onda.addEventListener('pointermove', e => { if (arrastando) moverPara(e); });
  const soltarOnda = () => { if (arrastando){ arrastando = false; tocarPre(); } };
  onda.addEventListener('pointerup', soltarOnda); onda.addEventListener('pointercancel', soltarOnda);
  window.addEventListener('resize', desenharOnda);

  function montarLista(){
    lista.innerHTML = '';
    const itens = MUSICAS.map((m, i) => ({ ...m, id: 'm' + i }));
    if (audioProprio) itens.push({ titulo: audioProprio.name.replace(/\.[^.]+$/, ''), sub: 'Do seu celular', id: 'proprio', url: audioProprio.url, inicio: 0 });
    if (!itens.length){
      const p = document.createElement('p'); p.className = 'sem-musica';
      p.textContent = 'Nenhuma música disponível. Use uma música do seu celular.';
      lista.appendChild(p); return;
    }
    itens.forEach(m => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'musica';
      b.setAttribute('aria-pressed', !!escolhida && escolhida.id === m.id);
      const bola = document.createElement('span'); bola.className = 'bola';
      const txt = document.createElement('span'); const t = document.createElement('strong'); t.textContent = m.titulo;
      const s = document.createElement('small'); s.textContent = m.sub || ''; txt.append(t, s);
      b.append(bola, txt);
      b.addEventListener('click', () => {
        if (escolhida && escolhida.id === m.id) return;
        escolhida = m; limparVideo(); montarLista(); carregar(m);
      });
      lista.appendChild(b);
    });
  }
  document.getElementById('audioProprio').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (audioProprio) URL.revokeObjectURL(audioProprio.url);
    audioProprio = { name: f.name, url: URL.createObjectURL(f) };
    escolhida = { id: 'proprio', url: audioProprio.url, inicio: 0 }; limparVideo(); montarLista(); carregar(escolhida); e.target.value = '';
  });
  document.querySelectorAll('.duracao button').forEach(b => b.addEventListener('click', () => {
    duracao = +b.dataset.s; limparVideo(); atualizarTrecho(); if (pre) tocarPre();
    document.querySelectorAll('.duracao button').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  montarLista();

  // ---------- vídeo ----------
  const btnGerar = document.getElementById('gerarVideo'), txtVideo = document.getElementById('txtVideo');
  const btnBaixarVid = document.getElementById('baixarVid'), btnZapVid = document.getElementById('compartilharVid');
  const barra = document.getElementById('barra'), barraIn = document.getElementById('barraIn');
  let gravando = false, video = null;
  function limparVideo(){ if (gravando) return; video = null; btnBaixarVid.hidden = btnZapVid.hidden = true; txtVideo.textContent = 'Gerar vídeo'; }
  inicioEl.addEventListener('change', limparVideo); onda.addEventListener('pointerup', limparVideo);
  function formato(){
    const op = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    if (!window.MediaRecorder) return null;
    return op.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e){ return false; } }) || '';
  }
  btnGerar.addEventListener('click', async () => {
    if (gravando || !precisaFoto()) return;
    if (!escolhida){ status.textContent = 'Escolha uma música (ou use uma do seu celular).'; return; }
    if (!buf){ status.textContent = 'A música ainda está carregando. Tente de novo em instantes.'; return; }
    const tipo = formato();
    if (tipo === null || !tela.captureStream){ status.textContent = 'Este navegador não grava vídeo. Abra o site no Chrome ou no Safari atualizado.'; return; }
    pararPre();
    gravando = true; btnGerar.disabled = true; btnOuvir.disabled = true; inicioEl.disabled = true;
    try {
      const c = audioCtx(); await c.resume();
      const ini = inicio, dur = durTrecho();
      const out = document.createElement('canvas'); out.width = 1080; out.height = 1440;
      const g = out.getContext('2d'); const k = 1080 / W;
      const ganho = c.createGain(), dest = c.createMediaStreamDestination();
      ganho.connect(dest); ganho.connect(c.destination);
      const fonte = c.createBufferSource(); fonte.buffer = buf; fonte.connect(ganho);
      const fluxo = out.captureStream(30);
      dest.stream.getAudioTracks().forEach(t => fluxo.addTrack(t));
      const rec = new MediaRecorder(fluxo, tipo ? { mimeType: tipo, videoBitsPerSecond: 5e6, audioBitsPerSecond: 128e3 } : undefined);
      const partes = []; rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
      const fim = new Promise(r => { rec.onstop = r; });
      pintar(g, k, 1);
      document.getElementById('gravando').hidden = false; barra.hidden = false; barraIn.style.width = '0';
      txtVideo.textContent = 'Gravando…'; status.textContent = 'Gravando… deixe esta tela aberta.';
      rec.start(250);
      const t0 = c.currentTime + 0.05;
      ganho.gain.setValueAtTime(0, t0); ganho.gain.linearRampToValueAtTime(1, t0 + 0.4);
      ganho.gain.setValueAtTime(1, t0 + dur - 1); ganho.gain.linearRampToValueAtTime(0, t0 + dur);
      fonte.start(t0, ini, dur);
      await new Promise(resolve => {
        const quadro = () => {
          const t = Math.max(0, c.currentTime - t0), p = Math.min(1, t / dur);
          pintar(g, k, 1);   // arte parada: só a música toca
          barraIn.style.width = (p * 100).toFixed(1) + '%';
          if (p >= 1) resolve(); else requestAnimationFrame(quadro);
        };
        requestAnimationFrame(quadro);
      });
      rec.stop(); await fim;
      try { fonte.disconnect(); ganho.disconnect(); } catch (e){}
      const mime = (rec.mimeType || tipo || 'video/webm').split(';')[0];
      video = { blob: new Blob(partes, { type: mime }), ext: /mp4/.test(mime) ? 'mp4' : 'webm', mime };
      btnBaixarVid.hidden = false; btnZapVid.hidden = !podeCompartilhar(mime);
      txtVideo.textContent = 'Gerar de novo';
      status.textContent = video.ext === 'mp4' ? 'Vídeo pronto! Baixe ou compartilhe.' : 'Vídeo pronto (formato WebM). Se o WhatsApp não aceitar, gere de novo pelo Chrome atualizado ou pelo Safari do iPhone.';
    } catch (err){
      status.textContent = 'Não consegui gerar o vídeo com essa música. Tente outra música ou outro navegador.';
    } finally {
      gravando = false; btnGerar.disabled = false; btnOuvir.disabled = !buf; inicioEl.disabled = false;
      document.getElementById('gravando').hidden = true; barra.hidden = true;
      if (!video) txtVideo.textContent = 'Gerar vídeo';
    }
  });
  btnBaixarVid.addEventListener('click', () => { if (video) salvar(video.blob, 'to-com-lula-plenaria.' + video.ext, 'Vídeo salvo! No WhatsApp, anexe pela Galeria pra ir como vídeo.'); });
  btnZapVid.addEventListener('click', () => { if (video) compartilhar(video.blob, 'to-com-lula-plenaria.' + video.ext, video.mime); });

  desenhar();
})();
