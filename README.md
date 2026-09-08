# Blackjack_in_C

Jogo de BlackJack ("Vinte e Um") desenvolvido em C, agora também com uma interface web.

**Jogue online:** https://augustoos.github.io/Blackjack_in_C/

## Regras usadas

São as mesmas do programa original:

- O ás vale **1**; 10, J, Q e K valem **10**.
- Cada lado recebe **2 cartas** no início da rodada.
- Você pode comprar no máximo **5 cartas** por rodada.
- Vence a maior soma que não passar de 21; somas iguais (ou os dois estourando) dão empate.
- Melhor de três opcional: vence quem fizer 2 pontos, e empates repetem a rodada.

### Dificuldades

| Modo | Como o computador joga | Vitórias do jogador* |
|------|------------------------|----------------------|
| **Fácil** | Joga primeiro, de cartas abertas, e compra até chegar a 14. Você sabe o valor exato que precisa bater. | ~53% |
| **Médio** | Guarda uma carta escondida. Depois que você para, revela e compra até 17, como um crupiê. | ~43% |
| **Difícil** | Conhece a sua soma final e conta as cartas que já saíram: só compra quando está atrás, e se você estourar ele nem arrisca. | ~34% |

\* Simulação de 4 000 rodadas com um jogador que compra enquanto o risco de estourar é menor que 40%.

A versão web também mostra o **risco de estourar** na próxima carta, calculado só com as cartas
que você ainda não viu — é, afinal, um jogo de treino.

## Versão web

Site estático, sem dependências: `index.html`, `styles.css` e `game.js`. Os sons são sintetizados
com a Web Audio API (nada para baixar) e podem ser desligados no botão 🔊. Atalhos: `C` compra,
`P` para, `N` próxima rodada.

Para rodar localmente:

```sh
python3 -m http.server 8000
# abra http://localhost:8000
```

O GitHub Pages publica direto da branch `main` (raiz do repositório), então todo push na `main`
atualiza o site. O `.nojekyll` desliga o processamento do Jekyll, que não é necessário aqui.

## Versão em C (terminal)

```sh
gcc -std=c11 -Wall -o blackjack Blackjack.c
./blackjack
```

Usa `sleep()` de `<unistd.h>`, portanto roda em Linux/macOS (ou WSL no Windows).

## Correções feitas no `Blackjack.c`

- **Baralho não era reembaralhado entre rodadas:** `baralho()` declarava um vetor `cartas` local que sombreava o global, então as cartas usadas nunca voltavam. Na melhor de três a segunda rodada jogava com um baralho quase vazio e o programa podia travar.
- **Laço infinito na dificuldade Difícil:** o sorteio do computador aceitava apenas A, 2, 3 e 4 sem verificar cartas já usadas — esgotadas as 16 cartas baixas, o `do/while` nunca terminava.
- **`gets()`:** substituído por `fgets()` com corte do `\n`, eliminando o estouro de buffer.
- **Estouro de buffer nas mãos:** `CSP1`/`CSPC` tinham 15 posições e podiam receber mais cartas do que isso.
- **`sleep()` sem declaração:** faltava `#include <unistd.h>`.
- **Limite de 5 compras:** a regra existia no texto mas não era aplicada no código.
- **Empate na melhor de três:** a partida terminava sem vencedor; agora a rodada é repetida.
- **Placar não zerava:** ao começar uma nova melhor de três o placar anterior continuava valendo.
- **Codificação:** arquivo convertido de ISO-8859-1 para UTF-8 (os acentos apareciam corrompidos).

Feito por Augusto Soares.
