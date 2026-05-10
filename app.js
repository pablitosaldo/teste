const SHEET_ID = "1Q8BH51WF5oCwYwFoBNww_m0d3uSTyc8Od8QLF-w3acI";
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxS0Wa9N77V4Rf1UZOAaZt9lo6z2aTmHUXwbSSnQtPPLFqiooM-YwK01_C_K_cO16GIUA/exec";
const EVAL_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTCXKwtTuARkD3-a4mfSf3K4ioRYfuh-FyfbYXu5WwhFctg00IEZaSy7QSlPj8oGDlgA/exec";

const EIXOS_A3P = [
  "Consumo Consciente",
  "Gestão de Resíduos",
  "Inclusão Diversidade e Qualidade de Vida no Trabalho",
  "Contratações Sustentáveis",
  "Planejamento e Governança",
  "Educação Socioambiental",
];

const TIPOS_CONTEUDO = [
  "Normativo",
  "Política Pública",
  "Planos",
  "Manual / Guia / Cartilha",
  "Ferramenta / Template",
  "Curso",
  "Infográfico",
  "Webinar / Palestra",
  "Vídeo Educativo",
  "Podcast",
  "Relatório Técnico",
  "Artigo Científico",
  "Portal / Repositório",
  "Notícia / Artigo Web",
  "Boa Prática / Projeto",
  "Busca orientada",
];

const NIVEIS_CONTEUDO = ["Básico", "Intermediário", "Avançado"];

const PREDEFINED_KEYWORDS = [
  "PLS",
  "Licitações Sustentáveis",
  "Resíduos Sólidos",
  "Mudança Climática",
  "Eficiência Energética",
  "Economia Circular",
  "Governança",
  "Logística Reversa",
  "Compras Públicas",
  "Qualidade de Vida no Trabalho",
  "Coleta Seletiva",
  "Pegada de Carbono",
];

const UTILITY_QUESTIONS = [
  "Clareza das respostas fornecidas pelo agente conversacional.",
  "Relevância dos conteúdos sugeridos.",
  "Facilidade de navegação do sistema.",
  "Adequação das recomendações às minhas necessidades institucionais.",
  "Percepção de apoio ao meu autodesenvolvimento de competências.",
];

const SUS_QUESTIONS = [
  "1. Eu acho que gostaria de usar esse sistema com frequência.",
  "2. Eu acho o sistema muito complexo.",
  "3. Eu achei o sistema fácil de usar.",
  "4. Eu acho que precisaria de ajuda de uma pessoa com conhecimentos técnicos para usar esse sistema.",
  "5. Eu acho que as várias funções do sistema estão muito bem integradas.",
  "6. Eu acho que o sistema apresenta muita inconsistência.",
  "7. Eu imagino que as pessoas aprenderão como usar esse sistema muito rapidamente.",
  "8. Eu achei o sistema muito chato de usar.",
  "9. Eu me senti muito confiante ao usar o sistema.",
  "10. Eu precisei aprender várias coisas novas antes de conseguir usar esse sistema.",
];

const state = {
  activeTab: "chat",
  catalog: [],
  pending: [],
  filtered: [],
  selectedAxis: "",
  selectedAuthor: "",
  selectedType: "",
  selectedYears: new Set(),
  selectedKeywords: new Set(),
  search: "",
  recentQueries: loadJson("a3p_recent_queries", [
    "O que é o programa A3P e como implementá-lo?",
    "Quais são as diretrizes para Licitações Sustentáveis e Compras Públicas?",
    "Como estruturar um Plano de Logística Sustentável (PLS)?",
    "Quais as melhores práticas para Gestão de Resíduos e Coleta Seletiva?",
  ]),
  messages: [],
  suggestMessages: [],
  adminMessages: [],
  evalForm: { utility: Array(5).fill(0), sus: Array(10).fill(0), feedback: "" },
};

const dom = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();
  bindEvents();
  buildStaticControls();
  renderEvaluationForm();

  state.pending = loadJson("a3p_pending_items", []);
  const savedCatalog = loadJson("a3p_catalog_items", null);

  try {
    const response = await fetch("catalogo.json", { cache: "no-store" });
    const localCatalog = normalizeItems(await response.json(), "Validado");
    state.catalog = savedCatalog ? normalizeItems(savedCatalog, "Validado") : localCatalog;
  } catch (error) {
    state.catalog = normalizeItems(savedCatalog || [], "Validado");
  }

  state.messages = [
    {
      role: "bot",
      content:
        "Olá! Sou a sua **MentorIA Rede A3P**.\n\nFui desenvolvida como protótipo do projeto GESUNB/UnB para apoiar a exploração de conteúdos e o desenvolvimento de competências sobre responsabilidade socioambiental na Administração Pública.\n\nVocê pode pesquisar materiais, pedir trilhas de aprendizagem, sugerir conteúdos e, ao final, clicar em [Me avalie!](#evaluate).",
      timestamp: new Date(),
    },
  ];
  state.suggestMessages = [
    {
      role: "bot",
      content:
        "Olá! Cole um link ou descreva o material que deseja sugerir. Eu faço uma estrutura preliminar para a ficha de catalogação, e você revisa antes de submeter.",
      timestamp: new Date(),
    },
  ];
  state.adminMessages = [
    {
      role: "bot",
      content:
        "Área de curadoria pronta. Você pode importar CSV, sincronizar a planilha pública, revisar pendências e aprovar itens para o catálogo local.",
      timestamp: new Date(),
    },
  ];

  applyFilters();
  renderAll();
  setTab("chat");
}

