/*
 *
 *	Augusto de Oliveira Soares
 *
 * Programa: BlackJack training
 */

#include <stdio.h>
#include <locale.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

//---------------------------------------------------------------------------------------------------------------

void nome();
int menu();
void regras();
int jogo();
void baralho();
void distribuicao();
void compra();
int resultado();
int soma(char vetor[]);
void sorteiocarta(int num);
int playagain();
void opcoes();

//----------------------------------------------------------------------------------------------------------------

int placarP1 = 0, placarPC = 0;
char dificuldade;
// md3 representa se a op��o de melhor de tr�s est� ativa ou n�o.
char seunome[15], CSPC[15], CSP1[15], cartas[56] = " A23456789DJQK A23456789DJQK A23456789DJQK A23456789DJQK", md3;
// CSP1 e CSPC s�o vetores que registram as cartas sorteadas pelos jogadores P1 E PC.

//----------------------------------------------------------------------------------------------------------------

int main(){

	setlocale(LC_ALL, "Portuguese_Brazil");
	setlocale(LC_CTYPE, "pt_BR.UTF-8");
	srand(time(0));

	printf("------------------------------------------------- BLACKJACK TRAINING -------------------------------------------------\n\n\n");

	printf("--- Sejam bem vindos! ---");
	printf("\n\n\tPrograma com intuito de dar suporte � todos os jogadores profissionais e casuais de BlackJack,\n\tmais conhecido como 'Vinte e Um'.\n\n\tContudo, todos s�o livres para us�-lo at� para aprender o jogo se houver interesse.");
	printf("\n\n\tBoa sorte e divirtam-se!\n\n");

	printf("\n----------------------------------------------------------------------------------------------------------------------\n\n");

	sleep(2);

	nome();
	menu();

	printf("\n\n\n\n\n                                                                                           Feito por Augusto Soares");

	return 0;
}

//----------------------------------------------------------------------------------------------------------------

// INSERT NAME ------>

void nome(){

	printf("Digite seu nome: ");
	gets(seunome);

	printf("\nPrazer, %s! Esse � seu nome durante o jogo.\n\n", seunome);

	printf("------------------------------------------\n\n");

	sleep (1);
}

//----------------------------------------------------------------------------------------------------------------

// OP��ES PLAYER ----->

int menu(){

	char opcao;

	do{

		printf("Para come�ar o jogo, digite 1.\n\n");
		printf("Para ver as regras do jogo e para aprender a jogar, digite 2.\n\n");
		printf("Se quiser sair, digite 'S'.\n\n: ");
		scanf(" %c", &opcao);

	} while (opcao != '1' && opcao != '2' && opcao != 'S' && opcao != 's');

	if (opcao == '2') regras();

	else if (opcao == 'S' || opcao == 's'){
		printf("\n\tAt� mais!");
		return 0;

	}else opcoes();

	return 0;
}

//----------------------------------------------------------------------------------------------------------------

// INSTRU��ES ----->

