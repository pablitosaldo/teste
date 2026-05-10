const state = {
  catalog: [],
  filtered: [],
  axes: [],
};

const axisFilter = document.querySelector("#axisFilter");
const levelFilter = document.querySelector("#levelFilter");
const profileFilter = document.querySelector("#profileFilter");
const messages = document.querySelector("#messages");
const chatForm = document.querySelector("#chatForm");
const questionInput = document.querySelector("#questionInput");
const catalogGrid = document.querySelector("#catalogGrid");
const totalItems = document.querySelector("#totalItems");
const avgQuality = document.querySelector("#avgQuality");
const trailButton = document.querySelector("#trailButton");
const evaluationForm = document.querySelector("#evaluationForm");
const evaluationResult = document.querySelector("#evaluationResult");

const axisHints = {
  "Consumo consciente": ["agua", "energia", "recursos", "consumo", "economia", "desperdicio"],
  "Gestão de resíduos": ["residuo", "residuos", "coleta", "reciclagem", "lixo", "destinacao"],
  "Inclusão, diversidade e qualidade de vida no trabalho": ["qualidade", "vida", "diversidade", "inclusao", "trabalho", "saude"],
  "Contratações sustentáveis": ["compras", "contratacoes", "licitacao", "aquisicoes", "contratos"],
  "Planejamento e governança": ["governanca", "pls", "planejamento", "indicadores", "metas", "portaria"],
  "Educação socioambiental": ["educacao", "capacitacao", "sensibilizacao", "curso", "trilha", "formacao"],
};

const stopwords = new Set([
  "para",
  "sobre",
  "com",
  "uma",
  "como",
  "qual",
  "quais",
  "dos",
  "das",
  "que",
  "por",
  "aos",
  "nas",
  "nos",
  "de",
  "da",
  "do",
  "em",
  "e",
  "o",
  "a",
]);

init();

async function init() {
  try {
    const response = await fetch("catalogo.json");
    state.catalog = await response.json();
  } catch (error) {
    addMessage("agent", "Não consegui carregar o catálogo. Abra esta pasta por um servidor local para permitir o carregamento do JSON.");
    return;
  }

  state.axes = [...new Set(state.catalog.flatMap((item) => [item.eixo, item.eixoSecundario]).filter(Boolean))].sort();
  state.axes.forEach((axis) => {
    const option = document.createElement("option");
    option.value = axis;
    option.textContent = axis;
    axisFilter.append(option);
  });

  applyFilters();
  bindEvents();
  addMessage(
    "agent",
    `<h3>Olá. Sou o agente A3P.</h3>
    <p>Posso localizar conteúdos, sugerir trilhas por eixo e indicar aplicações práticas para desenvolvimento de competências socioambientais.</p>
    <p>Experimente pedir: <strong>“montar trilha de compras sustentáveis para iniciantes”</strong>.</p>`
  );
}

function bindEvents() {
  axisFilter.addEventListener("change", applyFilters);
  levelFilter.addEventListener("change", applyFilters);
  profileFilter.addEventListener("change", () => {
    addMessage("agent", `Perfil ajustado para <strong>${profileFilter.selectedOptions[0].textContent}</strong>. Vou priorizar recomendações compatíveis nas próximas respostas.`);
  });

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = questionInput.value.trim();
    if (!question) return;
    addMessage("user", escapeHtml(question));
    questionInput.value = "";
    respond(question);
  });

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      questionInput.value = button.dataset.prompt;
      chatForm.requestSubmit();
    });
  });

  trailButton.addEventListener("click", () => {
    const axis = axisFilter.value || inferAxis("");
    const title = axis ? `trilha para ${axis}` : "trilha formativa A3P";
    addMessage("user", `Gerar ${title}`);
    respond(`Gerar ${title}`, { forceTrail: true });
  });

  evaluationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(evaluationForm);
    const values = ["clareza", "relevancia", "confianca", "competencias"].map((key) => Number(data.get(key)));
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const record = {
      createdAt: new Date().toISOString(),
      clareza: data.get("clareza"),
      relevancia: data.get("relevancia"),
      confianca: data.get("confianca"),
      competencias: data.get("competencias"),
      observacoes: data.get("observacoes"),
    };
    const saved = JSON.parse(localStorage.getItem("a3p-avaliacoes") || "[]");
    saved.push(record);
    localStorage.setItem("a3p-avaliacoes", JSON.stringify(saved));
    evaluationResult.textContent = `Avaliação registrada neste navegador. Média de utilidade/percepção: ${avg.toFixed(1)} de 5.`;
    evaluationForm.reset();
  });
}

function applyFilters() {
  const axis = axisFilter.value;
  const level = levelFilter.value;
  state.filtered = state.catalog.filter((item) => {
    const axisMatch = !axis || item.eixo === axis || item.eixoSecundario === axis;
    const levelMatch = !level || item.nivel === level;
    return axisMatch && levelMatch;
  });
  renderCatalog(state.filtered);
  totalItems.textContent = state.filtered.length;
  const quality = state.filtered.reduce((sum, item) => sum + item.qualidade, 0) / Math.max(state.filtered.length, 1);
  avgQuality.textContent = quality.toFixed(1);
}

function respond(question, options = {}) {
  const axis = axisFilter.value || inferAxis(question);
  const ranked = search(question, axis);
  const wantsTrail = options.forceTrail || /trilha|roteiro|sequencia|aprendizagem|formativa/i.test(question);
  const wantsCataloging = /catalog|classific|metadad|curador|curadoria|ficha/i.test(question);

  if (wantsCataloging) {
    addMessage("agent", buildCatalogingAnswer(question, ranked));
    return;
  }

  if (wantsTrail) {
    addMessage("agent", buildTrailAnswer(axis, ranked));
    return;
  }

  addMessage("agent", buildSearchAnswer(axis, ranked));
}