function cacheDom() {
  [
    "catalogBadge",
    "pendingBadge",
    "chatMessages",
    "chatForm",
    "chatInput",
    "recentQueries",
    "catalogGrid",
    "visibleTotal",
    "typeStats",
    "yearStats",
    "catalogSearch",
    "axisFilter",
    "authorFilter",
    "topKeywords",
    "activeFilters",
    "downloadCsvButton",
    "toggleStudyButton",
    "studyPanel",
    "studyTopic",
    "generateStudyButton",
    "studyResult",
    "suggestAxes",
    "suggestType",
    "suggestLevel",
    "suggestUrl",
    "suggestTitle",
    "suggestAuthor",
    "suggestYear",
    "suggestCompetence",
    "suggestTheme",
    "suggestKeywords",
    "suggestDescription",
    "submitSuggestionButton",
    "suggestMessages",
    "suggestChatForm",
    "suggestInput",
    "syncSheetButton",
    "importButton",
    "adminDownloadButton",
    "fileInput",
    "pendingSummary",
    "pendingList",
    "adminMessages",
    "adminChatForm",
    "adminInput",
    "evaluationForm",
    "tooltip",
    "authorOptions",
    "themeOptions",
    "competenceOptions",
  ].forEach((id) => {
    dom[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });

  dom.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = dom.chatInput.value.trim();
    if (!query) return;
    dom.chatInput.value = "";
    addRecentQuery(query);
    pushMessage("messages", "user", query);
    setTimeout(() => pushMessage("messages", "bot", answerQuery(query)), 180);
  });

  dom.catalogSearch.addEventListener("input", () => {
    state.search = dom.catalogSearch.value;
    applyFilters();
  });
  dom.axisFilter.addEventListener("change", () => {
    state.selectedAxis = dom.axisFilter.value;
    applyFilters();
  });
  dom.authorFilter.addEventListener("change", () => {
    state.selectedAuthor = dom.authorFilter.value;
    applyFilters();
  });

  dom.downloadCsvButton.addEventListener("click", downloadCSV);
  dom.adminDownloadButton.addEventListener("click", downloadCSV);
  dom.toggleStudyButton.addEventListener("click", () => {
    dom.studyPanel.hidden = !dom.studyPanel.hidden;
  });
  dom.generateStudyButton.addEventListener("click", generateStudyPath);

  dom.suggestChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSuggestionAssistant();
  });
  dom.submitSuggestionButton.addEventListener("click", submitSuggestion);

  dom.importButton.addEventListener("click", () => dom.fileInput.click());
  dom.fileInput.addEventListener("change", handleImportFile);
  dom.syncSheetButton.addEventListener("click", syncGoogleSheet);

  dom.adminChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAdminCommand();
  });
}

function buildStaticControls() {
  dom.suggestAxes.innerHTML = EIXOS_A3P.map(
    (axis) => `<label class="check-chip"><input type="checkbox" value="${escapeAttr(axis)}" />${escapeHtml(axis)}</label>`
  ).join("");

  dom.suggestType.innerHTML = TIPOS_CONTEUDO.map((type) => `<option>${escapeHtml(type)}</option>`).join("");
  dom.suggestLevel.innerHTML = NIVEIS_CONTEUDO.map((level) => `<option>${escapeHtml(level)}</option>`).join("");
  dom.suggestYear.value = new Date().getFullYear();
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll("[data-view]").forEach((view) => {
    view.hidden = view.dataset.view !== tab;
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
}

function renderAll() {
  renderBadges();
  renderRecentQueries();
  renderChat("messages", dom.chatMessages);
  renderChat("suggestMessages", dom.suggestMessages);
  renderChat("adminMessages", dom.adminMessages);
  renderCatalogControls();
  renderCatalogStats();
  renderCatalogGrid();
  renderPending();
  renderDatalists();
  persistLocalState();
}

function renderBadges() {
  dom.catalogBadge.textContent = state.filtered.length;
  dom.pendingBadge.textContent = state.pending.length;
  dom.visibleTotal.textContent = state.filtered.length;
}

function renderRecentQueries() {
  dom.recentQueries.innerHTML = `<span class="recent-label">Recentes</span>${state.recentQueries
    .map((query) => `<button type="button" data-query="${escapeAttr(query)}">${escapeHtml(query)}</button>`)
    .join("")}`;
  dom.recentQueries.querySelectorAll("[data-query]").forEach((button) => {
    button.addEventListener("click", () => {
      dom.chatInput.value = button.dataset.query;
      dom.chatInput.focus();
    });
  });
}

function renderChat(collectionName, container) {
  container.innerHTML = state[collectionName]
    .map((message) => {
      const roleClass = message.role === "user" ? " user" : "";
      const avatar = message.role === "user" ? "U" : "✦";
      return `<div class="message-row${roleClass}">
        <div class="avatar">${avatar}</div>
        <article class="message-bubble">
          ${message.role === "user" ? `<div>${escapeHtml(message.content)}</div>` : markdown(message.content)}
          <div class="message-time">${formatTime(message.timestamp)}</div>
        </article>
      </div>`;
    })
    .join("");

  container.querySelectorAll("a[data-evaluate]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setTab("evaluate");
    });
  });

  container.querySelectorAll("a[data-url]").forEach((link) => {
    const item = allItems().find((candidate) => normalizeUrlForDedup(candidate.url) === normalizeUrlForDedup(link.dataset.url));
    if (!item) return;
    link.addEventListener("mouseenter", (event) => showTooltip(item, event));
    link.addEventListener("mousemove", (event) => positionTooltip(event));
    link.addEventListener("mouseleave", hideTooltip);
  });

  container.scrollTop = container.scrollHeight;
}

function renderCatalogControls() {
  const axes = ["", ...EIXOS_A3P];
  const authors = ["", ...unique(allItems().map((item) => item.autor).filter(Boolean)).sort((a, b) => a.localeCompare(b))];
  fillSelect(dom.axisFilter, axes, "Todos os eixos", state.selectedAxis);
  fillSelect(dom.authorFilter, authors, "Todos os autores", state.selectedAuthor);
}

