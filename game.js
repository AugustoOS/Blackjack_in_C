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

const PARADA_PC = { facil: 14, medio: 17, dificil: 19 };

const estado = {
  nome: 'Jogador',
  md3: true,
  dificuldade: 'medio',
  placar: { p1: 0, pc: 0 },
  baralho: [],
  maoP1: [],
  maoPC: [],
  compras: 0,
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
  dialogo: el('dialogo-regras'),
  placar: el('placar'),
  placarNome: el('placar-nome'),
  placarP1: el('placar-p1'),
  placarPC: el('placar-pc'),
  ladoP1: el('lado-p1'),
  ladoPC: el('lado-pc'),
  cartasP1: el('cartas-p1'),
  cartasPC: el('cartas-pc'),
  valorP1: el('valor-p1'),
  valorPC: el('valor-pc'),
  nomeJogador: el('nome-jogador'),
  contador: el('contador-compras'),
  mensagem: el('mensagem'),
};

// ------------------------------------------------------------- utilidades

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mostrarTela(id) {
  ui.telas.forEach((tela) => tela.classList.toggle('tela-ativa', tela.id === id));
}

function mensagem(texto, tipo = '') {
  ui.mensagem.textContent = texto;
  ui.mensagem.className = `mensagem${tipo ? ` ${tipo}` : ''}`;
}

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

function comprarCarta(mao) {
  if (estado.baralho.length === 0) return null;

  const carta = estado.baralho.pop();
  mao.push(carta);

  return carta;
}

// ----------------------------------------------------------------- cartas

