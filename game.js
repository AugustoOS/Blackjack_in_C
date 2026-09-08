/*
 * Blackjack Training — versão web do jogo em C de Augusto Soares.
 * Mesmas regras do programa original: ás vale 1, figuras valem 10,
 * duas cartas iniciais para cada lado e no máximo 5 compras por rodada.
 */

const MAX_COMPRAS = 5;
const LIMITE = 21;
const PONTOS_MD3 = 2;

const NAIPES = [
  { simbolo: '♠', nome: 'espadas', cor: 'preta' },
  { simbolo: '♣', nome: 'paus', cor: 'preta' },
  { simbolo: '♥', nome: 'copas', cor: 'vermelha' },
  { simbolo: '♦', nome: 'ouros', cor: 'vermelha' },
];

const FIGURAS = [
  { rotulo: 'A', valor: 1, nome: 'ás' },
  { rotulo: '2', valor: 2, nome: '2' },
  { rotulo: '3', valor: 3, nome: '3' },
  { rotulo: '4', valor: 4, nome: '4' },
  { rotulo: '5', valor: 5, nome: '5' },
  { rotulo: '6', valor: 6, nome: '6' },
  { rotulo: '7', valor: 7, nome: '7' },
  { rotulo: '8', valor: 8, nome: '8' },
  { rotulo: '9', valor: 9, nome: '9' },
  { rotulo: '10', valor: 10, nome: '10' },
  { rotulo: 'J', valor: 10, nome: 'valete' },
  { rotulo: 'Q', valor: 10, nome: 'dama' },
  { rotulo: 'K', valor: 10, nome: 'rei' },
];

// parada: o computador compra enquanto estiver abaixo desse valor.
// computadorPrimeiro: ele faz as jogadas dele antes de você, de cartas abertas,
// então você sabe exatamente o que precisa bater.
// contaCartas: em vez de um valor fixo, ele joga contra a sua soma final e
// mede o risco de estourar pelas cartas que ainda restam no baralho.
const DIFICULDADES = {
  facil: { nome: 'Fácil', parada: 14, cartaOculta: false, computadorPrimeiro: true, contaCartas: false },
  medio: { nome: 'Médio', parada: 17, cartaOculta: true, computadorPrimeiro: false, contaCartas: false },
  dificil: { nome: 'Difícil', parada: null, cartaOculta: true, computadorPrimeiro: false, contaCartas: true },
};

const estado = {
  nome: 'Jogador',
  md3: true,
  dificuldade: 'medio',
  placar: { p1: 0, pc: 0 },
  baralho: [],
  maoP1: [],
  maoPC: [],
  compras: 0,
  compradasPC: 0,
  ocultaPC: false,
  vezDoJogador: false,
  emAnimacao: false,
};

const el = (id) => document.getElementById(id);

const ui = {
  telas: document.querySelectorAll('.tela'),
  saudacao: el('saudacao-nome'),
  formNome: el('form-nome'),
  inputNome: el('input-nome'),
  btnIniciar: el('btn-iniciar'),
  btnVoltarInicio: el('btn-voltar-inicio'),
  btnComprar: el('btn-comprar'),
  btnParar: el('btn-parar'),
  btnProxima: el('btn-proxima'),
  btnSair: el('btn-sair'),
  btnRegras: el('btn-regras'),
  btnFecharRegras: el('btn-fechar-regras'),
  btnSom: el('btn-som'),
  dialogo: el('dialogo-regras'),
  placar: el('placar'),
  placarNome: el('placar-nome'),
  placarP1: el('placar-p1'),
  placarPC: el('placar-pc'),
  tagDificuldade: el('tag-dificuldade'),
  mesa: el('mesa'),
  baralho: el('baralho'),
  baralhoContador: el('baralho-contador'),
  ladoP1: el('lado-p1'),
  ladoPC: el('lado-pc'),
  cartasP1: el('cartas-p1'),
  cartasPC: el('cartas-pc'),
  valorP1: el('valor-p1'),
  valorPC: el('valor-pc'),
  nomeJogador: el('nome-jogador'),
  contador: el('contador-compras'),
  dica: el('dica'),
  mensagem: el('mensagem'),
  confete: el('confete'),
};