void regras(){

	int i;
	char cartas[13] = "A23456789DJQK";
	// Substitu� o 10 pelo Z, para ocupar somente um caracter.

	printf("---REGRAS---\n");

	sleep(1);

	printf("\n--> O objetivo do jogo �, a partir das cartas recebidas e compradas, tentar chegar o mais perto poss�vel de 21 na soma\nsem ultrapassar esse valor. Ou seja, a soma deve resultar em, no m�ximo, 21 para a 'perfei��o' de sua jogada.");
	printf("\n\n--> O jogo possui 52 cartas: sendo elas em ordem: ");

	sleep(1);

	for (i = 0; cartas[i] != '\0'; i++){

		if (i == 12)printf(" %c.", cartas[i]);

		else printf(" %c -", cartas[i]);

	}

	printf("\n--> Dessas listadas acima, cada uma tem 4 tipos diferentes: Espadas, Ouros, Paus e Copas.");
	printf("\n\n--> Importante ressaltar que os �ses valem 1 e J, Q e K valem 10.");

	sleep(1);

	printf("\n\n--> Voc� joga contra uma ou mais pessoas. Nesse programa, voc� jogar� apenas contra uma, sendo ela o computador.");
	printf("\n\n--> No in�cio do jogo, cada um recebe 2 cartas, e da� por diante cada um pode optar por comprar mais cartas,\na fim de chegar o mais perto poss�vel da soma 21.");

	sleep(1);

	printf("\n\n--> Caso voc� conclua que j� h� um grande risco de, ap�s comprar uma nova carta j� com suas cartas iniciais,\n que voc� possa passar do 21, voc� pode finalizar suas jogadas logo de cara.");
	printf("\n\n--> Voc� poder� comprar, no m�ximo, 5 cartas.");

	sleep(1);

	printf("\n\n--> Voc� s� ver� a pontua��o do seu(s) advers�rio(s) ao finalizar suas jogadas ao final da rodada.");
	printf("\n\n--> Vence quem, no final, tiver uma soma maior que n�o ultrapassa 21.");

	sleep(1);

	printf("\n\n--> Se os jogadores obtiverem o mesma soma ou os dois excederem a soma 21, ocorre um empate.");

	sleep(1);

	printf("\n\n----------------------------------------------------------------------------------------------------------------------\n\n");

	menu();
}

//----------------------------------------------------------------------------------------------------------------

// JOGO ----->

int jogo(){

	if (md3 == 'S' || md3 == 's') printf("\n\n--> PLACAR: %s %d X %d PC", seunome, placarP1, placarPC);

	baralho();
	distribuicao();
	compra();
	resultado();

	return 0;
}

//----------------------------------------------------------------------------------------------------------------

// CARTAS ----->

void baralho(){

	char cartas[56] = " A23456789DJQK A23456789DJQK A23456789DJQK A23456789DJQK";
	// Substitu� o 10 pelo D, para ocupar somente um caracter.
	int i;

	printf("\n------------------------------------------\n");
	sleep(1);

	printf("\n\tDadas as cartas: \n");

	for (i = 0; i < 56; i++)
	{
		if (i == 0) printf("\nEspadas: ");
		else if (i == 14) printf("\nPaus:    ");
		else if (i == 28) printf("\nCopas:   ");
		else if (i == 42) printf("\nOuros:   "); 
		else if (i == 13 || i == 27 || i == 41 || i == 55) printf(" %c", cartas[i]);
		else printf(" %c -", cartas[i]);

	}
	strcpy(CSP1,"");
	strcpy(CSPC,"");
}

//----------------------------------------------------------------------------------------------------------------

// FUN��O QUE DISTRIBUI AS PRIMEIRAS CARTAS ----->

void distribuicao(){

	// Substitu� o 10 pelo D, para ocupar somente um caracter.
	// c1 e c2 cartas do player, c3 e c4 do computador.
	// AUX � um minivetor auxiliar que "transporta" os char's de um vetor x para posteriormente concatenar em outro, a fim de som�-los e ter a soma das cartas.

	sleep(2);
	printf("\n\n\t Distribuindo as cartas...\n");
	sleep(2);

	// c1 ------------------------------- SORTEIO QUATRO CARTAS PARA CADA PLAYER
	for(int k = 1;k<=4;k++){
		sorteiocarta(k);
		//printf("%s -- %s", CSPC,CSP1);
		sleep(1);
	}


}

//----------------------------------------------------------------------------------------------------------------

// FUN��O QUE COMPRA AS CARTAS SEGUINTES ----->

