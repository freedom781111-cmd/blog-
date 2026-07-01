
(function () {
  const blog = window.DESFASE_BLOG;
  if (!blog || !Array.isArray(blog.posts)) {
    return;
  }

  const posts = blog.posts;
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
    translateLink: document.getElementById("translateLink"),
    decreaseText: document.getElementById("decreaseText"),
    increaseText: document.getElementById("increaseText"),
    filterButtons: document.querySelectorAll("[data-filter]"),
  };

  let query = "";
  let activeFilter = "all";
  const readerSizeStorageKey = "readerSizeCompact";
  let readerSize = Number(localStorage.getItem(readerSizeStorageKey) || "1.06");
  readerSize = Math.min(1.26, Math.max(0.95, readerSize));

  function normalize(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("es").format(value);
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

  function translationUrl(slug) {
    const sourceUrl = canonicalPostUrl(slug);
    return `https://translate.google.com/translate?sl=es&tl=en&u=${encodeURIComponent(sourceUrl)}`;
  }

  function activeSlug() {
    const match = window.location.hash.match(/^#entrada\/([^?]+)/);
    return match ? decodeURIComponent(match[1]) : posts[0].slug;
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
      const haystack = normalize([post.title, post.displayTitle, post.excerpt, post.category, post.tags.join(" ")].join(" "));
      return haystack.includes(needle);
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

    selectors.resultCount.textContent = filtered.length === 1 ? "1 resultado" : `${filtered.length} resultados`;

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No encontré entradas con ese filtro.";
      selectors.postList.replaceChildren(empty);
      return;
    }

    filtered.forEach((post) => {
      const card = document.createElement("a");
      card.className = `post-card${post.slug === currentSlug ? " is-active" : ""}`;
      card.href = postUrl(post.slug);
      card.setAttribute("aria-current", post.slug === currentSlug ? "true" : "false");

      const meta = document.createElement("div");
      meta.className = "post-card__meta";
      meta.textContent = `${post.category} · ${post.dateLabel} · ${post.readingTime} min`;

      const title = document.createElement("h3");
      title.textContent = post.displayTitle || post.title;

      const excerpt = document.createElement("p");
      excerpt.textContent = post.excerpt;

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
    const previousPost = posts[activeIndex - 1];
    const nextPost = posts[activeIndex + 1];
    const header = document.createElement("header");
    header.className = "reader__head";

    const meta = document.createElement("div");
    meta.className = "reader__meta";
    meta.append(`${post.category} · ${post.dateLabel} · ${post.readingTime} min · ${formatNumber(post.wordCount)} palabras`);
    if (post.pageCount) {
      meta.append(` · ${post.pageCount} pág.`);
    }
    post.tags.forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "tag";
      pill.textContent = tag;
      meta.appendChild(pill);
    });

    const title = document.createElement("h2");
    title.textContent = post.displayTitle || post.title;

    const excerpt = document.createElement("p");
    excerpt.className = "reader__excerpt";
    excerpt.textContent = post.excerpt;

    const actions = document.createElement("div");
    actions.className = "reader__actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copiar enlace";
    copy.addEventListener("click", async () => {
      const url = canonicalPostUrl(post.slug);
      try {
        await navigator.clipboard.writeText(url);
        copy.textContent = "Enlace copiado";
        window.setTimeout(() => {
          copy.textContent = "Copiar enlace";
        }, 1600);
      } catch (error) {
        copy.textContent = "No se pudo copiar";
      }
    });

    actions.appendChild(copy);

    if (post.pdfUrl) {
      const pdf = document.createElement("a");
      pdf.href = post.pdfUrl;
      pdf.target = "_blank";
      pdf.rel = "noopener";
      pdf.textContent = "Abrir PDF";
      actions.appendChild(pdf);
    }

    header.append(meta, title, excerpt, actions);

    const body = document.createElement("div");
    body.className = `reader__body reader__body--${post.kind}`;
    post.paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      body.appendChild(p);
    });

    const readerNav = document.createElement("nav");
    readerNav.className = "reader__nav";
    readerNav.setAttribute("aria-label", "Navegación entre textos");

    function buildNavLink(targetPost, label, direction) {
      const link = document.createElement("a");
      link.href = postUrl(targetPost.slug);
      link.className = `reader__nav-link reader__nav-link--${direction}`;
      const small = document.createElement("span");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = targetPost.displayTitle || targetPost.title;
      link.append(small, strong);
      return link;
    }

    if (previousPost) {
      readerNav.appendChild(buildNavLink(previousPost, "Anterior", "previous"));
    }
    if (nextPost) {
      readerNav.appendChild(buildNavLink(nextPost, "Siguiente", "next"));
    }

    selectors.reader.replaceChildren(header, body, readerNav);
    document.title = `${post.displayTitle || post.title} | ${blog.title}`;

    if (blog.siteUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalPostUrl(post.slug);
    }
  }

  function route() {
    const slug = activeSlug();
    renderReader(slug);
    renderList();
    if (selectors.translateLink) {
      selectors.translateLink.href = translationUrl(slug);
    }
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

  renderStats();
  renderFilters();
  applyReaderSize();
  bindEvents();
  route();
  updateProgress();
})();