const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ------------------------------------------------------------------- som
// Todos os sons são sintetizados na hora com a Web Audio API: nenhum arquivo
// externo, nada para carregar.

const som = (() => {
  let ctx = null;
  let mudo = false;

  try { mudo = localStorage.getItem('bj-mudo') === '1'; } catch (_) { /* sem storage */ }

  function contexto() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tom(freq, inicio, duracao, { tipo = 'sine', volume = 0.16 } = {}) {
    const c = contexto();
    if (!c || mudo) return;

    const t = c.currentTime + inicio;
    const osc = c.createOscillator();
    const ganho = c.createGain();

    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);

    osc.connect(ganho).connect(c.destination);
    osc.start(t);
    osc.stop(t + duracao + 0.05);
  }

  function ruido(duracao, { frequencia = 1800, volume = 0.2 } = {}) {
    const c = contexto();
    if (!c || mudo) return;

    const amostras = Math.floor(c.sampleRate * duracao);
    const buffer = c.createBuffer(1, amostras, c.sampleRate);
    const dados = buffer.getChannelData(0);

    for (let i = 0; i < amostras; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / amostras);

    const fonte = c.createBufferSource();
    const filtro = c.createBiquadFilter();
    const ganho = c.createGain();

    fonte.buffer = buffer;
    filtro.type = 'bandpass';
    filtro.frequency.value = frequencia;
    filtro.Q.value = 0.8;
    ganho.gain.value = volume;

    fonte.connect(filtro).connect(ganho).connect(c.destination);
    fonte.start();
  }

  return {
    get mudo() { return mudo; },
    // Cria o contexto (ou o acorda) dentro de um gesto do usuário: no celular
    // ele nasce suspenso e volta a suspender quando a aba vai para segundo plano.
    ativar() { if (!mudo) contexto(); },
    alternar() {
      mudo = !mudo;
      try { localStorage.setItem('bj-mudo', mudo ? '1' : '0'); } catch (_) { /* sem storage */ }
      return mudo;
    },
    carta() { ruido(0.09, { frequencia: 2400, volume: 0.22 }); },
    virar() { ruido(0.07, { frequencia: 1200, volume: 0.18 }); tom(880, 0.06, 0.1, { tipo: 'triangle', volume: 0.07 }); },
    clique() { tom(640, 0, 0.05, { tipo: 'square', volume: 0.04 }); },
    estouro() { tom(220, 0, 0.35, { tipo: 'sawtooth', volume: 0.13 }); tom(150, 0.14, 0.45, { tipo: 'sawtooth', volume: 0.13 }); },
    vitoria() { [523, 659, 784, 1047].forEach((f, i) => tom(f, i * 0.11, 0.28, { tipo: 'triangle' })); },
    derrota() { [330, 262, 196].forEach((f, i) => tom(f, i * 0.2, 0.4, { tipo: 'triangle', volume: 0.13 })); },
    empate() { [440, 440].forEach((f, i) => tom(f, i * 0.18, 0.18, { tipo: 'triangle', volume: 0.11 })); },
    fanfarra() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tom(f, i * 0.12, 0.32, { tipo: 'triangle' })); },
  };
})();

// ------------------------------------------------------------- utilidades

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, movimentoReduzido ? Math.min(ms, 120) : ms));

function mostrarTela(id) {
  ui.telas.forEach((tela) => tela.classList.toggle('tela-ativa', tela.id === id));
}

function mensagem(texto, tipo = '') {
  ui.mensagem.textContent = texto;
  ui.mensagem.className = `mensagem${tipo ? ` ${tipo}` : ''}`;
  // Reinicia a animação mesmo quando a classe já estava aplicada.
  void ui.mensagem.offsetWidth;
  ui.mensagem.classList.add('pop');
}

function pulsar(elemento) {
  elemento.classList.remove('pulsa');
  void elemento.offsetWidth;
  elemento.classList.add('pulsa');
}

const porcentagem = (p) => `${Math.round(p * 100)}%`;

// ---------------------------------------------------------------- baralho

