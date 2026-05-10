# Agente A3P

Protótipo web do agente conversacional descrito no projeto de pesquisa sobre catalogação de conteúdos de responsabilidade socioambiental na Administração Pública.

## O que está implementado

- Interface em abas: Chat, Catálogo, Sugira conteúdo, Curadoria e Me avalie.
- Catálogo inicial em `catalogo.json`, organizado por eixo, tema, competência, tipo de recurso e nível.
- Chat orientado pelo catálogo, com links, recomendações e trilhas formativas.
- Catálogo com busca, filtros, estatísticas por formato/ano, palavras-chave e download CSV.
- Sugestão colaborativa de conteúdos com preenchimento assistido heurístico.
- Painel de curadoria local para aprovar, rejeitar, importar CSV e sincronizar a planilha pública.
- Avaliação pós-uso com itens de utilidade percebida e escala SUS.

## Teste local

Como o navegador bloqueia `fetch()` de JSON quando o HTML é aberto diretamente, rode um servidor estático dentro desta pasta:

```powershell
node server.js
```

Depois acesse:

```text
http://localhost:4173
```

## Publicação na internet

Esta aplicação é estática. Para disponibilizar para teste, publique os arquivos abaixo em qualquer hospedagem estática:

- `index.html`
- `styles.css`
- `app.js`
- `catalogo.json`

Opções simples:

- GitHub Pages: criar um repositório, enviar os arquivos e ativar Pages na branch principal.
- Netlify Drop: arrastar esta pasta em https://app.netlify.com/drop.
- Vercel: importar o repositório ou publicar como projeto estático.

## Próximos incrementos

- Substituir ou ampliar o catálogo com curadoria real da Rede A3P.
- Adicionar backend para salvar avaliações de todos os participantes.
- Integrar um modelo de linguagem com RAG quando houver chave de API e política de uso definida.
- Criar painel de validação humana para confirmar eixo, tema, qualidade e duplicidades.
