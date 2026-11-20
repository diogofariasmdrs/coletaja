# ColetaJá · v0.5.0

O ColetaJá é um protótipo acadêmico de tecnologia urbana desenvolvido no contexto da disciplina de Gestão de Startup da EEEP Joaquim Nogueira, em Fortaleza. Ele parte de uma pergunta do morador — “a coleta passa perto da minha rua?” — e permite investigar a resposta em um mapa. Um painel de gestão mostra a mesma operação pela perspectiva de quem organiza a frota.

**[Experimentar o ColetaJá](https://coletaja-gold.vercel.app)** · **[Abrir o painel demonstrativo](https://coletaja-gold.vercel.app/gestao/)** · [Código-fonte no GitHub](https://github.com/diogofariasmdrs/coletaja)

A v0.5.0 está preparada localmente. O link público recebe esta versão após o envio e o deploy.

## Experimente a demonstração

1. Abra o site no computador ou celular. Depois da abertura 3D com o compactador CJ-01, explore o mapa e selecione um caminhão para consultar sua rota.
2. Pesquise **Barra do Ceará** para ver os percursos que atravessam o bairro. Em seguida, tente **RioMar Kennedy** ou **Av. Filomeno Gomes, 293, Jacarecanga** para consultar a proximidade de um local específico.
3. Na própria página, consulte seu endereço e clique em **Iniciar simulação**. A reprodução começa pausada, no ritmo **Normal · 1×**. Você pode pausar, recomeçar ou ajustar a velocidade.
4. Abra o painel para consultar a frota, as ocorrências e o relatório da operação. Sair da aba pausa a reprodução; retome pelos controles da página em uso.

## O que a v0.5.0 oferece

- **Mapa da coleta.** A visualização começa no entorno da EEEP Joaquim Nogueira, em Parquelândia. É possível explorar ruas, mudar o zoom e selecionar um veículo pelo mapa ou pela lista. A inclinação depende do suporte à renderização vetorial.
- **Consulta por endereço.** A pesquisa local usa 52.304 trechos de ruas, os limites de 121 bairros e referências como escolas e shoppings. Também é possível usar a própria localização ou escolher um ponto no mapa. Fora da faixa demonstrativa de 180 m, a consulta indica o trajeto ativo mais próximo, quando disponível.
- **Rotas e frota.** A demonstração começa com nove veículos. Há percursos entre Vila Velha e Barra do Ceará, Jacarecanga e Presidente Kennedy, e Messejana e Cambeba. O painel permite cadastrar veículos, comparar trajetos pelas ruas e pela extensão e atribuir um caminhão a uma rota.
- **Gestão da operação.** O painel permite pausar ou acelerar a simulação, registrar e resolver ocorrências e exportar um relatório em CSV. As mudanças ficam salvas no navegador e aparecem na consulta do morador quando aberta na mesma origem.

- **Previsão de chegada.** A consulta mostra o tempo restante no ritmo da demonstração.
- **Ruas internas.** Os nove circuitos operacionais foram ampliados. Trechos desconectados da base permanecem fora do caminho; os percursos não representam cobertura integral nem roteiros municipais oficiais.
- **Acesso pela tela inicial.** A página orienta como adicionar o ColetaJá ao celular. O mapa continua dependendo de internet.

- **Alertas de chegada.** Escolha 30, 15 ou 5 minutos. Um aviso aparece na página quando a previsão entra nesse intervalo, inclusive se já estiver abaixo dele ao ativar. Não há avisos com a página fechada nem notificações do sistema.
- **Passagem no mapa.** Um destaque indica o veículo próximo do endereço consultado. O status Recolhendo resíduos representa uma parada de coleta.

## Como interpretar os dados

O mapa do Google representa a cidade real. As ruas, as faixas de numeração, os limites dos bairros e os locais de referência vêm de cadastros municipais. Para uma busca por número, o marcador representa o centro aproximado do trecho correspondente. A distância é medida em linha reta até o traçado da rota. [Cadastro de logradouros da SEFIN · CC BY](https://dados.fortaleza.ce.gov.br/dataset/logradouros-fortaleza) · [Catálogo Fortaleza em Mapas](https://mapas.fortaleza.ce.gov.br/catalogo)

Os circuitos demonstrativos seguem eixos de ruas reais. Caminhões, posições, horários, progresso e ocorrências pertencem à simulação. A faixa de 180 m indica proximidade no protótipo. O atendimento e o horário efetivo de coleta dependem da operação municipal.

## Tecnologias

O site usa HTML5, CSS e JavaScript com módulos ES. Three.js renderiza a cidade e o caminhão em tempo real. GSAP, ScrollTrigger e Lenis coordenam animações e rolagem. A Google Maps JavaScript API exibe o mapa interativo. Node.js executa as ferramentas de desenvolvimento e os testes. Vite prepara o site e o painel para hospedagem na Vercel.

## Executar localmente

Instale o Git e o Node.js 22.12 ou superior. Em um terminal, execute:

```sh
git clone https://github.com/diogofariasmdrs/coletaja.git
cd coletaja
npm ci
npm run dev
```

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

## Testes e build

```sh
npm test
npm run build
npm run preview
```

Os testes usam o executor nativo do Node.js e verificam a busca, a proximidade das rotas, o planejamento, a previsão de chegada, os controles de reprodução e o comportamento da frota. O build gera as duas páginas em `dist/`. O comando de preview serve essa cópia para conferência no navegador.

## Segurança e privacidade

O `.env.local` não deve ser publicado. A chave da Maps JavaScript API é enviada ao navegador por necessidade da integração: variáveis VITE não são um cofre. Use restrições de sites e APIs no Google Cloud; ocultar a chave no código-fonte não substitui essas restrições. Nenhum login ou backend foi adicionado. Nenhum endereço é salvo como favorito. Ao consultar uma localização no Google Maps, a coordenada é enviada ao serviço para exibição.

## Objetivo das próximas versões

A direção proposta é melhorar a precisão e a clareza da consulta por endereço e validar, com usuários, se o mapa e o painel ajudam a interpretar os percursos. Uma eventual integração com uma operação real dependeria de dados autorizados e de validação com os responsáveis pela coleta.

## Equipe demonstrativa opcional

A ficha do veículo atribuído ao percurso Parquelândia-0 pode mostrar até quatro integrantes. Na configuração inicial, a atribuição verificada é RT-01 → CJ-01. A gestão permite editar a equipe em **Frota → Equipe demonstrativa da Parquelândia**, somente no navegador atual. Equipes vazias não aparecem; as funções são fictícias e identificadas como demonstração acadêmica.

Fotos autorizadas devem ser exportadas como WebP em `public/images/equipe/`: `motorista.webp`, `coletor-1.webp`, `coletor-2.webp` e `apoio.webp`. Prefira 256 × 256 px e até 100 KB. Renomear uma extensão não converte a imagem. Os nomes e funções comuns a todos os visitantes podem ser definidos em `js/maps/team.json`, após autorização, e publicados junto das fotos. Não há imagens nem nomes pessoais incluídos. Edições feitas pela gestão não alteram esses arquivos nem são compartilhadas com outros visitantes. Arquivos publicados em `public` são públicos mesmo que a seção esteja oculta.