function criarBaralho() {
  const cartas = [];

  for (const naipe of NAIPES) {
    for (const figura of FIGURAS) {
      cartas.push({ ...figura, naipe });
    }
  }

  // Embaralhamento Fisher-Yates: cada carta sai uma única vez por rodada.
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }

  return cartas;
}

const soma = (mao) => mao.reduce((total, carta) => total + carta.valor, 0);

// Chance de a próxima carta estourar a mão, olhando só para as cartas listadas.
function riscoDeEstouro(mao, cartasDesconhecidas) {
  if (cartasDesconhecidas.length === 0) return 0;

  const folga = LIMITE - soma(mao);
  const ruins = cartasDesconhecidas.filter((carta) => carta.valor > folga).length;

  return ruins / cartasDesconhecidas.length;
}

function comprarCarta(mao) {
  if (estado.baralho.length === 0) return null;

  const carta = estado.baralho.pop();
  mao.push(carta);
  atualizarBaralho();

  return carta;
}

// ----------------------------------------------------------------- cartas

function elementoCarta(carta, oculta) {
  const div = document.createElement('div');
  div.className = `carta${oculta ? ' oculta' : ''}`;
  div.dataset.nome = `${carta.nome} de ${carta.naipe.nome}`;
  div.setAttribute('role', 'img');
  div.setAttribute('aria-label', oculta ? 'carta virada para baixo' : div.dataset.nome);

  const interna = document.createElement('div');
  interna.className = 'carta-interna';

  const face = document.createElement('div');
  face.className = `carta-face ${carta.naipe.cor}`;
  face.innerHTML =
    `<span class="carta-canto">${carta.rotulo}${carta.naipe.simbolo}</span>` +
    `<span class="carta-naipe-grande">${carta.naipe.simbolo}</span>` +
    `<span class="carta-canto baixo">${carta.rotulo}${carta.naipe.simbolo}</span>`;

  const verso = document.createElement('div');
  verso.className = 'carta-verso';

  interna.append(face, verso);
  div.append(interna);

  return div;
}

// Coloca a carta na mão e a faz "voar" a partir do monte do baralho.
function adicionarCarta(container, carta, oculta) {
  const elemento = elementoCarta(carta, oculta);
  container.append(elemento);

  const origem = ui.baralho.getBoundingClientRect();
  const destino = elemento.getBoundingClientRect();

  elemento.style.setProperty('--dx', `${origem.left - destino.left}px`);
  elemento.style.setProperty('--dy', `${origem.top - destino.top}px`);
  elemento.classList.add('voando');

  som.carta();

  return elemento;
}

function revelarCartaOculta() {
  const elemento = ui.cartasPC.querySelector('.carta.oculta');
  if (!elemento) return;

  elemento.classList.remove('oculta');
  elemento.setAttribute('aria-label', elemento.dataset.nome);
  estado.ocultaPC = false;
  som.virar();
}

// ------------------------------------------------------------------- tela

function atualizarBaralho() {
  ui.baralhoContador.textContent = estado.baralho.length;
  ui.baralho.classList.toggle('vazio', estado.baralho.length === 0);
}

function atualizarPlacar() {
  ui.placar.classList.toggle('sem-md3', !estado.md3);
  ui.placarNome.textContent = estado.nome;
  ui.placarP1.textContent = estado.placar.p1;
  ui.placarPC.textContent = estado.placar.pc;

  const dif = DIFICULDADES[estado.dificuldade];
  ui.tagDificuldade.textContent = dif.nome;
  ui.tagDificuldade.classList.toggle('tag-dificil', dif.contaCartas);
}

function atualizarJogador() {
  const valor = soma(estado.maoP1);
  const mudou = ui.valorP1.textContent !== String(valor);

  ui.valorP1.textContent = valor;
  if (mudou) pulsar(ui.valorP1);

  ui.ladoP1.classList.toggle('estourou', valor > LIMITE);
  ui.contador.textContent = `Compras: ${estado.compras} de ${MAX_COMPRAS}`;

  atualizarDica();
}

