(function () {
  const calendarRoot = document.getElementById("calendar-root");
  const feedRoot = document.getElementById("feed-root");
  const authRoot = document.getElementById("auth-root");
  const nameEl = document.getElementById("name");
  const createEventWrap = document.getElementById("create-event");
  const eventForm = document.getElementById("event-form");

  const STORAGE_KEY = "DRE_EVENTS_v1";
  const GOOGLE_CLIENT_ID =
    "588626875607-k87d5da3trqhmogvi2mf8snhj0evnqsg.apps.googleusercontent.com";

  const DEFAULT_EVENTS = {
    "2025-11-19": [
      {
        title: "Palestra: Futuro da Educação",
        desc: "Palestra sobre tendências e tecnologias.",
      },
    ],
  };

  let EVENTS = loadEvents();
  let currentUser = null;

  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_EVENTS);
      return Object.assign({}, DEFAULT_EVENTS, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, DEFAULT_EVENTS);
    }
  }

  function saveEvents() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(EVENTS));
    } catch (e) {
      console.error(e);
    }
  }

  function mountCalendar(date = new Date()) {
    if (!calendarRoot) return;
    calendarRoot.innerHTML = "";
    const month = date.getMonth();
    const year = date.getFullYear();

    const header = document.createElement("div");
    header.className = "calendar-header";
    header.innerHTML = `<strong>${date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    })}</strong>`;
    calendarRoot.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "calendar";
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();

    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement("div");
      empty.className = "day empty";
      grid.appendChild(empty);
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const cur = new Date(year, month, d);
      const iso = cur.toISOString().slice(0, 10);
      const dayEl = document.createElement("div");
      dayEl.className = "day";
      dayEl.textContent = d;
      if (EVENTS[iso]) dayEl.classList.add("has-event");
      const todayIso = new Date().toISOString().slice(0, 10);
      if (iso === todayIso) dayEl.classList.add("today");
      dayEl.addEventListener("click", () => onDateClick(iso));
      grid.appendChild(dayEl);
    }

    calendarRoot.appendChild(grid);
  }

  function onDateClick(iso) {
    showFeed(iso, EVENTS[iso] || []);
  }

  function showFeed(iso, items) {
    if (!feedRoot || !calendarRoot) return;
    calendarRoot.style.display = "none";
    feedRoot.classList.remove("hidden");
    feedRoot.innerHTML = "";
    const back = document.createElement("a");
    back.href = "#";
    back.className = "back-btn";
    back.textContent = "Voltar ao calendário";
    back.onclick = (e) => {
      e.preventDefault();
      hideFeed();
    };
    feedRoot.appendChild(back);
    const title = document.createElement("h3");
    title.textContent = `Eventos em ${iso}`;
    feedRoot.appendChild(title);
    if (items.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Nenhum evento nesta data.";
      feedRoot.appendChild(p);
      return;
    }
    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "feed-card";
      const h = document.createElement("h4");
      h.textContent = it.title;
      const p = document.createElement("p");
      p.textContent = it.desc;
      card.appendChild(h);
      card.appendChild(p);
      feedRoot.appendChild(card);
    });
  }

  function hideFeed() {
    if (!feedRoot || !calendarRoot) return;
    feedRoot.classList.add("hidden");
    feedRoot.innerHTML = "";
    calendarRoot.style.display = "";
    mountCalendar();
  }

  function setUser(u) {
    currentUser = u;
    if (u) {
      if (nameEl) nameEl.textContent = "Signed in: " + (u.name || u.email);
      if (createEventWrap) createEventWrap.style.display = "";
    } else {
      if (nameEl) nameEl.textContent = "";
      if (createEventWrap) createEventWrap.style.display = "none";
    }
  }

  if (eventForm) {
    eventForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const date = document.getElementById("ev-date").value;
      const title = document.getElementById("ev-title").value.trim();
      const desc = document.getElementById("ev-desc").value.trim();
      if (!date || !title) return alert("Data e título são obrigatórios");
      if (!EVENTS[date]) EVENTS[date] = [];
      EVENTS[date].push({
        title,
        desc,
        author: currentUser ? currentUser.email : "anonymous",
      });
      saveEvents();
      mountCalendar();
      alert("Evento salvo e aparecerá no calendário");
      eventForm.reset();
    });
  }

  // adjust layout to account for fixed header and subnav + sidebars
  function adjustLayout() {
    const header = document.querySelector(".site-header");
    const subnav = document.querySelector(".subnav");
    const left = document.querySelector(".left-col");
    const right = document.querySelector(".right-col");
    const center = document.querySelector(".center-col");
    if (!header || !subnav) return;
    const headerH = header.offsetHeight;
    const subnavH = subnav.offsetHeight;
    document.documentElement.style.setProperty("--header-h", headerH + "px");
    document.documentElement.style.setProperty("--subnav-h", subnavH + "px");
    const isSmall = window.innerWidth <= 900;
    if (isSmall) {
      if (left) {
        left.style.position = "static";
        left.style.top = null;
        left.style.height = null;
      }
      if (right) {
        right.style.position = "static";
        right.style.top = null;
        right.style.height = null;
      }
      // reset CSS variables so layout CSS controls spacing
      document.documentElement.style.setProperty("--left-w", "0px");
      document.documentElement.style.setProperty("--right-w", "0px");
      return;
    }
    const topOffset = headerH + subnavH + 12;
    if (left) {
      left.style.position = "fixed";
      left.style.top = topOffset + "px";
      left.style.height = `calc(100vh - ${topOffset + 20}px)`;
    }
    if (right) {
      right.style.position = "fixed";
      right.style.top = topOffset + "px";
      right.style.height = `calc(100vh - ${topOffset + 20}px)`;
    }
    const leftW = left ? left.offsetWidth + 36 : 20;
    const rightW = right ? right.offsetWidth + 36 : 20;
    // set CSS variables so CSS controls layout — this preserves manual `.layout` changes
    document.documentElement.style.setProperty("--left-w", leftW + "px");
    document.documentElement.style.setProperty("--right-w", rightW + "px");
  }

  // Google sign-in using gapi.auth2 (sample code adapted)
  function startApp() {
    if (!GOOGLE_CLIENT_ID) return;
    if (typeof gapi === "undefined") {
      console.warn("gapi não disponível");
      return;
    }
    gapi.load("auth2", function () {
      auth2 = gapi.auth2.init({
        client_id: GOOGLE_CLIENT_ID,
        cookiepolicy: "single_host_origin",
      });
      attachSignin(document.getElementById("customBtn"));
    });
  }
  function attachSignin(element) {
    if (!element || !window.auth2) return;
    auth2.attachClickHandler(
      element,
      {},
      function (googleUser) {
        const profile = googleUser.getBasicProfile();
        const name = profile.getName();
        const email = profile.getEmail();
        setUser({ name, email });
      },
      function (err) {
        console.error(err);
        alert("Erro no login: " + JSON.stringify(err));
      }
    );
  }

  window.addEventListener("load", () => {
    mountCalendar();
    adjustLayout();
    startApp();
  });
  window.addEventListener("resize", adjustLayout);

  // expose for debugging
  window.__DRE = { EVENTS, setUser };
})();
