
(function () {
  const blog = window.DESFASE_BLOG;
  if (!blog || !Array.isArray(blog.posts)) {
    return;
  }

  const posts = blog.posts;
  const copy = {
      locale: "es",
      title: blog.title,
      description: blog.description,
      navTexts: "Textos",
      navReader: "Lectura",
      kicker: "Blog / lectura crítica",
      viewTexts: "Ver textos",
      startReading: "Empezar a leer",
      entries: "entradas",
      words: "palabras",
      readings: "lecturas",
      quickIndex: "Índice rápido",
      entriesTitle: "Entradas y lecturas",
      search: "Buscar",
      searchPlaceholder: "Percepción, archivo, cierre...",
      all: "Todo",
      essay: "Ensayo",
      reading: "Lecturas",
      index: "Índice",
      result: "resultado",
      results: "resultados",
      noResults: "No encontré entradas con ese filtro.",
      copyLink: "Copiar enlace",
      copied: "Enlace copiado",
      copyFailed: "No se pudo copiar",
      previous: "Anterior",
      next: "Siguiente",
      pages: "pág.",
      footer: "Lectura crítica. Sin descargas PDF.",
      blogLabel: "Blog",
      readingLabel: "Lectura crítica",
  };

  const selectors = {
    progressBar: document.getElementById("progressBar"),
    entryCount: document.getElementById("entryCount"),
    wordCount: document.getElementById("wordCount"),
    readingCount: document.getElementById("readingCount"),
    resultCount: document.getElementById("resultCount"),
    postList: document.getElementById("postList"),
    reader: document.getElementById("reader"),
    searchInput: document.getElementById("searchInput"),
    firstPostLink: document.getElementById("firstPostLink"),
    decreaseText: document.getElementById("decreaseText"),
    increaseText: document.getElementById("increaseText"),
    filterButtons: document.querySelectorAll("[data-filter]"),
    navLinks: document.querySelectorAll(".site-header nav > a"),
    kicker: document.querySelector(".kicker"),
    blogTitle: document.getElementById("blogTitle"),
    lead: document.querySelector(".lead"),
    primaryButton: document.querySelector(".button--primary"),
    statLabels: document.querySelectorAll(".stats dd"),
    toolbarEyebrow: document.querySelector(".toolbar .eyebrow"),
    toolbarTitle: document.querySelector(".toolbar h2"),
    searchLabel: document.querySelector(".search span"),
    indexTitle: document.querySelector(".index-header h2"),
    footerNote: document.querySelector(".site-footer p:last-child"),
  };

  let query = "";
  let activeFilter = "all";
  const language = "es";
  const readerSizeStorageKey = "readerSizeCompact";
  let readerSize = Number(localStorage.getItem(readerSizeStorageKey) || "1.06");
  readerSize = Math.min(1.26, Math.max(0.95, readerSize));

  function ui() {
    return copy;
  }

  function normalize(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(ui().locale).format(value);
  }

  function formatDate(post) {
    const date = new Date(`${post.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return post.dateLabel;
    }
    return new Intl.DateTimeFormat(ui().locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function postUrl(slug) {
    return `#entrada/${slug}`;
  }

  function canonicalPostUrl(slug) {
    const configuredUrl = String(blog.siteUrl || "");
    const configuredIsLocal = /localhost|127\.0\.0\.1|\[::1\]/.test(configuredUrl);
    if (configuredUrl && !configuredIsLocal) {
      return `${blog.siteUrl}${postUrl(slug)}`;
    }
    return `${window.location.href.split("#")[0]}${postUrl(slug)}`;
  }

  function activeSlug() {
    const match = window.location.hash.match(/^#entrada\/([^?]+)/);
    return match ? decodeURIComponent(match[1]) : posts[0].slug;
  }

  function localizedPost(post) {
    return {
      title: post.title,
      displayTitle: post.displayTitle || post.title,
      category: post.category,
      sourceLabel: post.sourceLabel,
      excerpt: post.excerpt,
      tags: post.tags,
      paragraphs: post.paragraphs,
    };
  }

  function matchingPosts() {
    const needle = normalize(query.trim());
    return posts.filter((post) => {
      const matchesKind = activeFilter === "all" || post.kind === activeFilter;
      if (!matchesKind) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const localized = localizedPost(post);
      const haystack = normalize([
        localized.title,
        localized.displayTitle,
        localized.excerpt,
        localized.category,
        localized.tags.join(" "),
        post.title,
        post.displayTitle,
        post.excerpt,
        post.tags.join(" "),
      ].join(" "));
      return haystack.includes(needle);
    });
  }

  function renderStaticText() {
    const labels = ui();
    document.documentElement.lang = language;
    if (selectors.navLinks[0]) selectors.navLinks[0].textContent = labels.navTexts;
    if (selectors.navLinks[1]) selectors.navLinks[1].textContent = labels.navReader;
    if (selectors.kicker) selectors.kicker.textContent = labels.kicker;
    if (selectors.blogTitle) selectors.blogTitle.textContent = labels.title;
    if (selectors.lead) selectors.lead.textContent = labels.description;
    if (selectors.primaryButton) selectors.primaryButton.textContent = labels.viewTexts;
    if (selectors.firstPostLink) selectors.firstPostLink.textContent = labels.startReading;
    if (selectors.statLabels[0]) selectors.statLabels[0].textContent = labels.entries;
    if (selectors.statLabels[1]) selectors.statLabels[1].textContent = labels.words;
    if (selectors.statLabels[2]) selectors.statLabels[2].textContent = labels.readings;
    if (selectors.toolbarEyebrow) selectors.toolbarEyebrow.textContent = labels.quickIndex;
    if (selectors.toolbarTitle) selectors.toolbarTitle.textContent = labels.entriesTitle;
    if (selectors.searchLabel) selectors.searchLabel.textContent = labels.search;
    if (selectors.searchInput) selectors.searchInput.placeholder = labels.searchPlaceholder;
    if (selectors.indexTitle) selectors.indexTitle.textContent = labels.index;
    if (selectors.footerNote) selectors.footerNote.textContent = labels.footer;
    selectors.filterButtons.forEach((button) => {
      button.textContent = labels[button.dataset.filter] || button.textContent;
    });
  }

  function renderStats() {
    selectors.entryCount.textContent = formatNumber(posts.length);
    selectors.wordCount.textContent = formatNumber(posts.reduce((total, post) => total + post.wordCount, 0));
    selectors.readingCount.textContent = formatNumber(posts.filter((post) => post.kind === "reading").length);
    selectors.firstPostLink.href = postUrl(posts[0].slug);
  }

  function renderFilters() {
    selectors.filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === activeFilter);
    });
  }

  function keepActiveCardVisible() {
    const activeCard = selectors.postList.querySelector(".post-card.is-active");
    const scroller = selectors.postList.closest(".post-index");
    if (!activeCard || !scroller || window.matchMedia("(max-width: 900px)").matches) {
      return;
    }
    scroller.scrollTop = Math.max(0, activeCard.offsetTop - 64);
  }

  function renderList() {
    const filtered = matchingPosts();
    const currentSlug = activeSlug();
    const fragment = document.createDocumentFragment();
    const labels = ui();

    selectors.resultCount.textContent = filtered.length === 1
      ? `1 ${labels.result}`
      : `${formatNumber(filtered.length)} ${labels.results}`;

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = labels.noResults;
      selectors.postList.replaceChildren(empty);
      return;
    }

    filtered.forEach((post) => {
      const localized = localizedPost(post);
      const card = document.createElement("a");
      card.className = `post-card${post.slug === currentSlug ? " is-active" : ""}`;
      card.href = postUrl(post.slug);
      card.setAttribute("aria-current", post.slug === currentSlug ? "true" : "false");

      const meta = document.createElement("div");
      meta.className = "post-card__meta";
      meta.textContent = `${localized.category} · ${formatDate(post)} · ${post.readingTime} min`;

      const title = document.createElement("h3");
      title.textContent = localized.displayTitle || localized.title;

      const excerpt = document.createElement("p");
      excerpt.textContent = localized.excerpt;

      card.append(meta, title, excerpt);
      fragment.appendChild(card);
    });

    selectors.postList.replaceChildren(fragment);
    keepActiveCardVisible();
  }

  function renderReader(slug) {
    const foundIndex = posts.findIndex((item) => item.slug === slug);
    const activeIndex = foundIndex >= 0 ? foundIndex : 0;
    const post = posts[activeIndex];
    const localized = localizedPost(post);
    const previousPost = posts[activeIndex - 1];
    const nextPost = posts[activeIndex + 1];
    const labels = ui();
    const header = document.createElement("header");
    header.className = "reader__head";

    const meta = document.createElement("div");
    meta.className = "reader__meta";
    meta.append(`${localized.category} · ${formatDate(post)} · ${post.readingTime} min · ${formatNumber(post.wordCount)} ${labels.words}`);
    localized.tags.forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "tag";
      pill.textContent = tag;
      meta.appendChild(pill);
    });

    const title = document.createElement("h2");
    title.textContent = localized.displayTitle || localized.title;

    const excerpt = document.createElement("p");
    excerpt.className = "reader__excerpt";
    excerpt.textContent = localized.excerpt;

    const actions = document.createElement("div");
    actions.className = "reader__actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = labels.copyLink;
    copyButton.addEventListener("click", async () => {
      const url = canonicalPostUrl(post.slug);
      try {
        await navigator.clipboard.writeText(url);
        copyButton.textContent = labels.copied;
        window.setTimeout(() => {
          copyButton.textContent = ui().copyLink;
        }, 1600);
      } catch (error) {
        copyButton.textContent = labels.copyFailed;
      }
    });

    actions.appendChild(copyButton);
    header.append(meta, title, excerpt);
    header.appendChild(actions);

    const body = document.createElement("div");
    body.className = `reader__body reader__body--${post.kind}`;
    body.lang = language;
    localized.paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      body.appendChild(p);
    });

    const readerNav = document.createElement("nav");
    readerNav.className = "reader__nav";
    readerNav.setAttribute("aria-label", "Navegación entre textos");

    function buildNavLink(targetPost, label, direction) {
      const target = localizedPost(targetPost);
      const link = document.createElement("a");
      link.href = postUrl(targetPost.slug);
      link.className = `reader__nav-link reader__nav-link--${direction}`;
      const small = document.createElement("span");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = target.displayTitle || target.title;
      link.append(small, strong);
      return link;
    }

    if (previousPost) {
      readerNav.appendChild(buildNavLink(previousPost, labels.previous, "previous"));
    }
    if (nextPost) {
      readerNav.appendChild(buildNavLink(nextPost, labels.next, "next"));
    }

    selectors.reader.replaceChildren(header, body, readerNav);
    document.title = `${localized.displayTitle || localized.title} | ${labels.title}`;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && blog.siteUrl) {
      canonical.href = canonicalPostUrl(post.slug);
    }
  }

  function renderAll() {
    renderStaticText();
    renderStats();
    renderFilters();
    renderReader(activeSlug());
    renderList();
    updateProgress();
  }

  function route() {
    renderReader(activeSlug());
    renderList();
  }

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? (window.scrollY / max) * 100 : 0;
    selectors.progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
  }

  function applyReaderSize() {
    document.documentElement.style.setProperty("--reader-size", `${readerSize}rem`);
    localStorage.setItem(readerSizeStorageKey, String(readerSize));
  }

  function bindEvents() {
    selectors.searchInput.addEventListener("input", (event) => {
      query = event.target.value;
      renderList();
    });

    selectors.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        renderFilters();
        const filtered = matchingPosts();
        if (filtered.length && !filtered.some((post) => post.slug === activeSlug())) {
          window.location.hash = postUrl(filtered[0].slug);
          return;
        }
        renderList();
      });
    });

    selectors.decreaseText.addEventListener("click", () => {
      readerSize = Math.max(0.95, Number((readerSize - 0.05).toFixed(2)));
      applyReaderSize();
    });

    selectors.increaseText.addEventListener("click", () => {
      readerSize = Math.min(1.26, Number((readerSize + 0.05).toFixed(2)));
      applyReaderSize();
    });

    window.addEventListener("hashchange", route);
    window.addEventListener("scroll", updateProgress, { passive: true });
  }

  applyReaderSize();
  bindEvents();
  renderAll();
})();
