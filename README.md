<<<<<<< HEAD

# ColetaJá v0.3.0

O ColetaJá é um projeto acadêmico de tecnologia urbana desenvolvido na disciplina de Gestão de Startup da EEEP Joaquim Nogueira, em Fortaleza. O projeto parte de uma dificuldade comum entre moradores: saber por onde passa a coleta de resíduos e quando ela pode chegar à sua região.

A versão atual demonstra como moradores podem consultar trajetos e como gestores podem acompanhar uma frota de coleta.

**[Acessar o ColetaJá](https://coletaja-gold.vercel.app)** · **[Abrir o painel de gestão](https://coletaja-gold.vercel.app/gestao/)**

## Funcionalidades da v0.3.0

- Abertura cinematográfica com cidade e caminhão compactador renderizados em 3D.
- Mapa interativo de Fortaleza com seleção de veículos e visualização dos trajetos.
- Consulta por endereço, bairro, ponto de referência ou localização do dispositivo.
- Identificação das rotas que atravessam cada bairro e da distância entre um endereço e o percurso mais próximo.
- Painel de gestão com nove veículos iniciais, cadastro de caminhões, atribuição de rotas e controle da simulação.
- Registro de ocorrências operacionais e exportação de relatório em CSV.

## Dados e simulação

A consulta utiliza os limites dos 121 bairros de Fortaleza e um cadastro municipal com 52.304 trechos de ruas. Ao informar um número, o sistema usa a faixa de numeração cadastrada para localizar o trecho aproximado. A distância até a rota é calculada em linha reta.

Os trajetos demonstrativos seguem ruas reais. Os caminhões, suas posições, horários e ocorrências são simulados. A faixa de 180 metros indica proximidade com um percurso da demonstração e não confirma atendimento municipal. As alterações feitas no painel ficam salvas no navegador de cada visitante.

Fontes: [Fortaleza em Mapas](https://mapas.fortaleza.ce.gov.br/catalogo) e [Cadastro de Logradouros da Prefeitura de Fortaleza](https://dados.fortaleza.ce.gov.br/dataset/logradouros-fortaleza).

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Interface | HTML5, CSS e JavaScript com módulos ES |
| Cena 3D | Three.js |
| Animação e rolagem | GSAP, ScrollTrigger e Lenis |
| Mapa interativo | Google Maps JavaScript API |
| Desenvolvimento e testes | Node.js e Vite |
| Hospedagem | Vercel |

## Executar localmente

Com Git e Node.js 22.12 ou superior instalados, execute:
=======
# ColetaJá · v0.3.0

O ColetaJá é um protótipo acadêmico de tecnologia urbana desenvolvido no contexto da disciplina de Gestão de Startup da EEEP Joaquim Nogueira, em Fortaleza. Ele parte de uma pergunta do morador — “a coleta passa perto da minha rua?” — e permite investigar a resposta em um mapa. Um painel de gestão mostra a mesma operação pela perspectiva de quem organiza a frota.

**[Experimentar o ColetaJá](https://coletaja-gold.vercel.app)** · **[Abrir o painel demonstrativo](https://coletaja-gold.vercel.app/gestao/)** · [Código-fonte no GitHub](https://github.com/diogofariasmdrs/coletaja)

## Experimente a versão publicada

1. Abra o site no computador ou celular. Depois da abertura 3D com o compactador CJ-01, explore o mapa e selecione um caminhão para consultar sua rota.
2. Pesquise **Barra do Ceará** para ver os percursos que atravessam o bairro. Em seguida, tente **RioMar Kennedy** ou **Av. Filomeno Gomes, 293, Jacarecanga** para consultar a proximidade de um local específico.
3. Abra o painel no mesmo navegador e inicie o relógio da simulação, que começa pausado. Acompanhe o progresso dos veículos e consulte o relatório da operação.

## O que a v0.3.0 oferece

- **Mapa da coleta.** A visualização começa no entorno da EEEP Joaquim Nogueira, em Parquelândia. É possível explorar ruas, mudar o zoom e selecionar um veículo pelo mapa ou pela lista. A inclinação depende do suporte à renderização vetorial.
- **Consulta por endereço.** A pesquisa local usa 52.304 trechos de ruas, os limites de 121 bairros e referências como escolas e shoppings. Também é possível usar a própria localização ou escolher um ponto no mapa. Fora da faixa demonstrativa de 180 m, a consulta indica o trajeto ativo mais próximo, quando disponível.
- **Rotas e frota.** A demonstração começa com nove veículos. Há percursos entre Vila Velha e Barra do Ceará, Jacarecanga e Presidente Kennedy, e Messejana e Cambeba. O painel permite cadastrar veículos, comparar trajetos pelas ruas e pela extensão e atribuir um caminhão a uma rota.
- **Gestão da operação.** O painel permite pausar ou acelerar a simulação, registrar e resolver ocorrências e exportar um relatório em CSV. As mudanças ficam salvas no navegador e aparecem na consulta do morador quando aberta na mesma origem.

## Como interpretar os dados

O mapa do Google representa a cidade real. As ruas, as faixas de numeração, os limites dos bairros e os locais de referência vêm de cadastros municipais. Para uma busca por número, o marcador representa o centro aproximado do trecho correspondente. A distância é medida em linha reta até o traçado da rota. [Cadastro de logradouros da SEFIN · CC BY](https://dados.fortaleza.ce.gov.br/dataset/logradouros-fortaleza) · [Catálogo Fortaleza em Mapas](https://mapas.fortaleza.ce.gov.br/catalogo)

Os circuitos demonstrativos seguem eixos de ruas reais. Caminhões, posições, horários, progresso e ocorrências pertencem à simulação. A faixa de 180 m indica proximidade no protótipo. O atendimento e o horário efetivo de coleta dependem da operação municipal.

## Tecnologias

O site usa HTML5, CSS e JavaScript com módulos ES. Three.js renderiza a cidade e o caminhão em tempo real. GSAP, ScrollTrigger e Lenis coordenam animações e rolagem. A Google Maps JavaScript API exibe o mapa interativo. Node.js executa as ferramentas de desenvolvimento e os testes. Vite prepara o site e o painel para hospedagem na Vercel.

## Executar localmente

Instale o Git e o Node.js 22.12 ou superior. Em um terminal, execute:
>>>>>>> 0754ff6 (feat: adiciona painel de gestão e amplia a consulta por endereço em Fortaleza)

```sh
git clone https://github.com/diogofariasmdrs/coletaja.git
cd coletaja
npm ci
npm run dev
```

<<<<<<< HEAD
Abra o endereço exibido pelo Vite. O painel de gestão está disponível no caminho `/gestao/`.

## Configurar o Google Maps

Para desenvolvimento local, copie `.env.example` para `.env.local`, na raiz do projeto, e configure as variáveis abaixo.

| Variável | Configuração |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Chave de navegador habilitada para a Maps JavaScript API. |
| `VITE_GOOGLE_MAPS_MAP_ID` | Identificador visual do mapa. Quando vazio, a aplicação usa `DEMO_MAP_ID`. |
| `VITE_ENABLE_GEOCODING` | O valor padrão `false` mantém a consulta no cadastro local. |

Reinicie o Vite depois de alterar as variáveis. O mapa interativo requer internet e uma chave válida. A consulta ao cadastro local funciona sem chave.

Na Vercel, selecione o preset **Vite**, mantenha `./` como diretório raiz, use `npm run build` como comando de build e `dist` como diretório de saída. Cadastre as variáveis em **Settings → Environment Variables**, no ambiente **Production**, e gere um novo deploy após alterar seus valores.

Mantenha o `.env.local` fora do Git. Como a chave é utilizada no navegador, restrinja seu uso às APIs e aos domínios autorizados. Para esta publicação, o domínio é `https://coletaja-gold.vercel.app/*`. Uma Demo Key possui cota diária e se destina à prototipagem. [Documentação do Google Maps](https://developers.google.com/maps/documentation/javascript/demo-key)
=======
Abra o endereço **Local** exibido pelo Vite. O caminho `/gestao/` abre o painel. Para testar a cópia local no celular, conecte os dois dispositivos à mesma rede Wi-Fi, execute `npm run dev -- --host 0.0.0.0` e abra o endereço **Network** no telefone. O firewall do computador precisa permitir essa conexão na rede privada. A versão publicada também pode ser acessada pelos dados móveis.

## Configurar o Google Maps

**No desenvolvimento**, copie `.env.example` para `.env.local` na pasta de `package.json`. Preencha as variáveis abaixo e reinicie o Vite. A consulta ao cadastro local funciona sem chave. O mapa interativo requer internet e uma chave válida.

| Variável | Valor ou finalidade |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Chave de navegador habilitada para a Maps JavaScript API. |
| `VITE_GOOGLE_MAPS_MAP_ID` | Identificador da configuração visual do mapa. Em branco, o protótipo usa `DEMO_MAP_ID`. |
| `VITE_ENABLE_GEOCODING` | Use `false` para pesquisar no cadastro local. Ative a geocodificação complementar apenas depois de conferir a disponibilidade do serviço e os custos da sua conta. |

**Na Vercel**, importe o repositório com o preset **Vite**, diretório raiz `./`, comando de build `npm run build` e saída `dist`. Cadastre as mesmas variáveis em **Settings → Environment Variables**, no ambiente **Production**. Após modificar um valor, gere um novo deploy para incorporá-lo ao site.

O Git ignora `.env.local`. As variáveis `VITE_` usadas pelo aplicativo ficam acessíveis no navegador. Para uma chave própria, restrinja o uso à API necessária e aos sites autorizados, incluindo `https://coletaja-gold.vercel.app/*` e a origem local usada no desenvolvimento. Uma Demo Key atende à prototipagem e tem cota diária. Para operação em produção, revise as credenciais, o Map ID, as cotas e o faturamento do projeto Google. [Maps Demo Key](https://developers.google.com/maps/documentation/javascript/demo-key) · [Restrições de chave](https://developers.google.com/maps/documentation/javascript/get-api-key)

Para verificar a integração publicada, abra o site pelo celular nos dados móveis, aproxime o mapa e selecione um caminhão. Repita no painel. Se o mapa falhar, confira a variável do ambiente de produção, o domínio autorizado e o código de erro no console do navegador. [Diagnóstico do Google Maps](https://developers.google.com/maps/documentation/javascript/error-messages)
>>>>>>> 0754ff6 (feat: adiciona painel de gestão e amplia a consulta por endereço em Fortaleza)

## Testes e build

```sh
npm test
npm run build
npm run preview
```

<<<<<<< HEAD
Os testes verificam a consulta por endereço, a proximidade das rotas, o planejamento e a simulação da frota. O build gera o site e o painel em `dist/`. O preview permite conferir essa versão no navegador.

## Próximas versões

O objetivo é aprimorar a precisão da consulta por endereço e avaliar com usuários a clareza das informações apresentadas no mapa e no painel. Uma futura integração com serviços reais de coleta dependerá de dados autorizados e de validação com os responsáveis pela operação.
````
=======
Os testes usam o executor nativo do Node.js e verificam a busca, a proximidade das rotas, o planejamento e o comportamento da frota. O build gera as duas páginas em `dist/`. O comando de preview serve essa cópia para conferência no navegador.

## Objetivo das próximas versões

A direção proposta é melhorar a precisão e a clareza da consulta por endereço e validar, com usuários, se o mapa e o painel ajudam a interpretar os percursos. Uma eventual integração com uma operação real dependeria de dados autorizados e de validação com os responsáveis pela coleta.
>>>>>>> 0754ff6 (feat: adiciona painel de gestão e amplia a consulta por endereço em Fortaleza)
