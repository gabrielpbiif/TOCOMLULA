'use strict';
(() => {
  // Medidas da arte (pixels do modelo 2418×3224)
  const W = 2418, H = 3224;
  const CIRC = { x: 1208, y: 1388, r: 779 };   // buraco transparente da foto
  // Lista de músicas: arquivos publicados junto com a página (pasta musicas/). inicio = segundo em que o vídeo começa a tocar.
  // >>> MÚSICAS: coloque os arquivos .mp3/.m4a na pasta musicas/ e adicione uma linha por música.
  // titulo = nome que aparece; sub = linha pequena embaixo; arquivo = nome do arquivo; inicio = segundo em que começa a tocar.
  const MUSICAS = [
    // { titulo: 'Nome da música', sub: 'Jingle Lula 2026', arquivo: 'musica1.mp3', inicio: 0 },
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
  let escolhida = null, audioProprio = null, tocando = null, duracao = 15;
  const ouvinte = new Audio();
  function montarLista(){
    lista.innerHTML = '';
    const itens = MUSICAS.map((m, i) => ({ ...m, id: 'm' + i }));
    if (audioProprio) itens.push({ titulo: audioProprio.name.replace(/\.[^.]+$/, ''), sub: 'Do seu celular', id: 'proprio', url: audioProprio.url, inicio: 0 });
    if (!itens.length){
      const p = document.createElement('p'); p.className = 'sem-musica';
      p.textContent = 'As músicas da campanha entram aqui em breve. Enquanto isso, use uma música do seu celular.';
      lista.appendChild(p); return;
    }
    if (!escolhida || !itens.some(m => m.id === escolhida.id)) escolhida = itens[0];
    itens.forEach(m => {
      const b = document.createElement('div'); b.className = 'musica'; b.setAttribute('role', 'button'); b.tabIndex = 0;
      b.setAttribute('aria-pressed', escolhida.id === m.id);
      const bola = document.createElement('span'); bola.className = 'bola';
      const txt = document.createElement('span'); const t = document.createElement('strong'); t.textContent = m.titulo;
      const s = document.createElement('small'); s.textContent = m.sub || ''; txt.append(t, s);
      const ou = document.createElement('button'); ou.type = 'button'; ou.className = 'ouvir';
      ou.textContent = tocando === m.id ? '■ Parar' : '▶ Ouvir';
      ou.addEventListener('click', ev => {
        ev.stopPropagation();
        if (tocando === m.id){ ouvinte.pause(); tocando = null; }
        else { ouvinte.src = m.url; ouvinte.currentTime = m.inicio || 0; ouvinte.play().catch(() => {}); tocando = m.id; }
        montarLista();
      });
      const pick = () => { escolhida = m; limparVideo(); montarLista(); };
      b.addEventListener('click', pick);
      b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); pick(); } });
      b.append(bola, txt, ou); lista.appendChild(b);
    });
  }
  ouvinte.addEventListener('ended', () => { tocando = null; montarLista(); });
  document.getElementById('audioProprio').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (audioProprio) URL.revokeObjectURL(audioProprio.url);
    audioProprio = { name: f.name, url: URL.createObjectURL(f) };
    escolhida = { id: 'proprio', url: audioProprio.url, inicio: 0 }; limparVideo(); montarLista(); e.target.value = '';
  });
  document.querySelectorAll('.duracao button').forEach(b => b.addEventListener('click', () => {
    duracao = +b.dataset.s; limparVideo();
    document.querySelectorAll('.duracao button').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  montarLista();

  // ---------- vídeo ----------
  const btnGerar = document.getElementById('gerarVideo'), txtVideo = document.getElementById('txtVideo');
  const btnBaixarVid = document.getElementById('baixarVid'), btnZapVid = document.getElementById('compartilharVid');
  const barra = document.getElementById('barra'), barraIn = document.getElementById('barraIn');
  let gravando = false, video = null;
  function limparVideo(){ if (gravando) return; video = null; btnBaixarVid.hidden = btnZapVid.hidden = true; txtVideo.textContent = 'Gerar vídeo'; }
  function formato(){
    const op = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    if (!window.MediaRecorder) return null;
    return op.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e){ return false; } }) || '';
  }
  btnGerar.addEventListener('click', async () => {
    if (gravando || !precisaFoto()) return;
    if (!escolhida){ status.textContent = 'Escolha uma música (ou use uma do seu celular).'; return; }
    const tipo = formato();
    if (tipo === null || !tela.captureStream){ status.textContent = 'Este navegador não grava vídeo. Abra o site no Chrome ou no Safari atualizado.'; return; }
    ouvinte.pause(); tocando = null; montarLista();
    gravando = true; btnGerar.disabled = true; txtVideo.textContent = 'Preparando…';
    status.textContent = 'Carregando a música…';
    let ac;
    try {
      const resp = await fetch(escolhida.url); if (!resp.ok) throw new Error('fetch');
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ac.decodeAudioData(await resp.arrayBuffer());
      const ini = Math.min(escolhida.inicio || 0, Math.max(0, buf.duration - 1));
      const dur = Math.min(duracao, buf.duration - ini);

      // canvas de saída 1080×1440 (mesma proporção da arte)
      const out = document.createElement('canvas'); out.width = 1080; out.height = 1440;
      const g = out.getContext('2d'); const k = 1080 / W;
      const ganho = ac.createGain(), dest = ac.createMediaStreamDestination();
      ganho.connect(dest); ganho.connect(ac.destination);
      const fonte = ac.createBufferSource(); fonte.buffer = buf; fonte.connect(ganho);
      const fluxo = out.captureStream(30);
      dest.stream.getAudioTracks().forEach(t => fluxo.addTrack(t));
      const rec = new MediaRecorder(fluxo, tipo ? { mimeType: tipo, videoBitsPerSecond: 5e6, audioBitsPerSecond: 128e3 } : undefined);
      const partes = []; rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
      const fim = new Promise(r => { rec.onstop = r; });

      pintar(g, k, 1);
      document.getElementById('gravando').hidden = false; barra.hidden = false; barraIn.style.width = '0';
      txtVideo.textContent = 'Gravando…'; status.textContent = 'Gravando… deixe esta tela aberta.';
      rec.start(250);
      const t0 = ac.currentTime + 0.05;
      ganho.gain.setValueAtTime(1, t0); ganho.gain.setValueAtTime(1, t0 + dur - 1); ganho.gain.linearRampToValueAtTime(0, t0 + dur);
      fonte.start(t0, ini, dur);
      await new Promise(resolve => {
        const quadro = () => {
          const t = Math.max(0, ac.currentTime - t0), p = Math.min(1, t / dur);
          // aproximação lenta + leve batida a cada 0,5 s
          const pulso = 1 + 0.08 * p + 0.012 * Math.max(0, Math.cos(t * Math.PI * 4));
          pintar(g, k, pulso);
          barraIn.style.width = (p * 100).toFixed(1) + '%';
          if (p >= 1) resolve(); else requestAnimationFrame(quadro);
        };
        requestAnimationFrame(quadro);
      });
      rec.stop(); await fim;
      fonte.disconnect(); ac.close().catch(() => {});
      const mime = (rec.mimeType || tipo || 'video/webm').split(';')[0];
      video = { blob: new Blob(partes, { type: mime }), ext: /mp4/.test(mime) ? 'mp4' : 'webm', mime };
      btnBaixarVid.hidden = false; btnZapVid.hidden = !podeCompartilhar(mime);
      txtVideo.textContent = 'Gerar de novo';
      status.textContent = video.ext === 'mp4' ? 'Vídeo pronto! Baixe ou compartilhe.' : 'Vídeo pronto (formato WebM). Se o WhatsApp não aceitar, gere de novo pelo Chrome atualizado ou pelo Safari do iPhone.';
    } catch (err){
      status.textContent = 'Não consegui gerar o vídeo com essa música. Tente outra música ou outro navegador.';
      if (ac) ac.close().catch(() => {});
    } finally {
      gravando = false; btnGerar.disabled = false; document.getElementById('gravando').hidden = true; barra.hidden = true;
      if (!video) txtVideo.textContent = 'Gerar vídeo';
    }
  });
  btnBaixarVid.addEventListener('click', () => { if (video) salvar(video.blob, 'to-com-lula-plenaria.' + video.ext, 'Vídeo salvo! No WhatsApp, anexe pela Galeria pra ir como vídeo.'); });
  btnZapVid.addEventListener('click', () => { if (video) compartilhar(video.blob, 'to-com-lula-plenaria.' + video.ext, video.mime); });

  desenhar();
})();