function renderCatalogStats() {
  const byType = countBy(state.filtered, (item) => item.tipo || "Outros");
  const byYear = countBy(allItems(), (item) => String(item.ano || "").trim());
  const maxYear = Math.max(1, ...Object.values(byYear));
  const years = Object.entries(byYear)
    .filter(([year]) => year && year !== "s.d.")
    .sort((a, b) => String(b[0]).localeCompare(String(a[0])));

  dom.typeStats.innerHTML =
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([type, count]) =>
          `<button class="chip ${state.selectedType === type ? "active" : ""}" data-type="${escapeAttr(type)}">${escapeHtml(type)} <span>${count}</span></button>`
      )
      .join("") || `<span class="chip">Sem dados</span>`;

  dom.typeStats.querySelectorAll("[data-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedType = state.selectedType === button.dataset.type ? "" : button.dataset.type;
      applyFilters();
    });
  });

  dom.yearStats.innerHTML =
    years
      .map(([year, count]) => {
        const height = Math.max(5, Math.round((count / maxYear) * 100));
        return `<button class="year-button ${state.selectedYears.has(year) ? "active" : ""}" data-year="${escapeAttr(year)}">
          <span>${count}</span>
          <span class="bar-shell"><span class="bar" style="height:${height}%"></span></span>
          <span>${escapeHtml(year)}</span>
        </button>`;
      })
      .join("") || `<span class="chip">Sem anos</span>`;

  dom.yearStats.querySelectorAll("[data-year]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleSet(state.selectedYears, button.dataset.year);
      applyFilters();
    });
  });

  const keywordCounts = {};
  allItems().forEach((item) => {
    splitKeywords(item.palavrasChave).forEach((keyword) => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
  });
  const keywords = unique([...PREDEFINED_KEYWORDS, ...Object.keys(keywordCounts)])
    .sort((a, b) => (keywordCounts[b] || 0) - (keywordCounts[a] || 0))
    .slice(0, 12);

  dom.topKeywords.innerHTML = keywords
    .map(
      (keyword) =>
        `<button class="chip ${state.selectedKeywords.has(keyword) ? "active" : ""}" data-keyword="${escapeAttr(keyword)}"># ${escapeHtml(keyword)}</button>`
    )
    .join("");

  dom.topKeywords.querySelectorAll("[data-keyword]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleSet(state.selectedKeywords, button.dataset.keyword);
      applyFilters();
    });
  });

  renderActiveFilters();
}

function renderActiveFilters() {
  const filters = [];
  if (state.selectedAxis) filters.push(["axis", `Eixo: ${state.selectedAxis}`]);
  if (state.selectedAuthor) filters.push(["author", `Autor: ${state.selectedAuthor}`]);
  if (state.selectedType) filters.push(["type", `Formato: ${state.selectedType}`]);
  state.selectedYears.forEach((year) => filters.push([`year:${year}`, `Ano: ${year}`]));
  state.selectedKeywords.forEach((keyword) => filters.push([`keyword:${keyword}`, keyword]));
  if (state.search.trim()) filters.push(["search", `Busca: ${state.search.trim()}`]);

  dom.activeFilters.hidden = filters.length === 0;
  dom.activeFilters.innerHTML = filters
    .map(([key, label]) => `<button class="filter-pill" data-filter="${escapeAttr(key)}">${escapeHtml(label)} ×</button>`)
    .join("");

  dom.activeFilters.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => clearFilter(button.dataset.filter));
  });
}

