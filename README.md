# ColetaJá

Aplicação demonstrativa em HTML, CSS e módulos JavaScript, com Three.js, GSAP, ScrollTrigger, Lenis e Google Maps. A frota e os horários são simulados.

## Executar

Com Node.js 22.12 ou superior instalado, abra um terminal nesta pasta e execute:

```sh
npm ci
npm run dev
```

Abra o endereço Local mostrado pelo Vite. Para testar na mesma rede Wi-Fi, execute `npm run dev -- --host 0.0.0.0` e abra no celular o endereço Network. O firewall do computador precisa permitir a conexão na rede privada.

## Gerar a versão de apresentação

Execute `npm run build`. O site pronto fica em `dist/`. Execute `npm run preview` para conferi-lo pelo navegador. Para publicar, sirva essa pasta em um servidor estático.

## Testar o Google Maps com uma Demo Key

1. Obtenha sua chave pessoal na [página oficial de demonstração](https://developers.google.com/maps/documentation/javascript/demo-key). A Demo Key permite prototipagem com cota diária, sem cadastrar faturamento.
2. Na pasta que contém package.json, copie .env.example para .env.local. Preencha VITE_GOOGLE_MAPS_API_KEY com a chave. Para o teste, VITE_GOOGLE_MAPS_MAP_ID pode ficar vazio. Nesse caso a aplicação usa o Map ID de exemplo do Google. O Map ID identifica a configuração visual e a chave autoriza o acesso.
3. Execute npm run dev (reinicie se já estava rodando) e abra o endereço Local exibido pelo Vite. As variáveis são lidas pelo Vite ao iniciar. Para testar pelo celular, use as instruções de rede acima.
4. Role até “Mapa da coleta”. Confira a escola, selecione CJ-03 no mapa e na lista de veículos e use o zoom para afastar até o Brasil ou aproximar até as ruas. No celular, use dois dedos no mapa. Todas as rotas e horários da frota são fictícios.

O centro inicial fica em **−3.739368338, −38.56655153**, no entorno da Rua Dr. Moreira de Sousa, 327, Parquelândia, Fortaleza. [Coordenadas da escola](https://www.escolasnobrasil.com/nordeste/eeep-joaquim-nogueira-fortaleza) · [Endereço na Seduc](https://www.seduc.ce.gov.br/wp-content/uploads/sites/37/2019/01/joauim_nogueira_prof.pdf).

Sem chave aparece o aviso de configuração. Para falha de carregamento, confira conexão e restrições. Se o console mostrar OverQuotaMapError, aguarde a renovação da cota. Alguns erros do mapa base só informam o código no console. A inclinação depende de suporte vetorial. [Diagnóstico do Google](https://developers.google.com/maps/documentation/javascript/error-messages).

O Git ignora .env.local. Uma chave VITE usada no navegador fica visível nas requisições: restrinja o uso aos endereços e à API necessários. Para produção, configure credenciais e Map ID próprios e revise faturamento e limites antes de publicar. Use a Demo Key apenas em protótipos.