// A dica conta só o que você não viu: o baralho e a carta escondida do computador.
function atualizarDica() {
  const valor = soma(estado.maoP1);

  if (!estado.vezDoJogador || valor >= LIMITE) {
    ui.dica.textContent = '';
    ui.dica.className = 'dica';
    return;
  }

  const desconhecidas = estado.ocultaPC ? [...estado.baralho, estado.maoPC[1]] : estado.baralho;
  const risco = riscoDeEstouro(estado.maoP1, desconhecidas);
  const nivel = risco < 0.3 ? 'baixo' : risco < 0.6 ? 'medio' : 'alto';

  ui.dica.textContent = `Risco de estourar na próxima carta: ${porcentagem(risco)}`;
  ui.dica.className = `dica ${nivel}`;
}

function atualizarComputador() {
  let texto;

  if (estado.ocultaPC) {
    const visiveis = estado.maoPC.filter((_, i) => i !== 1);
    texto = `${soma(visiveis)} + ?`;
  } else {
    texto = String(soma(estado.maoPC));
  }

  if (ui.valorPC.textContent !== texto) {
    ui.valorPC.textContent = texto;
    pulsar(ui.valorPC);
  }

  ui.ladoPC.classList.toggle('estourou', !estado.ocultaPC && soma(estado.maoPC) > LIMITE);
}

function habilitarJogadas(ativo) {
  const semCartas = estado.baralho.length === 0;
  const noLimite = estado.compras >= MAX_COMPRAS;

  ui.btnComprar.hidden = false;
  ui.btnParar.hidden = false;
  ui.btnComprar.disabled = !ativo || noLimite || semCartas;
  ui.btnParar.disabled = !ativo;
  ui.btnProxima.hidden = true;
  ui.btnSair.hidden = true;
}

// ------------------------------------------------------------- fluxo do jogo

async function iniciarRodada() {
  const dif = DIFICULDADES[estado.dificuldade];

  estado.baralho = criarBaralho();
  estado.maoP1 = [];
  estado.maoPC = [];
  estado.compras = 0;
  estado.compradasPC = 0;
  estado.ocultaPC = dif.cartaOculta;
  estado.vezDoJogador = false;
  estado.emAnimacao = true;

  ui.nomeJogador.textContent = estado.nome;
  ui.ladoP1.className = 'lado';
  ui.ladoPC.className = 'lado';
  ui.mesa.className = 'mesa';
  ui.valorPC.textContent = '?';
  ui.valorP1.textContent = '0';
  ui.cartasP1.replaceChildren();
  ui.cartasPC.replaceChildren();

  atualizarBaralho();
  atualizarPlacar();
  atualizarJogador();
  habilitarJogadas(false);
  mostrarTela('tela-jogo');
  mensagem('Distribuindo as cartas...');

  // Duas cartas para cada lado, alternadas: a segunda do computador pode ficar escondida.
  for (let i = 0; i < 4; i++) {
    await espera(420);

    if (i % 2 === 0) {
      const carta = comprarCarta(estado.maoP1);
      adicionarCarta(ui.cartasP1, carta, false);
      atualizarJogador();
    } else {
      const carta = comprarCarta(estado.maoPC);
      adicionarCarta(ui.cartasPC, carta, i === 3 && dif.cartaOculta);
      atualizarComputador();
    }
  }

  await espera(300);

  let aviso;

  if (dif.computadorPrimeiro) {
    // Fácil: o computador joga antes, de cartas abertas, e você sabe o alvo.
    mensagem('Vez do computador', 'pensando');
    await espera(600);
    await comprasDoComputador(dif, null);

    const valorPC = soma(estado.maoPC);

    aviso = valorPC > LIMITE
      ? `O computador estourou com ${valorPC}! Sua vez, ${estado.nome}: basta parar sem estourar.`
      : `O computador parou em ${valorPC}. Sua vez, ${estado.nome}: bata esse valor!`;
  } else if (dif.cartaOculta) {
    aviso = `Sua vez, ${estado.nome}! O computador mostra ${soma([estado.maoPC[0]])} e guarda uma carta.`;
  } else {
    aviso = `Sua vez, ${estado.nome}! O computador está com ${soma(estado.maoPC)}.`;
  }

  estado.vezDoJogador = true;
  estado.emAnimacao = false;
  atualizarJogador();
  mensagem(aviso, 'destaque');
  habilitarJogadas(true);
}