function renderCatalogGrid() {
  if (!state.filtered.length) {
    dom.catalogGrid.innerHTML = `<div class="empty-state"><h3>Nenhum material encontrado</h3><p>Tente limpar filtros ou pesquisar outro termo.</p></div>`;
    renderBadges();
    return;
  }

  dom.catalogGrid.innerHTML = state.filtered
    .map(
      (item) => `<article class="resource-card">
        <div class="card-top">
          <div class="card-tags">${item.eixo.map((axis) => `<span class="tag">${escapeHtml(axis)}</span>`).join("")}</div>
          <span class="year-tag">${escapeHtml(item.ano || "S/ ano")}</span>
        </div>
        <a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer"><h3>${escapeHtml(item.titulo)}</h3></a>
        <div class="card-tags"><span class="type-tag">${escapeHtml(item.tipo)}</span><span class="level-tag">${escapeHtml(item.nivel)}</span></div>
        <p>${escapeHtml(item.descricao)}</p>
        <div class="keyword-row">${splitKeywords(item.palavrasChave)
          .slice(0, 4)
          .map((keyword) => `<span class="keyword"># ${escapeHtml(keyword)}</span>`)
          .join("")}</div>
        <div class="competence-box"><strong>Desenvolve</strong> ${escapeHtml(item.competencia || "Competências socioambientais aplicadas")}</div>
        <div class="card-footer">
          <button class="action-button" data-plan="${escapeAttr(item.id)}" type="button">Plano</button>
          <a class="access-link" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">Acessar ↗</a>
        </div>
        <div id="plan-${escapeAttr(item.id)}"></div>
      </article>`
    )
    .join("");

  dom.catalogGrid.querySelectorAll("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => renderActionPlan(button.dataset.plan));
  });
  renderBadges();
}

function renderPending() {
  dom.pendingSummary.innerHTML = state.pending.length
    ? `<div class="notice">${state.pending.length} entrada(s) pendente(s) para revisão.</div>`
    : `<div class="notice">Tudo limpo: sem pendências no momento.</div>`;

  dom.pendingList.innerHTML = state.pending
    .map(
      (item) => `<article class="pending-card" data-id="${escapeAttr(item.id)}">
        <main>
          ${pendingField(item, "titulo", "Título", "wide")}
          ${pendingTextarea(item, "descricao", "Descrição", "wide")}
          ${pendingField(item, "url", "URL", "wide")}
          ${pendingField(item, "autor", "Autor")}
          ${pendingField(item, "tipo", "Tipo")}
          ${pendingField(item, "ano", "Ano")}
          ${pendingField(item, "nivel", "Nível")}
          ${pendingField(item, "tema", "Tema")}
          ${pendingField(item, "competencia", "Competência")}
          ${pendingField(item, "palavrasChave", "Palavras-chave", "wide")}
        </main>
        <aside>
          <button class="review-button" data-autofill="${escapeAttr(item.id)}" type="button">Prever campos</button>
          <button class="approve-button" data-approve="${escapeAttr(item.id)}" type="button">Aprovar e salvar</button>
          <button class="reject-button" data-reject="${escapeAttr(item.id)}" type="button">Rejeitar</button>
        </aside>
      </article>`
    )
    .join("");

  dom.pendingList.querySelectorAll("[data-id]").forEach((card) => {
    card.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("input", () => updatePendingField(card.dataset.id, input.dataset.field, input.value));
    });
  });
  dom.pendingList.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => approvePending(button.dataset.approve));
  });
  dom.pendingList.querySelectorAll("[data-reject]").forEach((button) => {
    button.addEventListener("click", () => rejectPending(button.dataset.reject));
  });
  dom.pendingList.querySelectorAll("[data-autofill]").forEach((button) => {
    button.addEventListener("click", () => autofillPending(button.dataset.autofill));
  });
}

function renderDatalists() {
  fillDatalist(dom.authorOptions, unique(allItems().map((item) => item.autor).filter(Boolean)));
  fillDatalist(dom.themeOptions, unique(allItems().map((item) => item.tema).filter(Boolean)));
  fillDatalist(dom.competenceOptions, unique(allItems().map((item) => item.competencia).filter(Boolean)));
}

function renderEvaluationForm() {
  const utility = UTILITY_QUESTIONS.map((question, index) => likertHtml("utility", index, question, "Muito ruim", "Muito bom")).join("");
  const sus = SUS_QUESTIONS.map((question, index) => likertHtml("sus", index, question, "Discordo", "Concordo")).join("");
  dom.evaluationForm.innerHTML = `
    <section class="question-group"><h3>Utilidade percebida</h3>${utility}</section>
    <section class="question-group"><h3>Usabilidade do Sistema (SUS)</h3>${sus}</section>
    <label>Comentários finais<textarea id="evalFeedback" rows="5" placeholder="Impressões, limitações ou ideias..."></textarea></label>
    <div id="evalStatus"></div>
    <button type="submit">Enviar respostas</button>
  `;

  dom.evaluationForm.addEventListener("click", (event) => {
    const button = event.target.closest("[data-likert]");
    if (!button) return;
    const [group, index] = button.dataset.likert.split(":");
    state.evalForm[group][Number(index)] = Number(button.dataset.value);
    renderLikertSelection();
  });
  dom.evaluationForm.addEventListener("submit", submitEvaluation);
}

function renderLikertSelection() {
  dom.evaluationForm.querySelectorAll("[data-likert]").forEach((button) => {
    const [group, index] = button.dataset.likert.split(":");
    button.classList.toggle("selected", state.evalForm[group][Number(index)] === Number(button.dataset.value));
  });
}

function applyFilters() {
  const textTerms = tokenize(`${state.search} ${Array.from(state.selectedKeywords).join(" ")}`);
  state.filtered = allItems()
    .filter((item) => item.status === "Validado")
    .filter((item) => !state.selectedAxis || item.eixo.includes(state.selectedAxis))
    .filter((item) => !state.selectedAuthor || item.autor === state.selectedAuthor)
    .filter((item) => !state.selectedType || item.tipo === state.selectedType)
    .filter((item) => state.selectedYears.size === 0 || state.selectedYears.has(String(item.ano)))
    .filter((item) => {
      if (!textTerms.length) return true;
      const haystack = normalizeText([item.titulo, item.descricao, item.tema, item.competencia, item.palavrasChave, item.autor].join(" "));
      return textTerms.every((term) => haystack.includes(term));
    })
    .sort((a, b) => String(b.ano || "").localeCompare(String(a.ano || "")) || a.titulo.localeCompare(b.titulo));

  renderAll();
}

function answerQuery(query) {
  const lower = normalizeText(query);
  if (lower.includes("avali") || lower.includes("sus") || lower.includes("pesquisa")) {
    return "Claro. A avaliação faz parte da pesquisa GESUNB/UnB e usa itens de utilidade percebida e SUS. Você pode responder agora em [Me avalie!](#evaluate). Em caso de dúvidas, o contato é **pablo.saldo@gmail.com**.";
  }
  if (lower.includes("suger") || lower.includes("indicar material") || lower.includes("novo conteudo")) {
    return "Para sugerir um novo conteúdo, abra a aba **Sugira conteúdo**. Você pode colar o link, deixar campos vazios e pedir ajuda para estruturar a ficha de catalogação.";
  }
  if (lower.includes("curadoria") || lower.includes("validar") || lower.includes("admin")) {
    setTimeout(() => setTab("admin"), 200);
    return "Abrindo a área de **Curadoria**. Lá você pode importar CSV, revisar pendências e aprovar materiais para o catálogo.";
  }

  const results = searchCatalog(query, 5);
  if (!results.length) {
    return "Não encontrei uma correspondência forte no catálogo atual. Tente termos como **PLS**, **compras sustentáveis**, **gestão de resíduos**, **economia de energia** ou **educação socioambiental**.";
  }

  const wantsTrail = /trilha|roteiro|aprendiz|estudo|formativa|sequencia/i.test(query);
  if (wantsTrail) {
    return buildTrailMarkdown(query, results);
  }

  return `Encontrei estes materiais mais aderentes ao que você pediu:\n\n${results
    .slice(0, 3)
    .map((item, index) => `${index + 1}. [${item.titulo}](${item.url})\n   **Por que ajuda:** ${item.descricao}`)
    .join("\n\n")}\n\nSugestão prática: escolha um material, transforme em 3 ações aplicáveis ao seu órgão e registre uma evidência simples de acompanhamento.\n\nDepois da interação, sua avaliação ajuda muito: [Me avalie!](#evaluate).`;
}

function searchCatalog(query, limit = 5) {
  const terms = tokenize(query);
  return allItems()
    .filter((item) => item.status === "Validado")
    .map((item) => {
      const haystack = normalizeText([item.titulo, item.descricao, item.tema, item.competencia, item.palavrasChave, item.eixo.join(" "), item.autor].join(" "));
      let score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 2 : 0), 0);
      if (item.tipo === "Normativo") score += 0.2;
      if (item.qualidade) score += Number(item.qualidade) / 20;
      return { ...item, score };
    })
    .filter((item) => item.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildTrailMarkdown(topic, items) {
  const ordered = [...items].sort((a, b) => levelWeight(a.nivel) - levelWeight(b.nivel));
  return `### Trilha sugerida\nTema: **${escapeMarkdown(topic)}**\n\n${ordered
    .slice(0, 5)
    .map(
      (item, index) =>
        `${index + 1}. [${item.titulo}](${item.url})\n   **Nível:** ${item.nivel}. **Competência:** ${item.competencia || "aplicação prática da A3P"}.`
    )
    .join("\n\n")}\n\n**Tarefa final:** sintetize uma ação de curto prazo, uma ação de médio prazo e um indicador para acompanhar resultado.`;
}

function generateStudyPath() {
  const topic = dom.studyTopic.value.trim();
  if (!topic) return;
  const items = searchCatalog(topic, 6);
  dom.studyResult.innerHTML = `<div class="plan-box">${markdown(items.length ? buildTrailMarkdown(topic, items) : answerQuery(topic))}</div>`;
}

function renderActionPlan(id) {
  const item = allItems().find((candidate) => candidate.id === id);
  const slot = document.getElementById(`plan-${CSS.escape(id)}`);
  if (!item || !slot) return;
  const plan = `### Plano de ação prático\n1. **Diagnosticar:** verifique como o tema "${item.tema}" aparece hoje no órgão.\n2. **Aplicar:** use o material [${item.titulo}](${item.url}) para propor uma medida simples e documentável.\n3. **Evidenciar:** registre responsável, prazo e um indicador de acompanhamento.`;
  slot.innerHTML = `<div class="plan-box">${markdown(plan)}</div>`;
}

function handleSuggestionAssistant() {
  const prompt = dom.suggestInput.value.trim();
  if (!prompt && !dom.suggestUrl.value.trim() && !dom.suggestTitle.value.trim()) return;
  pushMessage("suggestMessages", "user", prompt || "Preencha os campos a partir dos dados disponíveis.");
  dom.suggestInput.value = "";

  const url = extractUrl(prompt) || dom.suggestUrl.value.trim();
  if (url && !dom.suggestUrl.value.trim()) dom.suggestUrl.value = url;

  const inferred = inferItemFromText(`${prompt} ${dom.suggestTitle.value} ${url}`);
  fillSuggestionForm(inferred, false);
  pushMessage(
    "suggestMessages",
    "bot",
    "Estruturei uma ficha preliminar com base no texto informado. Revise título, autoria, eixo e competência antes de submeter para a curadoria."
  );
}

function submitSuggestion() {
  const item = readSuggestionForm();
  const missing = [];
  ["url", "titulo", "autor", "ano", "tipo", "nivel", "tema", "competencia", "palavrasChave", "descricao"].forEach((field) => {
    if (!String(item[field] || "").trim()) missing.push(field);
  });
  if (!item.eixo.length) missing.push("eixos");
  if (missing.length) {
    alert(`Preencha antes: ${missing.join(", ")}`);
    return;
  }

  const duplicate = allItems().find(
    (candidate) =>
      normalizeUrlForDedup(candidate.url) === normalizeUrlForDedup(item.url) ||
      normalizeText(candidate.titulo) === normalizeText(item.titulo)
  );
  if (duplicate && !confirm("Item parecido encontrado. Deseja enviar mesmo assim como atualização para curadoria?")) return;

  state.pending.unshift({ ...item, id: generateUniqueId(), status: duplicate ? "Atualização" : "Pendente", iaScore: "Sugestão enviada" });
  clearSuggestionForm();
  pushMessage("suggestMessages", "bot", "Conteúdo submetido para curadoria. Ele aparece agora na aba **Curadoria**.");
  applyFilters();
  setTab("admin");
}

function handleAdminCommand() {
  const command = dom.adminInput.value.trim();
  if (!command) return;
  dom.adminInput.value = "";
  pushMessage("adminMessages", "user", command);
  const lower = normalizeText(command);
  if (lower.includes("validar") && (lower.includes("todas") || lower.includes("tudo"))) {
    const count = state.pending.length;
    [...state.pending].forEach((item) => approvePending(item.id, false));
    pushMessage("adminMessages", "bot", `${count} item(ns) foram aprovados e movidos para o catálogo local.`);
  } else if (lower.includes("resumo") || lower.includes("pend")) {
    pushMessage("adminMessages", "bot", `Há **${state.pending.length}** pendência(s) e **${state.catalog.length}** material(is) validado(s) no catálogo local.`);
  } else {
    pushMessage("adminMessages", "bot", "Comandos úteis: **validar todas**, **resumo das pendências**, **importar CSV** pelo botão do painel ou **sync planilha**.");
  }
}

function approvePending(id, rerender = true) {
  const item = state.pending.find((candidate) => candidate.id === id);
  if (!item) return;
  state.pending = state.pending.filter((candidate) => candidate.id !== id);
  state.catalog = [{ ...item, status: "Validado" }, ...state.catalog.filter((candidate) => candidate.id !== id)];
  if (rerender) applyFilters();
}

function rejectPending(id) {
  state.pending = state.pending.filter((candidate) => candidate.id !== id);
  applyFilters();
}

function updatePendingField(id, field, value) {
  state.pending = state.pending.map((item) => (item.id === id ? { ...item, [field]: field === "eixo" ? splitCsv(value) : value } : item));
  persistLocalState();
}

function autofillPending(id) {
  const item = state.pending.find((candidate) => candidate.id === id);
  if (!item) return;
  const inferred = inferItemFromText([item.titulo, item.descricao, item.url, item.palavrasChave].join(" "));
  Object.assign(item, {
    ...inferred,
    titulo: item.titulo || inferred.titulo,
    url: item.url || inferred.url,
    autor: item.autor || inferred.autor,
    iaScore: "Preenchimento heurístico",
  });
  renderPending();
  persistLocalState();
}

async function syncGoogleSheet() {
  pushMessage("adminMessages", "bot", "Tentando sincronizar a planilha pública...");
  try {
    const response = await fetch(`${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`);
    if (!response.ok) throw new Error("A planilha não respondeu.");
    const matrix = parseCSV(await response.text());
    const items = normalizeItems(matrixToItems(matrix, "Validado"), "Validado");
    const before = allItems().length;
    mergeImportedItems(items);
    pushMessage("adminMessages", "bot", `Sincronização concluída. Base anterior: **${before}** item(ns). Base atual: **${allItems().length}** item(ns).`);
    applyFilters();
  } catch (error) {
    pushMessage("adminMessages", "bot", "Não consegui sincronizar a planilha agora. A versão local continua disponível e você pode importar um CSV manualmente.");
  }
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const matrix = parseCSV(String(reader.result || ""));
    const items = normalizeItems(matrixToItems(matrix, "Pendente"), "Pendente");
    state.pending = [...items, ...state.pending];
    pushMessage("adminMessages", "bot", `Importação concluída: **${items.length}** entrada(s) enviadas para curadoria.`);
    applyFilters();
  };
  reader.readAsText(file, "utf-8");
  event.target.value = "";
}

