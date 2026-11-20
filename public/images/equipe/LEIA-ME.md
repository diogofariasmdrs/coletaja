# Fotos da equipe demonstrativa

Coloque nesta pasta somente fotos cujo uso foi autorizado:

- motorista.webp
- coletor-1.webp
- coletor-2.webp
- apoio.webp

Exporte de verdade para WebP, preferencialmente quadradas, com 256 × 256 pixels e até 100 KB por foto. Trocar apenas a extensão de PNG/JPG para .webp NÃO converte o arquivo. Use um editor que ofereça exportação WebP. Não é necessário SVG. Enquanto não houver foto, a ficha mostra a inicial do nome.

Os nomes dos arquivos são fixos; as funções exibidas podem ser editadas. Não há upload de fotos pela gestão. O navegador guarda somente nome, função e nome do arquivo, nunca a imagem.

Para testar: coloque os arquivos aqui, abra Gestão → Frota → Equipe demonstrativa da Parquelândia e preencha até quatro pessoas. Deixe Nome vazio para não exibir aquela pessoa. Se todos estiverem vazios, a seção não aparece. O cadastro requer confirmação de autorização. Os papéis são fictícios, para a atividade acadêmica.

Salvar na gestão altera apenas este navegador e esta origem (localhost e Vercel não compartilham os cadastros). Usar dados do projeto remove a edição local. Não há backend e os colegas não receberão essas edições automaticamente.

Para disponibilizar a mesma equipe a todos, depois de obter autorização, preencha js/maps/team.json e inclua as imagens nesta pasta no próximo commit/deploy aprovado. O vehicleId deve corresponder ao caminhão atribuído ao percurso Parquelândia-0. Inicialmente é CJ-01 / RT-01. Em caso de troca na gestão, a interface verifica a atribuição atual e não transfere dados pessoais automaticamente entre caminhões.

Não publique fotos pessoais apenas para testar. Arquivos colocados em public ficam acessíveis por URL quando publicados, mesmo que a equipe esteja oculta ou os nomes vazios. Remova metadados de localização ao exportar as imagens. Nenhuma foto ou nome real acompanha esta implementação.