function comprar() {
  if (estado.emAnimacao || !estado.vezDoJogador || estado.compras >= MAX_COMPRAS) return;

  const carta = comprarCarta(estado.maoP1);

  if (!carta) {
    mensagem('O baralho acabou. Suas jogadas terminaram aqui.');
    parar();
    return;
  }

  estado.compras++;
  adicionarCarta(ui.cartasP1, carta, false);
  atualizarJogador();

  const valor = soma(estado.maoP1);

  if (valor > LIMITE) {
    som.estouro();
    vibrar([60, 40, 90]);
    mensagem(`Você recebeu um(a) ${carta.nome} de ${carta.naipe.nome} e estourou com ${valor}!`, 'derrota');
    parar();
    return;
  }

  if (valor === LIMITE) {
    mensagem(`${carta.nome} de ${carta.naipe.nome}: 21 em cheio!`, 'vitoria');
    parar();
    return;
  }

  mensagem(`Você recebeu um(a) ${carta.nome} de ${carta.naipe.nome}. Sua soma agora é ${valor}.`);

  if (estado.compras >= MAX_COMPRAS) {
    mensagem(`${carta.nome} de ${carta.naipe.nome}: você chegou ao limite de ${MAX_COMPRAS} compras com ${valor}.`);
    parar();
    return;
  }

  if (estado.baralho.length === 0) {
    parar();
    return;
  }

  habilitarJogadas(true);
}

async function parar() {
  if (estado.emAnimacao || !estado.vezDoJogador) return;

  estado.vezDoJogador = false;
  estado.emAnimacao = true;
  habilitarJogadas(false);
  atualizarDica();

  await espera(700);

  // No Fácil o computador já jogou: vai direto para o resultado.
  if (DIFICULDADES[estado.dificuldade].computadorPrimeiro) resultado();
  else await jogadaComputador();
}

// Decide se o computador compra mais uma carta. valorP1 é null enquanto
// você ainda não jogou (só acontece quando ele joga primeiro, sem contar cartas).
function computadorCompra(dif, valorPC, valorP1) {
  if (valorPC > LIMITE) return false;
  if (!dif.contaCartas) return valorPC < dif.parada;

  // Difícil: joga contra a sua mão e mede o risco pelas cartas que restam.
  if (valorP1 > LIMITE) return false;
  if (valorPC < valorP1) return true;
  if (valorPC > valorP1) return false;

  return riscoDeEstouro(estado.maoPC, estado.baralho) < 0.5;
}

// Laço de compras do computador, com uma carta animada por vez.
async function comprasDoComputador(dif, valorP1) {
  while (estado.baralho.length > 0 && computadorCompra(dif, soma(estado.maoPC), valorP1)) {
    await espera(650);

    const carta = comprarCarta(estado.maoPC);
    adicionarCarta(ui.cartasPC, carta, false);
    estado.compradasPC++;
    atualizarComputador();

    if (soma(estado.maoPC) > LIMITE) {
      som.estouro();
      break;
    }
  }

  await espera(600);
}

async function jogadaComputador() {
  const dif = DIFICULDADES[estado.dificuldade];

  mensagem('Vez do computador', 'pensando');
  await espera(600);

  if (estado.ocultaPC) {
    revelarCartaOculta();
    atualizarComputador();
    await espera(850);
  }

  await comprasDoComputador(dif, soma(estado.maoP1));
  resultado();
}

