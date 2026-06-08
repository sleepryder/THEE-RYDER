(function () {
  "use strict";
  var S = window.SITE;
  var view = document.getElementById("view");
  var nav = document.getElementById("nav");
  var pageLabel = document.getElementById("page-label");
  var preview = document.getElementById("preview");

  /* ---------------- helpers ---------------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function projectById(id) {
    return S.projects.filter(function (p) { return p.id === id; })[0];
  }
  function esc(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

  /* ---------------- custom cursor ---------------- */
  var cursor = document.getElementById("cursor");
  var cLabel = document.getElementById("cursor-label");
  var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  var tx = cx, ty = cy;
  window.addEventListener("mousemove", function (e) {
    tx = e.clientX; ty = e.clientY;
    if (preview.classList.contains("show")) {
      preview.style.left = tx + "px";
      preview.style.top = ty + "px";
    }
  });
  (function loop() {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cursor.style.left = cx + "px"; cursor.style.top = cy + "px";
    cLabel.style.left = tx + "px"; cLabel.style.top = ty + "px";
    requestAnimationFrame(loop);
  })();
  // delegate hover state for any link-ish element
  document.addEventListener("mouseover", function (e) {
    if (e.target.closest("a,[data-link],.work-row,.project-nav span,.contact-line a")) {
      cursor.classList.add("link");
    }
  });
  document.addEventListener("mouseout", function (e) {
    if (e.target.closest("a,[data-link],.work-row,.project-nav span,.contact-line a")) {
      cursor.classList.remove("link");
    }
  });

  /* ---------------- preview tile (work menu) ---------------- */
  function showPreview(src) {
    if (!src) { hidePreview(); return; }
    preview.innerHTML = "";
    var img = new Image(); img.src = src; preview.appendChild(img);
    preview.style.left = tx + "px"; preview.style.top = ty + "px";
    preview.classList.add("show");
  }
  function hidePreview() { preview.classList.remove("show"); }

  /* ====================================================================
     PAGE RENDERERS
     ==================================================================== */

  function renderHome() {
    var s = el("section", "screen home");
    var hero = el("div", "home-hero");
    if (S.home) hero.style.backgroundImage = "url('" + S.home + "')";
    var w = el("div", "home-welcome");
    w.textContent = S.welcome || "WELCOME to THEERYDER";
    s.appendChild(hero);
    s.appendChild(w);
    return s;
  }

  function renderWork() {
    var s = el("section", "screen work");
    var list = el("div", "work-list");
    S.projects.forEach(function (p) {
      var hasContent = (p.images && p.images.length) || p.blurb;
      var row = el("a", "work-row" + (hasContent ? "" : " empty"));
      row.href = "#/work/" + p.id;
      row.setAttribute("data-link", "");
      row.innerHTML =
        '<span class="wno">' + p.no + "</span>" +
        '<span class="wtitle">' + esc(p.title) + "</span>" +
        '<span class="tag">' + (hasContent ? "view" : "soon") + "</span>";
      var cover = (p.images && p.images.length && p.images[0].src) ? p.images[0].src : null;
      row.addEventListener("mouseenter", function () { showPreview(cover); });
      row.addEventListener("mouseleave", hidePreview);
      list.appendChild(row);
    });
    s.appendChild(list);
    return s;
  }

  function renderProject(id) {
    var p = projectById(id);
    if (!p) return renderWork();
    var s = el("section", "screen project");

    var head = el("div", "project-head");
    head.appendChild(el("h1", "project-title", esc(p.title)));
    s.appendChild(head);

    if (p.blurb) s.appendChild(el("p", "project-blurb", esc(p.blurb)));

    if (p.images && p.images.length) {
      var g = el("div", "project-gallery");
      p.images.forEach(function (im) {
        var cell = el("div", "cell" + (im.span === 1 ? "" : " full"));
        if (im.vimeo) {
          cell.classList.add("full");
          cell.style.aspectRatio = "16/9";
          cell.innerHTML = '<iframe src="https://player.vimeo.com/video/' + im.vimeo +
            '?title=0&byline=0&portrait=0&dnt=1" style="width:100%;height:100%;border:0" ' +
            'loading="lazy" title="' + esc(p.title) + ' — video" ' +
            'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
        } else {
          var img = new Image(); img.src = im.src;
          img.alt = p.title; img.decoding = "async";
          cell.appendChild(img);
        }
        g.appendChild(cell);
      });
      s.appendChild(g);
    } else {
      s.appendChild(el("div", "project-empty",
        "Photographs for this project are coming soon."));
    }

    if (p.credits && p.credits.length) {
      var cr = el("div", "project-credits");
      cr.appendChild(el("div", "ttl", "Credits"));
      p.credits.forEach(function (c) { cr.appendChild(el("div", null, esc(c))); });
      s.appendChild(cr);
    }

    // back / next
    var idx = S.projects.indexOf(p);
    var next = S.projects[(idx + 1) % S.projects.length];
    var pn = el("div", "project-nav");
    var back = el("span", null, "← back to the workpage");
    back.setAttribute("data-link", "");
    back.addEventListener("click", function () { go("#/work"); });
    var nx = el("span", null, "next →");
    nx.setAttribute("data-link", "");
    nx.addEventListener("click", function () { go("#/work/" + next.id); });
    pn.appendChild(back); pn.appendChild(nx);
    s.appendChild(pn);
    return s;
  }

  function renderInfo() {
    var i = S.info;
    var s = el("section", "screen info");
    s.appendChild(el("p", "info-bio", esc(i.bio)));

    var cols = el("div", "info-cols");

    var left = el("div");
    var edu = el("div", "info-block");
    edu.appendChild(el("div", "info-h", "Art Residencies &amp; Education"));
    i.education.forEach(function (e) { edu.appendChild(el("div", "info-item", esc(e))); });
    left.appendChild(edu);

    var ex = el("div", "info-block");
    ex.appendChild(el("div", "info-h", "Exhibitions &amp; Workshops"));
    i.exhibitions.forEach(function (e) { ex.appendChild(el("div", "info-item", esc(e))); });
    left.appendChild(ex);

    var right = el("div");
    var pub = el("div", "info-block");
    pub.appendChild(el("div", "info-h", "Publications"));
    i.publications.forEach(function (e) { pub.appendChild(el("div", "info-item", esc(e))); });
    right.appendChild(pub);

    var fairs = el("div", "info-block");
    fairs.appendChild(el("div", "info-h", "Fairs"));
    i.fairs.forEach(function (e) { fairs.appendChild(el("div", "info-item", esc(e))); });
    right.appendChild(fairs);

    cols.appendChild(left); cols.appendChild(right);
    s.appendChild(cols);
    return s;
  }

  function renderContact() {
    var c = S.contact;
    var s = el("section", "screen contact");
    var inner = el("div", "contact-inner");
    c.lines.forEach(function (line) {
      var html = esc(line)
        .replace(S.email, '<a href="mailto:' + S.email + '">' + S.email + "</a>")
        .replace(S.instagram, '<a href="https://instagram.com/' + S.instagram.replace("@", "") +
          '" target="_blank" rel="noopener">' + S.instagram + "</a>");
      inner.appendChild(el("div", "contact-line", html));
    });
    s.appendChild(inner);
    return s;
  }

  /* ====================================================================
     ROUTER
     ==================================================================== */
  var LABELS = { home: "", work: "workpage", info: "infopage", contact: "contactpage" };

  function parse() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/").filter(Boolean);
    if (!parts.length) return { page: "home" };
    if (parts[0] === "work" && parts[1]) return { page: "project", id: parts[1] };
    return { page: parts[0] };
  }

  function go(hash) { location.hash = hash; }

  function render() {
    var r = parse();
    hidePreview();
    var node;
    if (r.page === "project") node = renderProject(r.id);
    else if (r.page === "work") node = renderWork();
    else if (r.page === "info") node = renderInfo();
    else if (r.page === "contact") node = renderContact();
    else node = renderHome();

    view.innerHTML = "";
    view.appendChild(node);
    window.scrollTo(0, 0);

    // page label (top-left)
    var labelKey = r.page === "project" ? "work" : r.page;
    var lt = LABELS[labelKey] || "";
    if (r.page === "project") {
      var pr = projectById(r.id);
      lt = pr ? pr.title.toLowerCase() : "workpage";
    }
    pageLabel.textContent = lt;
    pageLabel.classList.toggle("show", !!lt);

    // active nav
    [].forEach.call(nav.querySelectorAll("a"), function (a) {
      var route = a.getAttribute("data-route");
      var on = (route === "home" && r.page === "home") ||
               (route === "work" && (r.page === "work" || r.page === "project")) ||
               (route === r.page);
      a.classList.toggle("active", on);
    });

    requestAnimationFrame(function () {
      node.classList.add("in");
    });
  }

  // nav clicks
  [].forEach.call(nav.querySelectorAll("a"), function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var route = a.getAttribute("data-route");
      go(route === "home" ? "#/" : "#/" + route);
    });
  });

  window.addEventListener("hashchange", render);

  /* ====================================================================
     LOADING SEQUENCE
     ==================================================================== */
  function runLoader(done) {
    var loader = document.getElementById("loader");
    var p = document.getElementById("loader-text");
    if (sessionStorage.getItem("tr_seen")) { loader.classList.add("done"); done(); return; }
    var words = "YOU ARE JUST WAITING AND TIME PASSES...".split(" ");
    p.innerHTML = words.map(function (w) { return '<span class="lt">' + w + "</span>"; }).join(" ");
    var spans = p.querySelectorAll(".lt");
    spans.forEach(function (sp, i) {
      setTimeout(function () { sp.classList.add("on"); }, 180 + i * 260);
    });
    var total = 180 + spans.length * 260 + 900;
    setTimeout(function () {
      loader.classList.add("done");
      sessionStorage.setItem("tr_seen", "1");
      done();
    }, total);
  }

  // preload home image so the reveal is clean
  if (S.home) { var hi = new Image(); hi.src = S.home; }

  runLoader(function () {
    if (!location.hash) location.hash = "#/";
    render();
  });
  // render immediately too (so it's ready behind the loader)
  render();
})();