function mergeImportedItems(items) {
  const existing = new Set(allItems().map((item) => normalizeUrlForDedup(item.url)).filter(Boolean));
  items.forEach((item) => {
    const key = normalizeUrlForDedup(item.url);
    if (key && existing.has(key)) return;
    existing.add(key);
    if (item.status === "Validado") state.catalog.unshift(item);
    else state.pending.unshift(item);
  });
}

async function submitEvaluation(event) {
  event.preventDefault();
  const feedback = document.getElementById("evalFeedback").value.trim();
  state.evalForm.feedback = feedback;
  const status = document.getElementById("evalStatus");
  if (state.evalForm.utility.includes(0) || state.evalForm.sus.includes(0)) {
    status.innerHTML = `<div class="eval-error">Por favor, responda a todas as perguntas de 1 a 5 antes de enviar.</div>`;
    return;
  }

  const payload = {
    timestamp: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    utility: state.evalForm.utility,
    sus: state.evalForm.sus,
    feedback,
  };
  try {
    await fetch(EVAL_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const saved = loadJson("a3p_avaliacoes_offline", []);
    saved.push(payload);
    localStorage.setItem("a3p_avaliacoes_offline", JSON.stringify(saved));
  }

  dom.evaluationForm.innerHTML = `<div class="eval-success"><h3>Muito obrigado!</h3><p>Sua avaliação foi registrada para apoiar o aprimoramento da MentorIA Rede A3P.</p><button type="button" class="soft-button" id="newEval">Enviar nova resposta</button></div>`;
  document.getElementById("newEval").addEventListener("click", () => {
    state.evalForm = { utility: Array(5).fill(0), sus: Array(10).fill(0), feedback: "" };
    renderEvaluationForm();
  });
}

function downloadCSV() {
  const headers = ["ID", "Título", "Autor_Instituição", "Ano", "Tipo", "Nível", "Eixo", "Tema", "Competência", "Palavras-chave", "URL", "Descrição", "Status"];
  const rows = allItems().map((item) => [
    item.id,
    item.titulo,
    item.autor,
    item.ano,
    item.tipo,
    item.nivel,
    item.eixo.join(", "),
    item.tema,
    item.competencia,
    item.palavrasChave,
    item.url,
    item.descricao,
    item.status,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${new Date().toISOString().slice(0, 10)}-catalogo-a3p.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function allItems() {
  return [...state.catalog, ...state.pending];
}

function normalizeItems(items, fallbackStatus) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const eixo = Array.isArray(item.eixo)
      ? item.eixo
      : [item.eixo, item.eixoSecundario].filter(Boolean);
    const mappedAxes = unique(eixo.map(mapAxisName).filter(Boolean));
    return {
      id: String(item.id || generateUniqueId()),
      titulo: item.titulo || item.title || "Sem título",
      autor: item.autor || item.author || "Autor desconhecido",
      ano: item.ano || item.year || "",
      tipo: item.tipo || item.type || "Notícia / Artigo Web",
      nivel: item.nivel || item.level || "Básico",
      eixo: mappedAxes.length ? mappedAxes : ["Educação Socioambiental"],
      tema: item.tema || item.subject || "",
      competencia: item.competencia || (Array.isArray(item.competencias) ? item.competencias.join(", ") : item.competencias) || "",
      palavrasChave: item.palavrasChave || (Array.isArray(item.palavrasChave) ? item.palavrasChave.join(", ") : "") || (Array.isArray(item.palavrasChave) ? item.palavrasChave.join(", ") : "") || (Array.isArray(item.palavrasChave) ? item.palavrasChave.join(", ") : "") || (Array.isArray(item.palavrasChave) ? item.palavrasChave.join(", ") : ""),
      url: item.url || "",
      descricao: item.descricao || item.resumo || item.description || "",
      qualidade: item.qualidade || "",
      status: item.status || fallbackStatus,
      iaScore: item.iaScore || "",
    };
  }).map((item) => ({
    ...item,
    palavrasChave: item.palavrasChave || inferKeywords(item).join(", "),
  }));
}

function mapAxisName(axis) {
  const clean = normalizeText(axis);
  if (!clean) return "";
  if (clean.includes("consumo") || clean.includes("recursos") || clean.includes("agua") || clean.includes("energia")) return "Consumo Consciente";
  if (clean.includes("resid")) return "Gestão de Resíduos";
  if (clean.includes("inclus") || clean.includes("divers") || clean.includes("qualidade de vida")) return "Inclusão Diversidade e Qualidade de Vida no Trabalho";
  if (clean.includes("contrat") || clean.includes("compras") || clean.includes("licit")) return "Contratações Sustentáveis";
  if (clean.includes("planejamento") || clean.includes("governanca") || clean.includes("pls")) return "Planejamento e Governança";
  if (clean.includes("educ") || clean.includes("capacit") || clean.includes("sensibil")) return "Educação Socioambiental";
  return EIXOS_A3P.find((candidate) => normalizeText(candidate) === clean) || axis;
}

function inferItemFromText(text) {
  const url = extractUrl(text) || "";
  const clean = normalizeText(text);
  const eixo = [];
  EIXOS_A3P.forEach((axis) => {
    if (axisKeywords(axis).some((keyword) => clean.includes(keyword))) eixo.push(axis);
  });
  const firstAxis = eixo[0] || "Educação Socioambiental";
  const title = dom.suggestTitle.value.trim() || titleFromUrl(url) || "Material socioambiental sugerido";
  return {
    titulo: title,
    autor: dom.suggestAuthor.value.trim() || inferAuthor(text),
    ano: dom.suggestYear.value || new Date().getFullYear(),
    tipo: inferType(text),
    nivel: dom.suggestLevel.value || "Básico",
    eixo: eixo.length ? eixo : [firstAxis],
    tema: dom.suggestTheme.value.trim() || firstAxis,
    competencia: dom.suggestCompetence.value.trim() || competenceForAxis(firstAxis),
    palavrasChave: dom.suggestKeywords.value.trim() || inferKeywords({ titulo: title, descricao: text, eixo }).join(", "),
    url,
    descricao: dom.suggestDescription.value.trim() || `Conteúdo indicado para apoiar ações de ${firstAxis.toLowerCase()} no contexto da Administração Pública.`,
  };
}

function inferKeywords(item) {
  const text = normalizeText([item.titulo, item.descricao, item.tema, Array.isArray(item.eixo) ? item.eixo.join(" ") : item.eixo].join(" "));
  return PREDEFINED_KEYWORDS.filter((keyword) => text.includes(normalizeText(keyword))).slice(0, 6);
}

function axisKeywords(axis) {
  return {
    "Consumo Consciente": ["consumo", "energia", "agua", "eficiencia", "desperdicio"],
    "Gestão de Resíduos": ["residuo", "coleta", "reciclagem", "logistica reversa"],
    "Inclusão Diversidade e Qualidade de Vida no Trabalho": ["qualidade", "vida", "diversidade", "inclusao", "trabalho"],
    "Contratações Sustentáveis": ["compra", "contratacao", "licitacao", "aquisicao"],
    "Planejamento e Governança": ["pls", "planejamento", "governanca", "indicador"],
    "Educação Socioambiental": ["educacao", "capacitacao", "curso", "sensibilizacao", "formacao"],
  }[axis] || [];
}

function competenceForAxis(axis) {
  return {
    "Consumo Consciente": "Reduzir desperdícios e monitorar consumo institucional.",
    "Gestão de Resíduos": "Diagnosticar resíduos e estruturar coleta seletiva.",
    "Inclusão Diversidade e Qualidade de Vida no Trabalho": "Promover ambientes inclusivos, saudáveis e colaborativos.",
    "Contratações Sustentáveis": "Aplicar critérios de sustentabilidade em compras e contratos.",
    "Planejamento e Governança": "Planejar, monitorar e comunicar ações socioambientais.",
    "Educação Socioambiental": "Sensibilizar equipes e multiplicar práticas sustentáveis.",
  }[axis] || "Aplicar conhecimentos socioambientais no contexto institucional.";
}

function inferAuthor(text) {
  const clean = normalizeText(text);
  if (clean.includes("enap")) return "Escola Nacional de Adm. Pública (ENAP)";
  if (clean.includes("mma") || clean.includes("meio ambiente")) return "Ministério do Meio Ambiente (MMA)";
  if (clean.includes("tcu")) return "Tribunal de Contas da União (TCU)";
  if (clean.includes("tse")) return "Tribunal Superior Eleitoral (TSE)";
  return "Autor a validar";
}

function inferType(text) {
  const clean = normalizeText(text);
  if (clean.includes("curso")) return "Curso";
  if (clean.includes("video") || clean.includes("youtube")) return "Vídeo Educativo";
  if (clean.includes("portaria") || clean.includes("decreto") || clean.includes("lei")) return "Normativo";
  if (clean.includes("manual") || clean.includes("cartilha") || clean.includes("guia")) return "Manual / Guia / Cartilha";
  return "Notícia / Artigo Web";
}

function fillSuggestionForm(item, overwrite = true) {
  const set = (element, value) => {
    if (overwrite || !element.value) element.value = value || "";
  };
  set(dom.suggestUrl, item.url);
  set(dom.suggestTitle, item.titulo);
  set(dom.suggestAuthor, item.autor);
  set(dom.suggestYear, item.ano);
  set(dom.suggestCompetence, item.competencia);
  set(dom.suggestTheme, item.tema);
  set(dom.suggestKeywords, item.palavrasChave);
  set(dom.suggestDescription, item.descricao);
  dom.suggestType.value = item.tipo || dom.suggestType.value;
  dom.suggestLevel.value = item.nivel || dom.suggestLevel.value;
  dom.suggestAxes.querySelectorAll("input").forEach((input) => {
    input.checked = item.eixo.includes(input.value);
  });
}

function readSuggestionForm() {
  return {
    titulo: dom.suggestTitle.value.trim(),
    autor: dom.suggestAuthor.value.trim(),
    ano: dom.suggestYear.value.trim(),
    tipo: dom.suggestType.value,
    nivel: dom.suggestLevel.value,
    eixo: [...dom.suggestAxes.querySelectorAll("input:checked")].map((input) => input.value),
    tema: dom.suggestTheme.value.trim(),
    competencia: dom.suggestCompetence.value.trim(),
    palavrasChave: dom.suggestKeywords.value.trim(),
    url: dom.suggestUrl.value.trim(),
    descricao: dom.suggestDescription.value.trim(),
  };
}

function clearSuggestionForm() {
  ["suggestUrl", "suggestTitle", "suggestAuthor", "suggestCompetence", "suggestTheme", "suggestKeywords", "suggestDescription"].forEach((id) => {
    dom[id].value = "";
  });
  dom.suggestYear.value = new Date().getFullYear();
  dom.suggestType.value = "Notícia / Artigo Web";
  dom.suggestLevel.value = "Básico";
  dom.suggestAxes.querySelectorAll("input").forEach((input) => {
    input.checked = false;
  });
}

function matrixToItems(matrix, fallbackStatus) {
  if (!matrix.length) return [];
  const headers = matrix[0].map((cell) => normalizeText(cell));
  const findCol = (...names) => headers.findIndex((header) => names.some((name) => header.includes(normalizeText(name))));
  const cols = {
    id: findCol("id"),
    titulo: findCol("titulo", "nome", "material"),
    autor: findCol("autor", "instituicao", "orgao"),
    ano: findCol("ano", "data"),
    tipo: findCol("tipo", "formato"),
    nivel: findCol("nivel"),
    eixo: findCol("eixo"),
    tema: findCol("tema", "assunto"),
    competencia: findCol("competencia", "habilidade"),
    palavrasChave: findCol("palavra", "tag", "chave"),
    url: findCol("url", "link"),
    descricao: findCol("descricao", "resumo"),
    status: findCol("status", "situacao"),
  };
  const get = (row, col) => (col >= 0 && row[col] !== undefined ? String(row[col]).trim() : "");
  return matrix.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    id: get(row, cols.id) || generateUniqueId(),
    titulo: get(row, cols.titulo) || titleFromUrl(get(row, cols.url)) || "Entrada sem título",
    autor: get(row, cols.autor),
    ano: get(row, cols.ano),
    tipo: get(row, cols.tipo),
    nivel: get(row, cols.nivel),
    eixo: splitCsv(get(row, cols.eixo)),
    tema: get(row, cols.tema),
    competencia: get(row, cols.competencia),
    palavrasChave: get(row, cols.palavrasChave),
    url: get(row, cols.url),
    descricao: get(row, cols.descricao),
    status: get(row, cols.status) || fallbackStatus,
  }));
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = clean.split("\n")[0] || "";
  const separator = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const next = clean[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === separator && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n" && !quoted) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((cellValue) => String(cellValue).trim()));
}