void compra(){

	int a, i = 0, j = 0, valorPC = soma(CSPC), valorP1 = soma(CSP1), num;
	char aux[2] = " \0", resposta;

	if (dificuldade == 'f' || dificuldade == 'F') num = 14;
	else if (dificuldade == 'm' || dificuldade == 'M')num = 17;
	else if (dificuldade == 'd' || dificuldade == 'D') num = 19;

	// Jogada Computador --------------------------------

	printf("\n\n--> JOGADA DO COMPUTADOR.\n");
	sleep(1);

	if (dificuldade == 'd' || dificuldade == 'D'){
		while (valorPC < num){
			
			do a = (rand() % 56); while (cartas[a] != 'A' && cartas[a] != '2' && cartas[a] != '3' && cartas[a] != '4');

			aux[0] = cartas[a];
			strcat(CSPC, aux);
			cartas[a] = '*';
			i++;

			valorPC = soma(CSPC);
			//printf("%s\n", CSPC);
			//printf("%d\n", valorPC);
		}
	}
	else{ 
		while (valorPC < num){
			sorteiocarta(0);
			valorPC = soma(CSPC);
			i++;
		}
	}

	printf("\nO computador comprou %d carta(s) e terminou suas jogadas. Agora � sua vez, %s!", i, seunome);

	sleep(2);

	// Jogada Player --------------------------------

	printf("\n\n\n\n--> JOGADA DE %s.", seunome);
	sleep(1);

	printf("\n\n\tA soma das suas cartas at� agora � %d.\n", valorP1 = soma(CSP1));
	sleep(1);

	do{
		printf("\n\n\tVoc� deseja comprar mais uma carta? (S/N): ");
		scanf(" %c", &resposta);

		if (resposta == 's' || resposta == 'S'){

			j++;
			sorteiocarta(1);
			valorP1 = soma(CSP1);

			printf("\n\tAgora a soma da suas cartas %d", valorP1);

		}else if (resposta == 'n' || resposta == 'N'){

			valorP1 = soma(CSP1);
			printf("\n--> Voc� finalizou suas jogadas e o valor final de suas cartas � %d.", valorP1);

		}else printf("\n--> Resposta n�o reconhecida.");

	} while (resposta != 'n' && resposta != 'N' && valorP1 < 21);
	sleep(2);

}

//----------------------------------------------------------------------------------------------------------------

// FUN��O QUE DIZ QUEM GANHOU ----->

int resultado(){

	int valorPC, valorP1;

	printf("\n\n------------------------------------------");

	printf("\n\n\t E AGORA, O RESULTADO:");
	sleep(2);

	for(int i = 0;i<3;i++){
		printf(".");
		sleep(1);
	}

	valorP1 = soma(CSP1);
	valorPC = soma(CSPC);

	if (valorP1 == valorPC || (valorP1 > 21 && valorPC > 21)){

		if (valorP1 == valorPC) printf("\n\tVoc�s empataram! Ambos tiveram a soma de %d!", valorPC);

		else if (valorP1 > 21 && valorPC > 21) printf("\n\tVoc�s empataram! Ambos ultrapasaram o valor 21. seu valor foi %d e o do computador %d.", valorP1, valorPC);

	}

	else if ((valorP1 > valorPC && valorP1 <= 21) || (valorP1 <= 21 && valorPC > 21)){

		printf("\n\tVoc� ganhou!");
		sleep(1);
		printf("\n\nO computador obteve a soma de cartas igual a %d, enquanto a sua foi de %d.", valorPC, valorP1);

		if (md3 == 'S' || md3 == 's'){
			placarP1++;

			if (placarP1 == 2){
				printf("\n\nParab�ns!!! Voc� ganhou a md3!");
				playagain();
			}else jogo();
			
		}
	}
	else if ((valorP1 < valorPC && valorPC <= 21) || (valorPC <= 21 && valorP1 > 21)){

		printf("\n\tVoc� perdeu!");
		sleep(1);
		printf("\n\nO computador obteve a soma de cartas igual a %d, enquanto a sua foi de %d.", valorPC, valorP1);

		if ((md3 == 'S' || md3 == 's')){
			placarPC++;

			if (placarPC == 2){
				printf("\n\nQue pena... Voc� perdeu a md3!");
				playagain();
			}else jogo();
		}

	}
	
	if (md3 == 'N' || md3 == 'n') playagain();

	return 0;
}

//----------------------------------------------------------------------------------------------------------------

// FUN��O QUE SOMA AS CARTAS ----->

