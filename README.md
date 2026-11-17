
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

```sh
git clone https://github.com/diogofariasmdrs/coletaja.git
cd coletaja
npm ci
npm run dev
```

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

## Testes e build

```sh
npm test
npm run build
npm run preview
```

Os testes verificam a consulta por endereço, a proximidade das rotas, o planejamento e a simulação da frota. O build gera o site e o painel em `dist/`. O preview permite conferir essa versão no navegador.

## Próximas versões

O objetivo é aprimorar a precisão da consulta por endereço e avaliar com usuários a clareza das informações apresentadas no mapa e no painel. Uma futura integração com serviços reais de coleta dependerá de dados autorizados e de validação com os responsáveis pela operação.
````
