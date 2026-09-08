# Blackjack_in_C

Jogo de BlackJack ("Vinte e Um") desenvolvido em C, agora também com uma interface web.

**Jogue online:** https://augustoos.github.io/Blackjack_in_C/

## Regras usadas

São as mesmas do programa original:

- O ás vale **1**; 10, J, Q e K valem **10**.
- Cada lado recebe **2 cartas** no início da rodada.
- Você pode comprar no máximo **5 cartas** por rodada.
- O computador joga primeiro e você só vê a pontuação dele ao finalizar suas jogadas.
- Vence a maior soma que não passar de 21; somas iguais (ou os dois estourando) dão empate.
- Dificuldade define até quando o computador compra: **Fácil** para em 14, **Médio** em 17, **Difícil** em 19.

## Versão web

Site estático, sem dependências: `index.html`, `styles.css` e `game.js`. Para rodar localmente:

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
- **Laço infinito na dificuldade Difícil:** o sorteio do computador aceitava apenas A, 2, 3 e 4 sem verificar cartas já usadas — esgotadas as 16 cartas baixas, o `do/while` nunca terminava. O computador agora compra do baralho normalmente até o limite da dificuldade.
- **`gets()`:** substituído por `fgets()` com corte do `\n`, eliminando o estouro de buffer.
- **Estouro de buffer nas mãos:** `CSP1`/`CSPC` tinham 15 posições e podiam receber mais cartas do que isso.
- **`sleep()` sem declaração:** faltava `#include <unistd.h>`.
- **Limite de 5 compras:** a regra existia no texto mas não era aplicada no código.
- **Empate na melhor de três:** a partida terminava sem vencedor; agora a rodada é repetida.
- **Placar não zerava:** ao começar uma nova melhor de três o placar anterior continuava valendo.
- **Codificação:** arquivo convertido de ISO-8859-1 para UTF-8 (os acentos apareciam corrompidos).

Feito por Augusto Soares.