int soma(char vetor[]){

	int i, totalvalor = 0;

	for (i = 0; vetor[i] != '\0'; i++)
	{

		if (vetor[i] == 'A') totalvalor++;
		else if (vetor[i] == '2') totalvalor += 2;
		else if (vetor[i] == '3') totalvalor += 3;
		else if (vetor[i] == '4') totalvalor += 4;
		else if (vetor[i] == '5') totalvalor += 5;
		else if (vetor[i] == '6') totalvalor += 6;
		else if (vetor[i] == '7') totalvalor += 7;
		else if (vetor[i] == '8') totalvalor += 8;
		else if (vetor[i] == '9') totalvalor += 9;
		else totalvalor += 10;

	}

	return totalvalor;
}

//----------------------------------------------------------------------------------------------------------------

// FUN��O QUE SORTEIA AS CARTAS DO PLAYER ----->

void sorteiocarta(int num){

	int a;
	char carta[7], aux[2] = " \0", naipe[8], E[8] = "espadas", P[5] = "paus", C[6] = "copas", O[6] = "ouros";

	do a = (rand() % 56); while (cartas[a] == '*' || cartas[a] == ' ');

	if(num%2 != 0){
		if (a != 0 && a <= 13) strcpy(naipe, E);
		else if (a >= 15 && a <= 27) strcpy(naipe, P);
		else if (a >= 29 && a <= 41) strcpy(naipe, C);
		else if (a >= 43 && a <= 55) strcpy(naipe, O);

		if(cartas[a] == 'Q' || cartas[a] == 'J' || cartas[a] == 'K' || cartas[a] == 'A' || cartas[a] == 'D'){
			
			if(cartas[a] == 'D') strcpy(carta,"10");
			if(cartas[a] == 'Q') strcpy(carta,"dama");
			if(cartas[a] == 'J') strcpy(carta,"valete");
			if(cartas[a] == 'K') strcpy(carta,"rei");
			if(cartas[a] == 'A') strcpy(carta,"�s");
			printf("\n--> Voc� recebeu um(a) %s de %s.\n\n", carta, naipe);

		}else printf("\n--> Voc� recebeu um(a) %c de %s.\n\n", cartas[a], naipe);
		

		aux[0] = cartas[a];
		strcat(CSP1, aux);

	}else{
		aux[0] = cartas[a];
		strcat(CSPC, aux);
		//printf("%s",CSPC);
		printf("\n--> O computador recebeu uma carta.\n\n");
	}

	cartas[a] = '*';
}

//----------------------------------------------------------------------------------------------------------------

// FUN��O PARA JOGAR NOVAMENTE ----->

int playagain(){

	char opcao;

	sleep(2);

	printf("\n\n------------------------------------------");

	do{

		printf("\n\nDigite 1 para jogar novamente e 'S' para sair.\n: ");
		scanf(" %c", &opcao);

	} while (opcao != '1' && opcao != 's' && opcao != 'S');

	if (opcao == '1') opcoes();
		
	else{
		printf("\n\n\tAt� mais!");
		return 0;
	}

	sleep(1);

	return 0;
}

//----------------------------------------------------------------------------------------------------------------

// FUN��O PARA DESAFIOS DO JOGO----->

void opcoes(){

	printf("\n--> Voc� deseja jogar uma melhor de tr�s? S/N: ");
	scanf(" %c", &md3);

	if (md3 != 'S' && md3 != 's' && md3 != 'N' && md3 != 'n'){

		do{

			printf("Digite novamente (S/N): ");
			scanf(" %c", &md3);

		} while (md3 != 'S' && md3 != 's' && md3 != 'N' && md3 != 'n');
	}

	printf("\n--> Ok!!");

	sleep(1);

	//----------------------------------------------------------------------------------------------------------------

	do{

		printf("\n\n--> Qual dificuldade voc� deseja? \nF�CIL(F)\nM�DIO(M)\nDIF�CIL(D) \n: ");
		scanf(" %c", &dificuldade);

		printf("A dificuldade escolhida foi '%c'.\n", dificuldade);

	} while (dificuldade != 'f' && dificuldade != 'F' && dificuldade != 'm' && dificuldade != 'M' && dificuldade != 'd' && dificuldade != 'D');

	sleep(1);

	//----------------------------------------------------------------------------------------------------------------

	jogo();

}