function markdown(content) {
  const escaped = escapeHtml(content)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(#evaluate\)/g, '<a href="#evaluate" data-evaluate="true">$1</a>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" data-url="$2">$1</a>')
    .replace(/\n/g, "<br>");
  return escaped;
}

function likertHtml(group, index, question, left, right) {
  return `<div class="likert">
    <p>${escapeHtml(question)}</p>
    <div class="likert-options">
      <span>${escapeHtml(left)}</span>
      ${[1, 2, 3, 4, 5]
        .map((value) => `<button type="button" data-likert="${group}:${index}" data-value="${value}">${value}</button>`)
        .join("")}
      <span>${escapeHtml(right)}</span>
    </div>
  </div>`;
}

function pendingField(item, field, label, cls = "") {
  return `<label class="${cls}">${label}<input data-field="${field}" value="${escapeAttr(Array.isArray(item[field]) ? item[field].join(", ") : item[field] || "")}" /></label>`;
}

function pendingTextarea(item, field, label, cls = "") {
  return `<label class="${cls}">${label}<textarea data-field="${field}" rows="3">${escapeHtml(item[field] || "")}</textarea></label>`;
}

function showTooltip(item, event) {
  dom.tooltip.hidden = false;
  dom.tooltip.innerHTML = `<span class="tag">${escapeHtml(item.eixo[0] || "A3P")}</span><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(item.descricao)}</p><p><strong>${escapeHtml(item.autor)}</strong></p>`;
  positionTooltip(event);
}

function positionTooltip(event) {
  const x = Math.min(event.clientX + 14, window.innerWidth - 340);
  const y = Math.min(event.clientY + 14, window.innerHeight - 220);
  dom.tooltip.style.left = `${Math.max(12, x)}px`;
  dom.tooltip.style.top = `${Math.max(12, y)}px`;
}

function hideTooltip() {
  dom.tooltip.hidden = true;
}

function pushMessage(collectionName, role, content) {
  state[collectionName].push({ role, content, timestamp: new Date() });
  renderChat(collectionName, collectionName === "messages" ? dom.chatMessages : collectionName === "suggestMessages" ? dom.suggestMessages : dom.adminMessages);
}

function clearFilter(filter) {
  if (filter === "axis") state.selectedAxis = "";
  if (filter === "author") state.selectedAuthor = "";
  if (filter === "type") state.selectedType = "";
  if (filter === "search") {
    state.search = "";
    dom.catalogSearch.value = "";
  }
  if (filter.startsWith("year:")) state.selectedYears.delete(filter.slice(5));
  if (filter.startsWith("keyword:")) state.selectedKeywords.delete(filter.slice(8));
  applyFilters();
}

function persistLocalState() {
  localStorage.setItem("a3p_catalog_items", JSON.stringify(state.catalog));
  localStorage.setItem("a3p_pending_items", JSON.stringify(state.pending));
}

function addRecentQuery(query) {
  state.recentQueries = [query, ...state.recentQueries.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 15);
  localStorage.setItem("a3p_recent_queries", JSON.stringify(state.recentQueries));
  renderRecentQueries();
}

function fillSelect(select, values, emptyLabel, selected) {
  select.innerHTML = values
    .map((value, index) => `<option value="${escapeAttr(value)}">${escapeHtml(index === 0 ? emptyLabel : value)}</option>`)
    .join("");
  select.value = selected || "";
}

function fillDatalist(list, values) {
  list.innerHTML = values.map((value) => `<option value="${escapeAttr(value)}"></option>`).join("");
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function splitKeywords(value) {
  return splitCsv(value).filter((keyword) => keyword.length > 1);
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function tokenize(text) {
  const stopwords = new Set(["para", "sobre", "com", "uma", "como", "qual", "quais", "dos", "das", "que", "por", "aos", "nas", "nos", "de", "da", "do", "em", "e", "o", "a"]);
  return normalizeText(text)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopwords.has(token));
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrlForDedup(url) {
  return String(url || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .split("?")[0]
    .split("#")[0];
}

function extractUrl(text) {
  return String(text || "").match(/https?:\/\/[^\s)]+/i)?.[0] || "";
}

function titleFromUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/[-_/]+/g, " ").slice(0, 60);
  } catch {
    return "";
  }
}

function levelWeight(level) {
  return { Básico: 1, Intermediário: 2, Avançado: 3 }[level] || 2;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toggleSet(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateUniqueId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function escapeMarkdown(value) {
  return String(value || "").replace(/[*_[\]()]/g, "");
}

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