function resultado() {
  const compradasPC = estado.compradasPC;
  const valorP1 = soma(estado.maoP1);
  const valorPC = soma(estado.maoPC);
  const estourouP1 = valorP1 > LIMITE;
  const estourouPC = valorPC > LIMITE;

  let desfecho;

  if (valorP1 === valorPC || (estourouP1 && estourouPC)) desfecho = 'empate';
  else if ((!estourouP1 && valorP1 > valorPC) || (!estourouP1 && estourouPC)) desfecho = 'vitoria';
  else desfecho = 'derrota';

  const plural = compradasPC === 1 ? 'carta' : 'cartas';
  const jogadaPC = compradasPC === 0 ? 'não comprou nenhuma carta' : `comprou ${compradasPC} ${plural}`;

  if (desfecho === 'empate') {
    const texto = estourouP1 && estourouPC
      ? `Empate! Os dois estouraram — você com ${valorP1} e o computador com ${valorPC}.`
      : `Empate! Os dois fizeram ${valorP1}. O computador ${jogadaPC}.`;

    // No empate ninguém pontua: na melhor de três a rodada é repetida.
    som.empate();
    mensagem(texto, 'destaque');
  } else if (desfecho === 'vitoria') {
    ui.ladoP1.classList.add('vencedor');
    ui.mesa.classList.add('vitoria');
    estado.placar.p1 += estado.md3 ? 1 : 0;

    const detalhe = estourouPC
      ? `O computador ${jogadaPC} e estourou com ${valorPC}.`
      : `${valorP1} contra ${valorPC} — o computador ${jogadaPC}.`;

    som.vitoria();
    vibrar([40, 30, 40]);
    if (!movimentoReduzido) confete();
    mensagem(`Você ganhou! ${detalhe}`, 'vitoria');
  } else {
    ui.ladoPC.classList.add('vencedor');
    ui.mesa.classList.add('derrota');
    estado.placar.pc += estado.md3 ? 1 : 0;

    const detalhe = estourouP1
      ? `Você estourou com ${valorP1} e o computador ficou com ${valorPC}.`
      : `${valorPC} contra ${valorP1} — o computador ${jogadaPC}.`;

    som.derrota();
    mensagem(`Você perdeu. ${detalhe}`, 'derrota');
  }

  atualizarPlacar();
  estado.emAnimacao = false;
  finalizarRodada(desfecho);
}

function finalizarRodada(desfecho) {
  ui.btnComprar.hidden = true;
  ui.btnParar.hidden = true;
  ui.btnProxima.hidden = false;
  ui.btnSair.hidden = false;
  delete ui.btnProxima.dataset.reiniciarPlacar;

  if (!estado.md3) {
    rotularProxima('Jogar de novo');
    return;
  }

  if (estado.placar.p1 >= PONTOS_MD3 || estado.placar.pc >= PONTOS_MD3) {
    const venceu = estado.placar.p1 >= PONTOS_MD3;

    if (venceu) {
      som.fanfarra();
      if (!movimentoReduzido) confete();
    }

    mensagem(
      venceu
        ? `Parabéns!!! Você ganhou a melhor de três por ${estado.placar.p1} a ${estado.placar.pc}!`
        : `Que pena... Você perdeu a melhor de três por ${estado.placar.pc} a ${estado.placar.p1}.`,
      venceu ? 'vitoria' : 'derrota',
    );

    rotularProxima('Jogar outra melhor de três');
    ui.btnProxima.dataset.reiniciarPlacar = 'sim';
    return;
  }

  rotularProxima(desfecho === 'empate' ? 'Repetir a rodada' : 'Próxima rodada');
}

function rotularProxima(texto) {
  ui.btnProxima.innerHTML = `${texto} <kbd>N</kbd>`;
}

// ---------------------------------------------------------------- confete

function confete() {
  const canvas = ui.confete;
  const ctx = canvas.getContext('2d');
  const escala = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(window.innerWidth * escala);
  canvas.height = Math.floor(window.innerHeight * escala);
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  canvas.hidden = false;

  const largura = window.innerWidth;
  const altura = window.innerHeight;
  const cores = ['#e6c15c', '#f4f1e8', '#6ee7a8', '#d0403c', '#7fb3ff'];
  const particulas = Array.from({ length: largura < 600 ? 90 : 140 }, () => ({
    x: Math.random() * largura,
    y: -20 - Math.random() * altura * 0.4,
    vx: (Math.random() - 0.5) * 2.5,
    vy: 2 + Math.random() * 3.5,
    largura: 6 + Math.random() * 6,
    altura: 8 + Math.random() * 8,
    angulo: Math.random() * Math.PI,
    giro: (Math.random() - 0.5) * 0.25,
    cor: cores[Math.floor(Math.random() * cores.length)],
  }));

  const inicio = performance.now();
  const duracao = 2800;

  function quadro(agora) {
    const passado = agora - inicio;
    const fade = Math.max(0, 1 - Math.max(0, passado - 2000) / 800);

    ctx.clearRect(0, 0, largura, altura);

    for (const p of particulas) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.angulo += p.giro;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angulo);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.cor;
      ctx.fillRect(-p.largura / 2, -p.altura / 2, p.largura, p.altura);
      ctx.restore();
    }

    if (passado < duracao) {
      requestAnimationFrame(quadro);
    } else {
      ctx.clearRect(0, 0, largura, altura);
      canvas.hidden = true;
    }
  }

  requestAnimationFrame(quadro);
}

