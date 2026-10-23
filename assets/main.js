(function () {
  "use strict";

  var TYPE_LABEL = { video: "视频", document: "文档", file: "文件", image: "图集" };
  var DOC_ICON = { pdf: "📄", word: "📝", ppt: "📊" };
  var FILE_ICON = { zip: "🗜️", pdf: "📄", docx: "📝", xlsx: "📈", png: "🖼️", jpg: "🖼️", default: "📎" };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function nl2br(s) { return esc(s).replace(/\n/g, "<br>"); }

  function chip(text) {
    var s = el("span", "work-card__skill");
    s.textContent = text;
    return s;
  }
  function skillsInto(container, skills) {
    (skills || []).forEach(function (s) { container.appendChild(chip(s)); });
  }
  function metaRow(w) {
    return "<span>" + esc(w.role || "") + "</span><span>" + esc(w.date || "") + "</span>";
  }
  function codeBadge(w) {
    if (!w.extractCode) return "";
    return '<span class="work-card__code">提取码 ' + esc(w.extractCode) + "</span>";
  }
  function extLink(w) {
    var isBaidu = (w.videoLink || w.docUrl || "").indexOf("pan.baidu.com") !== -1;
    var label = isBaidu ? "网盘查看 ↗" : "观看成片 ↗";
    return '<a class="work-card__btn work-card__btn--primary" href="' + esc(w.videoLink) + '" target="_blank" rel="noopener noreferrer">' + label + "</a>";
  }
  function appendGallery(card, w, altSuffix) {
    if (!w.gallery || !w.gallery.length) return;
    var gallery = el("div", "work-card__gallery");
    w.gallery.forEach(function (src) {
      var im = el("img");
      im.src = src; im.alt = w.title + altSuffix;
      im.loading = "lazy"; im.width = 600; im.height = 450;
      im.addEventListener("click", function () { openLightbox(src, w.title); });
      gallery.appendChild(im);
    });
    $(".work-card__body", card).appendChild(gallery);
  }

  function renderVideo(w) {
    var card = el("article", "work-card reveal");
    var media = w.videoFile
      ? '<video class="work-card__video" controls playsinline preload="metadata" poster="' + esc(w.thumbnail) + '">' +
          '<source src="' + esc(w.videoFile) + '" type="video/mp4">' +
          '<a href="' + esc(w.videoLink || w.videoFile) + '" target="_blank" rel="noopener noreferrer">观看成片 ↗</a>' +
        "</video>"
      : '<img src="' + esc(w.thumbnail) + '" alt="' + esc(w.title) + '封面" loading="lazy" width="600" height="400">';
    card.innerHTML =
      '<div class="work-card__media' + (w.videoFile ? " work-card__media--video" : "") + '">' +
        '<span class="work-card__type-tag">' + TYPE_LABEL.video + "</span>" +
        media +
        (w.duration ? '<span class="work-card__badge">' + esc(w.duration) + "</span>" : "") +
      "</div>" +
      '<div class="work-card__body">' +
        '<h3 class="work-card__title">' + esc(w.title) + "</h3>" +
        '<p class="work-card__tagline">' + esc(w.tagline) + "</p>" +
        '<p class="work-card__desc">' + esc(w.description) + "</p>" +
        '<div class="work-card__skills"></div>' +
        '<div class="work-card__meta">' + metaRow(w) + "</div>" +
        '<div class="work-card__actions">' + extLink(w) + codeBadge(w) + "</div>" +
        (w.scriptExcerpt ?
          '<details class="work-card__details"><summary class="work-card__summary">剧本节选</summary>' +
          '<p class="work-card__excerpt">' + nl2br(w.scriptExcerpt) + "</p></details>" : "") +
      "</div>";
    skillsInto($(".work-card__skills", card), w.skills);
    appendGallery(card, w, "分镜图");
    return card;
  }

  function renderDocument(w) {
    var card = el("article", "work-card reveal");
    var showIframe = w.docType === "pdf" && w.preview === "iframe" && w.docUrl && w.docUrl.indexOf("http") !== 0;
    var icon = DOC_ICON[w.docType] || "📄";
    card.innerHTML =
      '<div class="work-card__media">' +
        '<span class="work-card__type-tag">' + TYPE_LABEL.document + "</span>" +
        (w.thumbnail ?
          '<img src="' + esc(w.thumbnail) + '" alt="' + esc(w.title) + '封面" loading="lazy" width="600" height="400">' :
          '<div class="work-card__icon-media">' + icon + "</div>") +
      "</div>" +
      '<div class="work-card__body">' +
        '<h3 class="work-card__title">' + esc(w.title) + "</h3>" +
        '<p class="work-card__tagline">' + esc(w.tagline) + "</p>" +
        '<p class="work-card__desc">' + esc(w.description) + "</p>" +
        '<div class="work-card__skills"></div>' +
        '<div class="work-card__meta">' + metaRow(w) + "</div>" +
        (showIframe ? '<iframe class="work-card__preview-iframe" src="' + esc(w.docUrl) + '" title="' + esc(w.title) + '在线预览" loading="lazy"></iframe>' : "") +
        (w.docUrl ?
          '<div class="work-card__actions">' +
            '<a class="work-card__btn work-card__btn--primary" href="' + esc(w.docUrl) + '" target="_blank" rel="noopener noreferrer">在线查看 ↗</a>' +
            '<a class="work-card__btn work-card__btn--ghost" href="' + esc(w.docUrl) + '" download>下载</a>' +
            codeBadge(w) +
          "</div>" : "") +
      "</div>";
    skillsInto($(".work-card__skills", card), w.skills);
    appendGallery(card, w, "分镜图");
    return card;
  }

  function renderFile(w) {
    var card = el("article", "work-card reveal");
    var icon = FILE_ICON[w.fileFormat] || FILE_ICON.default;
    card.innerHTML =
      '<div class="work-card__media">' +
        '<span class="work-card__type-tag">' + TYPE_LABEL.file + "</span>" +
        '<div class="work-card__icon-media">' + icon + "</div>" +
      "</div>" +
      '<div class="work-card__body">' +
        '<h3 class="work-card__title">' + esc(w.title) + "</h3>" +
        '<p class="work-card__tagline">' + esc(w.tagline) + "</p>" +
        '<p class="work-card__desc">' + esc(w.description) + "</p>" +
        '<div class="work-card__skills"></div>' +
        '<div class="work-card__meta">' + metaRow(w) + "</div>" +
        '<div class="work-card__file-info">' +
          '<span class="work-card__file-icon">' + icon + "</span>" +
          "<span><span class=\"work-card__file-name\">" + esc(w.title) + "</span><br>" +
          "<span class=\"work-card__file-size\">" + esc((w.fileFormat || "").toUpperCase()) + (w.fileSize ? " · " + esc(w.fileSize) : "") + "</span></span>" +
        "</div>" +
        '<div class="work-card__actions">' +
          '<a class="work-card__btn work-card__btn--primary" href="' + esc(w.fileUrl) + '" download>下载文件</a>' +
          codeBadge(w) +
        "</div>" +
      "</div>";
    skillsInto($(".work-card__skills", card), w.skills);
    return card;
  }

  function renderImage(w) {
    var card = el("article", "work-card reveal");
    card.innerHTML =
      '<div class="work-card__media">' +
        '<span class="work-card__type-tag">' + TYPE_LABEL.image + "</span>" +
        (w.gallery && w.gallery[0] ? '<img src="' + esc(w.gallery[0]) + '" alt="' + esc(w.title) + '封面" loading="lazy" width="600" height="400">' : "") +
      "</div>" +
      '<div class="work-card__body">' +
        '<h3 class="work-card__title">' + esc(w.title) + "</h3>" +
        '<p class="work-card__tagline">' + esc(w.tagline) + "</p>" +
        '<p class="work-card__desc">' + esc(w.description) + "</p>" +
        '<div class="work-card__skills"></div>' +
        '<div class="work-card__meta">' + metaRow(w) + "</div>" +
      "</div>";
    skillsInto($(".work-card__skills", card), w.skills);
    appendGallery(card, w, "图片");
    return card;
  }

  var RENDERERS = { video: renderVideo, document: renderDocument, file: renderFile, image: renderImage };

  function renderWorks() {
    var grid = $("#works-grid");
    if (!grid || typeof window.WORKS === "undefined") return;
    grid.innerHTML = "";
    window.WORKS.forEach(function (w) {
      var fn = RENDERERS[w.type] || renderDocument;
      grid.appendChild(fn(w));
    });
    initReveal(grid);
  }

  function initTheme() {
    var root = document.documentElement;
    var params = new URLSearchParams(location.search);
    var urlTheme = params.get("theme");
    var saved = urlTheme || (localStorage.getItem("theme") || "a");
    root.dataset.theme = saved === "b" ? "b" : "a";
    var toggle = $("#theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = root.dataset.theme === "b" ? "a" : "b";
        root.dataset.theme = next;
        localStorage.setItem("theme", next);
        showToast(next === "b" ? "已切换中国风主题" : "已切换科幻风主题");
      });
    }
  }

  function initCopy() {
    $$(".contact__card[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.dataset.copy || "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { showToast("邮箱已复制：" + text); }, function () { fallbackCopy(text); });
        } else {
          fallbackCopy(text);
        }
      });
    });
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); showToast("邮箱已复制：" + text); }
    catch (e) { showToast("复制失败，请手动复制"); }
    document.body.removeChild(ta);
  }

  var toastTimer;
  function showToast(msg) {
    var toast = $("#toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add("is-show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-show");
      setTimeout(function () { toast.hidden = true; }, 250);
    }, 2200);
  }

  function initReveal(ctx) {
    var items = $$(".reveal", ctx || document);
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("reveal--visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("reveal--visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (i) { io.observe(i); });
  }

  function openLightbox(src, alt) {
    var box = $("#lightbox");
    var img = $(".lightbox__img", box);
    img.src = src; img.alt = alt || "";
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    var box = $("#lightbox");
    box.hidden = true;
    document.body.style.overflow = "";
  }
  function initLightbox() {
    var box = $("#lightbox");
    if (box) {
      box.addEventListener("click", function (e) {
        if (e.target === box || e.target.classList.contains("lightbox__close")) closeLightbox();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box && !box.hidden) closeLightbox();
    });
  }

  function initYear() {
    var y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  renderWorks();
  initTheme();
  initCopy();
  initLightbox();
  initYear();
  initReveal();
})();