function elementoCarta(carta, oculta) {
  const div = document.createElement('div');
  div.className = `carta${oculta ? ' oculta' : ''}`;
  div.setAttribute('role', 'img');
  div.setAttribute('aria-label', oculta ? 'carta virada para baixo' : `${carta.nome} de ${carta.naipe.nome}`);

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

function desenharMao(container, mao, ocultas) {
  container.replaceChildren();
  mao.forEach((carta) => container.append(elementoCarta(carta, ocultas)));
}

function atualizarPlacar() {
  ui.placar.hidden = !estado.md3;
  ui.placarNome.textContent = estado.nome;
  ui.placarP1.textContent = estado.placar.p1;
  ui.placarPC.textContent = estado.placar.pc;
}

function atualizarJogador() {
  const valor = soma(estado.maoP1);

  ui.valorP1.textContent = valor;
  ui.ladoP1.classList.toggle('estourou', valor > LIMITE);
  ui.contador.textContent = `Compras: ${estado.compras} de ${MAX_COMPRAS}`;
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
  estado.baralho = criarBaralho();
  estado.maoP1 = [];
  estado.maoPC = [];
  estado.compras = 0;
  estado.emAnimacao = true;

  ui.nomeJogador.textContent = estado.nome;
  ui.ladoP1.className = 'lado';
  ui.ladoPC.className = 'lado';
  ui.valorPC.textContent = '?';
  ui.cartasP1.replaceChildren();
  ui.cartasPC.replaceChildren();

  atualizarPlacar();
  atualizarJogador();
  habilitarJogadas(false);
  mostrarTela('tela-jogo');
  mensagem('Distribuindo as cartas...');

  // Duas cartas para cada lado, alternadas, como na distribuição original.
  for (let i = 0; i < 4; i++) {
    await espera(420);

    if (i % 2 === 0) {
      comprarCarta(estado.maoP1);
      desenharMao(ui.cartasP1, estado.maoP1, false);
      atualizarJogador();
    } else {
      comprarCarta(estado.maoPC);
      desenharMao(ui.cartasPC, estado.maoPC, true);
    }
  }

  await jogadaComputador();
}

async function jogadaComputador() {
  const parada = PARADA_PC[estado.dificuldade];
  let compradas = 0;

  mensagem('Jogada do computador...');
  await espera(700);

  while (soma(estado.maoPC) < parada && estado.baralho.length > 0) {
    comprarCarta(estado.maoPC);
    desenharMao(ui.cartasPC, estado.maoPC, true);
    compradas++;
    await espera(450);
  }

  const plural = compradas === 1 ? 'carta' : 'cartas';

  mensagem(
    `O computador comprou ${compradas} ${plural} e terminou suas jogadas. Agora é sua vez, ${estado.nome}!`,
    'destaque',
  );

  estado.emAnimacao = false;
  habilitarJogadas(true);
}

function comprar() {
  if (estado.emAnimacao || estado.compras >= MAX_COMPRAS) return;

  const carta = comprarCarta(estado.maoP1);

  if (!carta) {
    mensagem('O baralho acabou. Suas jogadas terminaram aqui.');
    parar();
    return;
  }

  estado.compras++;
  desenharMao(ui.cartasP1, estado.maoP1, false);
  atualizarJogador();

  const valor = soma(estado.maoP1);

  mensagem(`Você recebeu um(a) ${carta.nome} de ${carta.naipe.nome}. Sua soma agora é ${valor}.`);

  // O jogador para sozinho ao atingir 21, ao estourar ou ao chegar no limite de compras.
  if (valor >= LIMITE || estado.compras >= MAX_COMPRAS || estado.baralho.length === 0) {
    parar();
    return;
  }

  habilitarJogadas(true);
}

async function parar() {
  if (estado.emAnimacao) return;

  estado.emAnimacao = true;
  habilitarJogadas(false);

  const valorP1 = soma(estado.maoP1);

  mensagem(`Você finalizou suas jogadas com ${valorP1}. E agora, o resultado...`);

  desenharMao(ui.cartasPC, estado.maoPC, false);
  await espera(900);

  ui.valorPC.textContent = soma(estado.maoPC);
  ui.ladoPC.classList.toggle('estourou', soma(estado.maoPC) > LIMITE);

  await espera(500);
  resultado();
}

function resultado() {
  const valorP1 = soma(estado.maoP1);
  const valorPC = soma(estado.maoPC);
  const estourouP1 = valorP1 > LIMITE;
  const estourouPC = valorPC > LIMITE;

  let desfecho;

  if (valorP1 === valorPC || (estourouP1 && estourouPC)) desfecho = 'empate';
  else if ((!estourouP1 && valorP1 > valorPC) || (!estourouP1 && estourouPC)) desfecho = 'vitoria';
  else desfecho = 'derrota';

  if (desfecho === 'empate') {
    const texto = estourouP1 && estourouPC
      ? `Vocês empataram! Ambos ultrapassaram 21 — você fez ${valorP1} e o computador ${valorPC}.`
      : `Vocês empataram! Ambos tiveram a soma de ${valorP1}.`;

    // No empate ninguém pontua: na melhor de três a rodada é repetida.
    mensagem(texto, 'destaque');
  } else if (desfecho === 'vitoria') {
    ui.ladoP1.classList.add('vencedor');
    estado.placar.p1 += estado.md3 ? 1 : 0;
    mensagem(`Você ganhou! O computador fez ${valorPC} e você fez ${valorP1}.`, 'vitoria');
  } else {
    ui.ladoPC.classList.add('vencedor');
    estado.placar.pc += estado.md3 ? 1 : 0;
    mensagem(`Você perdeu! O computador fez ${valorPC} e você fez ${valorP1}.`, 'derrota');
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

  if (!estado.md3) {
    ui.btnProxima.textContent = 'Jogar de novo';
    return;
  }

  if (estado.placar.p1 >= PONTOS_MD3 || estado.placar.pc >= PONTOS_MD3) {
    const venceu = estado.placar.p1 >= PONTOS_MD3;

    mensagem(
      venceu
        ? `Parabéns!!! Você ganhou a melhor de três por ${estado.placar.p1} a ${estado.placar.pc}!`
        : `Que pena... Você perdeu a melhor de três por ${estado.placar.pc} a ${estado.placar.p1}.`,
      venceu ? 'vitoria' : 'derrota',
    );

    ui.btnProxima.textContent = 'Jogar outra melhor de três';
    ui.btnProxima.dataset.reiniciarPlacar = 'sim';
    return;
  }

  ui.btnProxima.textContent = desfecho === 'empate' ? 'Repetir a rodada' : 'Próxima rodada';
  delete ui.btnProxima.dataset.reiniciarPlacar;
}

// ------------------------------------------------------------------ eventos

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
    delete ui.btnProxima.dataset.reiniciarPlacar;
  }

  iniciarRodada();
});

ui.btnSair.addEventListener('click', () => {
  estado.placar = { p1: 0, pc: 0 };
  mostrarTela('tela-opcoes');
});

ui.btnRegras.addEventListener('click', () => ui.dialogo.showModal());
ui.btnFecharRegras.addEventListener('click', () => ui.dialogo.close());
