# DutraDEV — Revenue intelligence

**Do dado à decisão: um dashboard interativo de receita, clientes e vendas.**

[Abrir demonstração](https://dutradev99.github.io/dutradev-dashboard/) · [Código e testes](https://github.com/DutraDEV99/dutradev-dashboard) · [Portfólio do autor](https://github.com/DutraDEV99)

Dashboard independente criado por **Wendel Dutra / DutraDEV99**, com HTML, CSS e JavaScript puro. A demonstração pode ser explorada sem cadastro, instalação ou configuração de banco de dados.

## O que este projeto demonstra

| Área | Implementação |
| --- | --- |
| Interface | Quatro telas responsivas, hierarquia tipográfica e estados de busca sem resultados |
| Dados | Indicadores derivados das transações e comparação entre períodos equivalentes |
| Interação | Filtros combinados, paginação, cadastro e atualização dos indicadores |
| Persistência | Transações locais, com funcionamento na sessão quando o armazenamento estiver bloqueado |
| Segurança da interface | Escape de conteúdo digitado, validação dos dados locais e exportação CSV protegida contra fórmulas |
| Qualidade | Testes de comportamento com Node.js e execução automatizada no GitHub Actions |

## Explore em um minuto

1. Alterne o período entre 7, 30 e 90 dias e acompanhe os indicadores e o gráfico.
2. Abra **Transações**, busque um cliente e filtre o status dos pagamentos.
3. Cadastre uma transação fictícia e confira a atualização dos resultados.
4. Explore **Clientes** e **Insights** e exporte uma visão em CSV.

## Executar

Com Python 3 instalado, abra um terminal nesta pasta:

```powershell
python server.py
```

Acesse **http://127.0.0.1:8080**. Não precisa de login. Para trocar a porta: `python server.py --port 8081`.

Também é possível servir a pasta com qualquer servidor estático. Não há instalação de pacotes ou etapa de build. Para hospedar, publique `index.html`, `styles.css`, `app.css`, `typography.css` e `app.js` juntos.

## Experiência

- Visão geral: receita, vendas aprovadas, clientes ativos e ticket médio, com comparação ao período anterior.
- Gráfico SVG de receita diária, com comparação entre períodos equivalentes.
- Taxa de aprovação e status de pagamentos.
- Transações com busca, filtro por status e paginação.
- Clientes ordenados por receita no período.
- Insights por plano e canal de aquisição.
- Filtros globais de 7, 30 e 90 dias.
- Cadastro de transações de demonstração e atualização dos indicadores.
- Exportação CSV da visão atual, respeitando os filtros.
- Layout responsivo, navegação por teclado e diálogo nativo acessível.

## Dados e regras

As transações iniciais são **fictícias**, geradas de forma determinística em uma janela móvel de 180 dias para manter a demonstração preenchida. Novas transações ficam no `localStorage` deste navegador; não são enviadas a um servidor. A interface funciona na sessão mesmo quando o armazenamento está bloqueado.

Receita, ticket médio e clientes ativos consideram apenas transações pagas. A variação compara o período escolhido com os dias imediatamente anteriores, sem sobreposição. O ticket médio é receita dividida pelo número de vendas aprovadas. As datas usam o fuso local do navegador.

O CSV inclui BOM UTF-8, separador ponto e vírgula, aspas nos campos e proteção contra fórmulas vindas de texto digitado. Conteúdo de usuários é escapado antes de entrar no HTML.

## Tecnologias e decisões

HTML semântico, CSS responsivo e JavaScript puro. Gráficos SVG sem bibliotecas externas. O servidor Python usa apenas a biblioteca padrão e escuta somente em `127.0.0.1`. A tipografia usa fontes nativas do sistema (SF Pro em dispositivos Apple, Segoe UI no Windows), sem downloads de fontes. A escala usa texto principal de 17 px, títulos de 34 a 48 px e tabelas de 14 px, com medidas relativas às preferências do navegador. Os gráficos ajustam suas dimensões ao espaço disponível.

Este projeto é uma demonstração de interface e lógica de análise no navegador; não implementa autenticação, cobrança real, sincronização ou persistência em servidor.

## Testes

Com Node.js 22 ou superior, sem instalar pacotes:

```sh
node --test tests/dashboard.test.mjs
```

Os testes verificam navegação, fallback de rotas inválidas, geração do gráfico, paginação, busca, filtro de status, cadastro, persistência, escape de HTML e conteúdo do CSV. Usam um DOM simulado e não substituem a inspeção visual em um navegador.

## Estrutura

```text
index.html              Estrutura semântica e diálogo de cadastro
app.js                  Dados demonstrativos, indicadores e interações
styles.css              Layout e componentes base
app.css                 Componentes específicos das telas
typography.css          Escala tipográfica e ajustes responsivos
server.py               Servidor local opcional, sem dependências
tests/                  Testes de comportamento
.github/workflows/      Verificações automatizadas
```

## Autor

[Wendel Dutra — DutraDEV99](https://github.com/DutraDEV99)