// ------------------------------------------------------------------ eventos

function atualizarBotaoSom() {
  ui.btnSom.textContent = som.mudo ? '🔇' : '🔊';
  ui.btnSom.setAttribute('aria-pressed', String(som.mudo));
}

ui.formNome.addEventListener('submit', (evento) => {
  evento.preventDefault();

  estado.nome = ui.inputNome.value.trim().slice(0, 20) || 'Jogador';
  ui.saudacao.textContent = estado.nome;
  mostrarTela('tela-opcoes');
});

ui.btnVoltarInicio.addEventListener('click', () => mostrarTela('tela-inicio'));

ui.btnIniciar.addEventListener('click', () => {
  estado.md3 = document.querySelector('input[name="md3"]:checked').value === 'sim';
  estado.dificuldade = document.querySelector('input[name="dificuldade"]:checked').value;
  estado.placar = { p1: 0, pc: 0 };
  iniciarRodada();
});

ui.btnComprar.addEventListener('click', comprar);
ui.btnParar.addEventListener('click', parar);

ui.btnProxima.addEventListener('click', () => {
  if (ui.btnProxima.dataset.reiniciarPlacar === 'sim' || !estado.md3) {
    estado.placar = { p1: 0, pc: 0 };
  }

  iniciarRodada();
});

ui.btnSair.addEventListener('click', () => {
  estado.placar = { p1: 0, pc: 0 };
  ui.mesa.className = 'mesa';
  mostrarTela('tela-opcoes');
});

ui.btnRegras.addEventListener('click', () => ui.dialogo.showModal());
ui.btnFecharRegras.addEventListener('click', () => ui.dialogo.close());

ui.btnSom.addEventListener('click', () => {
  som.alternar();
  atualizarBotaoSom();
  if (!som.mudo) som.clique();
});

// O navegador só libera áudio depois de um gesto do usuário. O Safari do iPhone
// só aceita touchend/click (touchstart não conta), e suspende o contexto sempre
// que a aba sai de foco — por isso o desbloqueio é repetido a cada toque.
for (const evento of ['touchend', 'pointerup', 'click', 'keydown']) {
  document.addEventListener(evento, () => som.ativar(), { passive: true });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') som.ativar();
});

// Vibração curta em quem tem (Android): estouro e vitória.
function vibrar(padrao) {
  if (typeof navigator.vibrate === 'function' && !movimentoReduzido) navigator.vibrate(padrao);
}

document.addEventListener('click', (evento) => {
  if (evento.target.closest('.btn') && evento.target.closest('.btn') !== ui.btnSom) som.clique();
});

// Atalhos de teclado: só valem na tela do jogo e com o diálogo fechado.
document.addEventListener('keydown', (evento) => {
  if (ui.dialogo.open || !el('tela-jogo').classList.contains('tela-ativa')) return;
  if (evento.altKey || evento.ctrlKey || evento.metaKey) return;

  const tecla = evento.key.toLowerCase();

  if ((tecla === 'c' || tecla === ' ') && !ui.btnComprar.hidden && !ui.btnComprar.disabled) {
    evento.preventDefault();
    ui.btnComprar.click();
  } else if (tecla === 'p' && !ui.btnParar.hidden && !ui.btnParar.disabled) {
    evento.preventDefault();
    ui.btnParar.click();
  } else if ((tecla === 'n' || tecla === 'enter') && !ui.btnProxima.hidden) {
    evento.preventDefault();
    ui.btnProxima.click();
  }
});

atualizarBotaoSom();