function search(question, preferredAxis = "") {
  const tokens = tokenize(question);
  return state.catalog
    .map((item) => {
      const text = [
        item.titulo,
        item.autor,
        item.tipo,
        item.publico,
        item.nivel,
        item.eixo,
        item.eixoSecundario,
        item.tema,
        item.resumo,
        ...(item.competencias || []),
        ...(item.palavrasChave || []),
      ]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      let score = tokens.reduce((sum, token) => sum + (text.includes(token) ? 2 : 0), 0);
      if (preferredAxis && (item.eixo === preferredAxis || item.eixoSecundario === preferredAxis)) score += 5;
      if (item.nivel === levelFilter.value) score += 2;
      score += item.qualidade / 10;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function inferAxis(question) {
  const text = tokenize(question).join(" ");
  let best = "";
  let bestScore = 0;
  Object.entries(axisHints).forEach(([axis, hints]) => {
    const score = hints.reduce((sum, hint) => sum + (text.includes(hint) ? 1 : 0), 0);
    if (score > bestScore) {
      best = axis;
      bestScore = score;
    }
  });
  return best;
}

function buildSearchAnswer(axis, items) {
  const usable = items.filter((item) => item.score > 1).slice(0, 3);
  if (!usable.length) {
    return `<h3>Não encontrei uma correspondência forte.</h3>
    <p>Posso buscar por eixo, tema, tipo de recurso ou competência. Tente termos como “resíduos”, “compras sustentáveis”, “PLS” ou “sensibilização”.</p>`;
  }

  return `<h3>${axis ? `Conteúdos para ${axis}` : "Conteúdos recomendados"}</h3>
  <p>Priorizei fontes com melhor aderência temática, qualidade do registro e utilidade para o perfil <strong>${profileFilter.selectedOptions[0].textContent}</strong>.</p>
  ${resourceList(usable)}
  <p><strong>Aplicação prática:</strong> comece pelo recurso mais normativo ou introdutório, extraia 3 ações aplicáveis ao órgão e registre evidências para posterior avaliação da trilha.</p>`;
}

function buildTrailAnswer(axis, items) {
  const candidates = items.slice(0, 4);
  const title = axis || "responsabilidade socioambiental na Administração Pública";
  const ordered = orderTrail(candidates);
  return `<h3>Trilha sugerida: ${escapeHtml(title)}</h3>
  <ol>
    ${ordered
      .map(
        (item, index) => `<li>
          <strong>${index + 1}. ${escapeHtml(item.titulo)}</strong><br>
          ${escapeHtml(item.resumo)}<br>
          <span class="quality">Competências:</span> ${escapeHtml(item.competencias.slice(0, 3).join(", "))}
        </li>`
      )
      .join("")}
  </ol>
  <p><strong>Tarefa de aprendizagem:</strong> após cada item, produza uma ação possível para o seu contexto institucional e associe a ação a um indicador simples de acompanhamento.</p>
  ${resourceList(ordered)}`;
}

function buildCatalogingAnswer(question, items) {
  const axis = inferAxis(question) || axisFilter.value || "eixo A3P a validar";
  return `<h3>Ficha de catalogação assistida</h3>
  <p>Para registrar um novo conteúdo, eu usaria esta estrutura mínima: título, autor institucional, ano, URL, tipo, público-alvo, nível, resumo, palavras-chave, eixo principal, tema, competências e status de validação.</p>
  <p><strong>Classificação preliminar sugerida:</strong> ${escapeHtml(axis)}.</p>
  <p><strong>Checklist de qualidade:</strong> atualidade, autoria identificada, completude informacional, acessibilidade do link e aderência temática, com pontuação de 0 a 2 por critério.</p>
  <p>Itens próximos no catálogo, úteis para comparação:</p>
  ${resourceList(items.slice(0, 3))}`;
}

function orderTrail(items) {
  const levelWeight = { Básico: 1, Intermediário: 2, Avançado: 3 };
  return [...items].sort((a, b) => {
    const levelDiff = (levelWeight[a.nivel] || 2) - (levelWeight[b.nivel] || 2);
    if (levelDiff !== 0) return levelDiff;
    return b.qualidade - a.qualidade;
  });
}

function resourceList(items) {
  return `<ul class="source-list">
    ${items
      .map(
        (item) => `<li>
          <a href="${item.url}" target="_blank" rel="noreferrer">${escapeHtml(item.titulo)}</a>
          <span>(${escapeHtml(item.tipo)}, ${escapeHtml(item.nivel)}, qualidade ${item.qualidade}/10)</span>
        </li>`
      )
      .join("")}
  </ul>`;
}

function renderCatalog(items) {
  catalogGrid.innerHTML = items
    .map(
      (item) => `<article class="resource-card">
        <div class="tag-row">
          <span class="tag">${escapeHtml(item.eixo)}</span>
          <span class="tag">${escapeHtml(item.nivel)}</span>
        </div>
        <h3>${escapeHtml(item.titulo)}</h3>
        <p>${escapeHtml(item.resumo)}</p>
        <p><strong>Tema:</strong> ${escapeHtml(item.tema)}</p>
        <p><strong>Competências:</strong> ${escapeHtml(item.competencias.join(", "))}</p>
        <a href="${item.url}" target="_blank" rel="noreferrer">Abrir fonte</a>
      </article>`
    )
    .join("");
}

function addMessage(type, html) {
  const node = document.createElement("article");
  node.className = `message ${type}`;
  node.innerHTML = html;
  messages.append(node);
  messages.scrollTop = messages.scrollHeight;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopwords.has(token));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
