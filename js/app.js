// TikEduca 2.0 Main Application Script

// ── 1. INITIAL STATE & ON-LOAD CHECKS ───────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Check if speakers were already revealed
  if (localStorage.getItem("ponentesRevealed") === "true") {
    const ponentes = document.getElementById("ponentes");
    if (ponentes) ponentes.classList.add("is-revealed");
    if (typeof startAutoScroll === "function") startAutoScroll();
  }
});

// ── 2. SCROLL REVEAL & PROGRESS BAR ─────────────────────────────────────
(function() {
  // 1. Scroll Progress Bar
  const scrollProgressBar = document.getElementById("scrollProgress");
  if (scrollProgressBar) {
    function updateScrollProgress() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      scrollProgressBar.style.width = progress + "%";
    }
    window.addEventListener("scroll", () => {
      requestAnimationFrame(updateScrollProgress);
    }, { passive: true });
    updateScrollProgress();
  }

  // 2. Intersection Observer for Scroll Reveals
  const revealElements = document.querySelectorAll(".reveal-on-scroll");
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px"
    });
    revealElements.forEach(el => revealObserver.observe(el));
  }

  // 3. Fallback Section Hidden observer (if any)
  const sections = document.querySelectorAll(".section-hidden");
  if (sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("section-visible");
        });
      },
      { threshold: 0.15 }
    );
    sections.forEach((s) => observer.observe(s));
  }
})();

// ── 3. CURSOR FX & HOVER EXPANSIONS ─────────────────────────────────────
const cursor = document.getElementById("cursor");
if (cursor) {
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  (function() {
    const targetSelector = 'a, button, [onclick], input, select, textarea, .room-card, .ponente-card, .ticket-btn';

    function attachCursorEvents(parent) {
      const elements = parent.querySelectorAll(targetSelector);
      elements.forEach(el => {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = "true";
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
      });
    }

    attachCursorEvents(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches(targetSelector)) {
              if (!node.dataset.cursorBound) {
                node.dataset.cursorBound = "true";
                node.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
                node.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
              }
            }
            attachCursorEvents(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();
}

// ── 4. COUNTDOWN TIMERS ──────────────────────────────────────────────────
function updateCountdown() {
  const target = new Date(CONFIG.EVENT_DATE);
  const now = new Date();
  const diff = target - now;
  
  if (diff <= 0) {
    const mainCd = document.getElementById("mainCountdown");
    if (mainCd) {
      mainCd.innerHTML = '<span class="neon-pink font-orbitron font-bold text-center w-full block">¡EL EVENTO YA COMENZÓ!</span>';
    }
    const cd = document.getElementById("countdown");
    if (cd) {
      cd.innerHTML = '<span class="neon-pink font-orbitron font-bold text-center w-full block">¡EL EVENTO YA COMENZÓ!</span>';
    }
    return;
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const cntDias = document.getElementById("cnt_dias");
  const cntHoras = document.getElementById("cnt_horas");
  const cntMins = document.getElementById("cnt_mins");
  const cntSegs = document.getElementById("cnt_segs");
  if (cntDias) cntDias.textContent = String(d).padStart(2, "0");
  if (cntHoras) cntHoras.textContent = String(h).padStart(2, "0");
  if (cntMins) cntMins.textContent = String(m).padStart(2, "0");
  if (cntSegs) cntSegs.textContent = String(s).padStart(2, "0");

  const cdDias = document.getElementById("cd_dias");
  const cdHoras = document.getElementById("cd_horas");
  const cdMins = document.getElementById("cd_mins");
  if (cdDias) cdDias.textContent = String(d).padStart(2, "0");
  if (cdHoras) cdHoras.textContent = String(h).padStart(2, "0");
  if (cdMins) cdMins.textContent = String(m).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ── 5. SPEAKERS CAROUSEL & DRAG SCROLL ───────────────────────────────────
(function () {
  const el = document.getElementById("ponentesScroll");
  if (!el) return;

  // Drag to scroll
  let isDown = false, startX, scrollLeft0;
  
  el.addEventListener("mousedown", (e) => {
    isDown = true,
    el.style.cursor = "grabbing";
    startX = e.pageX - el.offsetLeft;
    scrollLeft0 = el.scrollLeft;
    pauseAutoScroll();
  });
  el.addEventListener("mouseleave", () => {
    isDown = false;
    el.style.cursor = "grab";
  });
  el.addEventListener("mouseup", () => {
    isDown = false;
    el.style.cursor = "grab";
  });
  el.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    el.scrollLeft = scrollLeft0 - (e.pageX - el.offsetLeft - startX) * 1.2;
  });
  el.addEventListener("touchstart", () => pauseAutoScroll(), { passive: true });

  // Dot indicators
  const TOTAL = 20;
  const dotsEl = document.getElementById("ponentesDots");
  if (dotsEl) {
    dotsEl.innerHTML = "";
    for (let i = 0; i < TOTAL; i++) {
      const d = document.createElement("div");
      d.style.cssText = "width:6px;height:6px;border-radius:50%;background:rgba(255,0,127,0.2);transition:all 0.3s;";
      dotsEl.appendChild(d);
    }
  }

  function updateDots() {
    if (!dotsEl) return;
    const cardW = 224 + 16; // w-56 + gap
    const idx = Math.round(el.scrollLeft / cardW);
    Array.from(dotsEl.children).forEach((d, i) => {
      d.style.background = i === idx ? "#ff007f" : "rgba(255,0,127,0.2)";
      d.style.width = i === idx ? "18px" : "6px";
      d.style.borderRadius = "3px";
      d.style.boxShadow = i === idx ? "0 0 8px #ff007f" : "none";
    });
  }
  el.addEventListener("scroll", updateDots, { passive: true });
  updateDots();

  // Auto-scroll logic
  let autoTimer = null;
  let paused = false;
  const STEP = 240;
  const INTERVAL = 2800;

  function doAutoScroll() {
    if (paused) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: STEP, behavior: "smooth" });
    }
  }

  function startAuto() {
    const section = document.getElementById("ponentes");
    if (!section || !section.classList.contains("is-revealed")) return;
    clearInterval(autoTimer);
    autoTimer = setInterval(doAutoScroll, INTERVAL);
  }

  window.pauseAutoScroll = function () {
    paused = true;
    clearInterval(autoTimer);
    const btn = document.getElementById("btnPause");
    if (btn) {
      btn.textContent = "▶";
      btn.title = "Reanudar";
      btn.onclick = resumeAutoScroll;
    }
  };

  window.resumeAutoScroll = function () {
    paused = false;
    startAuto();
    const btn = document.getElementById("btnPause");
    if (btn) {
      btn.textContent = "⏸";
      btn.title = "Pausar";
      btn.onclick = pauseAutoScroll;
    }
  };

  window.scrollPonentes = function (dir) {
    pauseAutoScroll();
    el.scrollBy({ left: dir * STEP, behavior: "smooth" });
  };

  window.revealPonentes = function () {
    const section = document.getElementById("ponentes");
    const overlay = document.getElementById("ponentesOverlay");
    if (section) section.classList.add("is-revealed");
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transform = "scale(0.95)";
      overlay.style.pointerEvents = "none";
      setTimeout(() => {
        overlay.remove();
      }, 700);
    }
    localStorage.setItem("ponentesRevealed", "true");
    startAuto();
  };

  window.startAutoScroll = startAuto;

  el.addEventListener("mouseenter", () => {
    clearInterval(autoTimer);
  });
  el.addEventListener("mouseleave", () => {
    if (!paused) startAuto();
  });

  startAuto();
})();

// Speaker Detail Modal Manager
window.openSpeakerModal = function(name, imgSrc, role, color) {
  document.getElementById('speakerZoomImg').src = imgSrc;
  document.getElementById('speakerZoomName').textContent = name;
  document.getElementById('speakerZoomRole').textContent = role;
  document.getElementById('speakerZoomRole').style.color = color;
  document.getElementById('speakerZoomGlow').style.background = color;
  document.getElementById('speakerZoomImgContainer').style.borderColor = color;
  document.getElementById('speakerZoomImgContainer').style.boxShadow = `0 0 30px ${color}80`;
  document.getElementById('speakerZoomStatusDot').style.background = color;
  document.getElementById('speakerZoomStatusDot').style.boxShadow = `0 0 10px ${color}`;
  
  const isFemale = name.includes('Gaby') || name.includes('Rocío') || name.includes('Azalhia') || name.includes('Edith') || name.includes('Miss') || name.includes('Maeta') || name.includes('Maestra') || name.includes('Mtra.') || name.includes('Fani');
  document.getElementById('speakerZoomStatusText').textContent = isFemale ? 'CONFIRMADA' : 'CONFIRMADO';
  document.getElementById('speakerZoomStatusText').style.color = color;

  const modal = document.getElementById('speakerZoomModal');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeSpeakerModal = function() {
  const modal = document.getElementById('speakerZoomModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

// ── 6. COMPRESSION & UPLOAD UTILITIES ───────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/") || file.type.includes("gif")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress with quality 0.75
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── 7. REGISTRATION SYSTEM (TIKEDUCA + MAESTROS FEST) ────────────────────
let userData = {
  nombre: "",
  email: "",
  whatsapp: "",
  nivel: "",
  ticket: "",
};
let termsChecked = false;
let selectedRegTicket = "";

const regTicketPrices = CONFIG.TICKET_PRICES;
const regTicketNames = CONFIG.TICKET_NAMES;

window.selectRegTicket = function(tipo) {
  selectedRegTicket = tipo;
  ["congreso","maestrofest","combo"].forEach(t => {
    const el = document.getElementById("reg_ticket_" + t);
    if (el) {
      el.style.borderColor = "";
      el.style.background = "";
      el.style.boxShadow = "";
    }
    const card = document.getElementById("price_card_" + t);
    if (card) {
      card.style.borderColor = "";
      card.style.boxShadow = "";
    }
  });

  const colors = { congreso: "#00e5ff", maestrofest: "#c084fc", combo: "#ffe500" };
  const bgs = { congreso: "rgba(0,229,255,0.10)", maestrofest: "rgba(155,0,255,0.10)", combo: "rgba(255,229,0,0.10)" };
  
  const el = document.getElementById("reg_ticket_" + tipo);
  if (el) {
    el.style.borderColor = colors[tipo];
    el.style.background = bgs[tipo];
    el.style.boxShadow = `0 0 14px ${colors[tipo]}55`;
  }
  
  const cardEl = document.getElementById("price_card_" + tipo);
  if (cardEl) {
    cardEl.style.borderColor = colors[tipo];
    cardEl.style.boxShadow = `0 0 30px ${colors[tipo]}44`;
  }
  
  const err = document.getElementById("reg_ticket_error");
  if (err) err.classList.add("hidden");
};

window.selectTicketAndScroll = function(tipo) {
  window.selectRegTicket(tipo);
  const form = document.getElementById("formTikeduca");
  if (form) {
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

window.submitTikeduca = async function() {
  const nombre = document.getElementById("te_nombre").value.trim();
  const email = document.getElementById("te_email").value.trim();
  const whatsapp = document.getElementById("te_whatsapp").value.trim();
  const nivel = document.getElementById("te_nivel").value;
  const instagram = document.getElementById("te_instagram").value.trim();
  const tiktok = document.getElementById("te_tiktok").value.trim();
  const fuente = document.getElementById("te_fuente").value;

  if (!selectedRegTicket) {
    const err = document.getElementById("reg_ticket_error");
    if (err) err.classList.remove("hidden");
    return;
  }
  if (!nombre || !email || !whatsapp || !nivel) {
    const err = document.getElementById("formError");
    if (err) {
      err.classList.remove("hidden");
      setTimeout(() => err.classList.add("hidden"), 3500);
    }
    return;
  }

  userData = { ...userData, nombre, email, whatsapp, nivel, ticket: selectedRegTicket, instagram, tiktok, fuente };

  try {
    const params = new URLSearchParams({ 
      tipo: "tikeduca", 
      nombre, 
      email, 
      whatsapp, 
      nivel, 
      ticket: selectedRegTicket, 
      precio: regTicketPrices[selectedRegTicket], 
      instagram, 
      tiktok, 
      fuente 
    });
    fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST", 
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
  } catch (_) {}

  document.getElementById("formTikeduca").classList.add("hidden");
  document.getElementById("successTikeduca").classList.remove("hidden");
  
  if (typeof triggerSuccessSound === "function") triggerSuccessSound();
  
  document.getElementById("step1dot").classList.remove("active");
  document.getElementById("step1dot").classList.add("done");
  document.getElementById("stepline1").classList.add("done");
  document.getElementById("step2dot").classList.add("active");

  setTimeout(() => {
    document.getElementById("nombreUsuario").textContent = nombre.split(" ")[0] + "!";
    const ticketMap = { congreso: "congreso", maestrofest: "maestro_fest", combo: "combo" };
    const modalTicket = ticketMap[selectedRegTicket];
    if (modalTicket) {
      const btn = document.querySelector(`#ticketSelector button[onclick*="${modalTicket}"]`);
      if (btn) window.selectTicket(btn, modalTicket);
    }
    document.getElementById("modalFest").classList.add("active");
    document.body.style.overflow = "hidden";
  }, 1400);
};

window.openFestModal = function(e) {
  if (e) e.preventDefault();
  document.getElementById("viewPromo").classList.remove("hidden");
  document.getElementById("viewFestForm").classList.add("hidden");
  document.getElementById("viewFestPayment").classList.add("hidden");
  document.getElementById("viewFestSuccess").classList.add("hidden");
  document.getElementById("modalFest").classList.add("active");
  document.body.style.overflow = "hidden";
};

window.closeModal = function() {
  const modal = document.getElementById("modalFest");
  if (modal) modal.classList.remove("active");
  document.body.style.overflow = "";
  if (userData.nombre) {
    document.getElementById("step2dot").classList.remove("active");
    document.getElementById("step2dot").classList.add("done");
    document.getElementById("stepline2").classList.add("done");
    document.getElementById("step3dot").classList.add("active");
  }
};

const modalFest = document.getElementById("modalFest");
if (modalFest) {
  modalFest.addEventListener("click", function (e) {
    if (e.target === this) window.closeModal();
  });
}

window.showFestForm = function() {
  document.getElementById("viewPromo").classList.add("hidden");
  document.getElementById("viewFestForm").classList.remove("hidden");
  document.getElementById("viewFestForm").style.animation = "fadeIn 0.4s ease-out";
};

window.backToPromo = function() {
  document.getElementById("viewFestForm").classList.add("hidden");
  document.getElementById("viewPromo").classList.remove("hidden");
};

window.selectTicket = function(el, type) {
  document.querySelectorAll(".ticket-btn").forEach((b) => {
    b.style.borderColor = "";
    b.style.background = "";
    b.style.boxShadow = "";
  });
  
  const colors = {
    maestro_fest: { border: "#00e5ff", bg: "rgba(0,229,255,0.08)", shadow: "rgba(0,229,255,0.3)" },
    congreso: { border: "#ff007f", bg: "rgba(255,0,127,0.08)", shadow: "rgba(255,0,127,0.3)" },
    combo: { border: "#ffe500", bg: "rgba(255,229,0,0.08)", shadow: "rgba(255,229,0,0.3)" }
  };
  
  const colorSet = colors[type] || colors.maestro_fest;
  el.style.borderColor = colorSet.border;
  el.style.background = colorSet.bg;
  el.style.boxShadow = `0 0 15px ${colorSet.shadow}`;
  
  userData.ticket = type;
  document.getElementById("fest_ticket").value = type;
};

window.toggleCheck = function() {
  termsChecked = !termsChecked;
  const box = document.getElementById("checkBox");
  if (box) {
    if (termsChecked) {
      box.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" fill="none" stroke="#FF007F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      box.style.borderColor = "var(--pink)";
      box.style.background = "rgba(255,0,127,0.15)";
      box.style.boxShadow = "0 0 8px rgba(255,0,127,0.4)";
    } else {
      box.innerHTML = "";
      box.style.borderColor = "rgba(255,0,127,0.5)";
      box.style.background = "rgba(10,17,40,0.8)";
      box.style.boxShadow = "";
    }
  }
};

window.submitFest = function() {
  const escuela = document.getElementById("fest_escuela").value.trim();
  const ciudad = document.getElementById("fest_ciudad").value.trim();
  const ticket = document.getElementById("fest_ticket").value;

  if (!escuela || !ciudad || !ticket || !termsChecked) {
    const err = document.getElementById("festError");
    if (err) {
      err.classList.remove("hidden");
      setTimeout(() => err.classList.add("hidden"), 3500);
    }
    return;
  }

  userData = { ...userData, escuela, ciudad };
  
  const ticketNames = {
    maestro_fest: CONFIG.TICKET_NAMES.maestrofest,
    congreso: CONFIG.TICKET_NAMES.congreso,
    combo: "Congreso + Fest"
  };
  const ticketPrices = {
    maestro_fest: `$${CONFIG.TICKET_PRICES.maestrofest.toLocaleString()} MXN`,
    congreso: `$${CONFIG.TICKET_PRICES.congreso.toLocaleString()} MXN`,
    combo: `$${CONFIG.TICKET_PRICES.combo.toLocaleString()} MXN`
  };

  document.getElementById("payment_ticket_name").textContent = ticketNames[ticket] || "";
  document.getElementById("payment_amount").textContent = ticketPrices[ticket] || "";

  const titleSpan = document.getElementById("payment_header_title");
  if (titleSpan) {
    if (ticket === "combo") {
      titleSpan.className = "";
      titleSpan.style.color = "#ffe500";
      titleSpan.style.textShadow = "0 0 10px #ffe500";
      titleSpan.textContent = "Combo Congreso + Fest";
    } else if (ticket === "congreso") {
      titleSpan.className = "neon-cyan";
      titleSpan.style.color = "";
      titleSpan.style.textShadow = "";
      titleSpan.textContent = "Congreso Educativo";
    } else {
      titleSpan.className = "neon-pink";
      titleSpan.style.color = "";
      titleSpan.style.textShadow = "";
      titleSpan.textContent = "Maestros Fest";
    }
  }

  document.getElementById("viewFestForm").classList.add("hidden");
  document.getElementById("viewFestPayment").classList.remove("hidden");
  document.getElementById("viewFestPayment").style.animation = "fadeIn 0.5s ease-out";
  document.getElementById("pay_nombre_transfer").value = userData.nombre || "";
  
  const step3 = document.getElementById("step3dot");
  if (step3) step3.classList.add("active");
};

window.copyAccount = function() {
  const acc = document.getElementById("accountNumber").textContent.replace(/\s/g, "");
  navigator.clipboard.writeText(acc).then(() => {
    const btn = document.getElementById("copyBtn");
    if (btn) {
      btn.innerHTML = "<span>COPIADO</span>";
      btn.style.borderColor = "var(--pink)";
      btn.style.color = "var(--pink)";
      setTimeout(() => {
        btn.innerHTML = "<span>COPIAR</span>";
        btn.style.borderColor = "var(--cyan)";
        btn.style.color = "var(--cyan)";
      }, 2000);
    }
  });
};

window.submitPayment = async function() {
  const nombre = document.getElementById("pay_nombre_transfer").value.trim();
  const referencia = document.getElementById("pay_referencia").value.trim();
  const fecha = document.getElementById("pay_fecha").value;
  const fileInput = document.getElementById("main_comprobante");
  const file = fileInput.files ? fileInput.files[0] : null;

  if (!nombre || !referencia || !fecha || !file) {
    const err = document.getElementById("payError");
    if (err) {
      err.classList.remove("hidden");
      setTimeout(() => err.classList.add("hidden"), 3500);
    }
    return;
  }

  const ticketNames = {
    maestro_fest: `${CONFIG.TICKET_NAMES.maestrofest} ($${CONFIG.TICKET_PRICES.maestrofest.toLocaleString()} MXN)`,
    congreso: `${CONFIG.TICKET_NAMES.congreso} ($${CONFIG.TICKET_PRICES.congreso.toLocaleString()} MXN)`,
    combo: `${CONFIG.TICKET_NAMES.combo} ($${CONFIG.TICKET_PRICES.combo.toLocaleString()} MXN)`
  };
  const ticket = userData.ticket;
  
  const btn = document.getElementById("btnConfirmarPago");
  if (btn) { 
    btn.disabled = true; 
    btn.innerHTML = "⏳ GUARDANDO..."; 
  }
  
  let guardadoOk = false;
  try {
    const base64 = await fileToBase64(file);
    const params = new URLSearchParams({
      tipo: "fest",
      nombre: userData.nombre || "",
      whatsapp: userData.whatsapp || "",
      email: userData.email || "",
      escuela: userData.escuela || "",
      ciudad: userData.ciudad || "",
      boleto: ticketNames[ticket] || ticket,
      titular: nombre,
      referencia,
      fechaPago: fecha,
      comprobanteBase64: base64,
      comprobanteNombre: file.name,
      comprobanteMime: file.type || "image/jpeg"
    });
    
    await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST", 
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    guardadoOk = true;
  } catch (_) {}

  document.getElementById("viewFestPayment").classList.add("hidden");
  document.getElementById("viewFestSuccess").classList.remove("hidden");
  
  if (typeof triggerSuccessSound === "function") triggerSuccessSound();
  
  document.getElementById("viewFestSuccess").style.animation = "fadeIn 0.5s ease-out";
  document.getElementById("step3dot").classList.remove("active");
  document.getElementById("step3dot").classList.add("done");

  const waMsg = `Hola, acabo de registrar mi pago por transferencia para el Maestros Fest 2.0.\nNombre de registro: ${userData.nombre}\nWhatsApp: ${userData.whatsapp}\nBoleto Seleccionado: ${ticketNames[ticket]}\nTitular de transferencia: ${nombre}\nReferencia: ${referencia}\nFecha de pago: ${fecha}\nComprobante adjunto: [${file.name}]`;
  const waUrl = `https://wa.me/${CONFIG.ORGANIZER_WA}?text=${encodeURIComponent(waMsg)}`;
  
  const nota = guardadoOk
    ? `<div class="p-3 mb-4 rounded-lg text-left" style="background: rgba(255, 229, 0, 0.1); border: 1px solid rgba(255, 229, 0, 0.3);">
        <p class="text-yellow-400 text-xs font-bold mb-1 font-orbitron tracking-wider">📢 ¡ACCIÓN REQUERIDA PARA RECIBIR TU BOLETO!</p>
        <p class="text-gray-300 text-[11px] leading-relaxed font-space">
          Para garantizar la entrega inmediata de tu boleto (debido a intermitencias en los correos), 
          <strong>es necesario enviar el comprobante haciendo clic en el botón de WhatsApp abajo</strong>.
        </p>
       </div>`
    : `<div class="p-3 mb-4 rounded-lg text-left" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
        <p class="text-red-400 text-xs font-bold mb-1 font-orbitron tracking-wider">⚠️ ERROR DE GUARDADO AUTOMÁTICO</p>
        <p class="text-gray-300 text-[11px] leading-relaxed font-space">
          No se pudo registrar tu pago automáticamente. 
          <strong>Por favor, envía tu comprobante por WhatsApp</strong> para poder registrar tu boleto manualmente.
        </p>
       </div>`;
  
  document.getElementById("successPaymentDetails").innerHTML = `
    <div class="font-space text-gray-300 text-sm leading-relaxed text-left space-y-1.5 mb-4">
      <span class="text-cyan-400 font-bold block mb-1 font-orbitron tracking-wider text-[10px]">DATOS REGISTRADOS:</span>
      <div><strong class="text-gray-400">Registrado:</strong> ${userData.nombre}</div>
      <div><strong class="text-gray-400">Titular de Cuenta:</strong> ${nombre}</div>
      <div><strong class="text-gray-400">Referencia:</strong> ${referencia}</div>
      <div><strong class="text-gray-400">Boleto:</strong> ${ticketNames[ticket]}</div>
      <div><strong class="text-gray-400">Archivo:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
    </div>
    ${nota}
    <a href="${waUrl}" target="_blank" class="btn-primary inline-flex items-center justify-center w-full py-3 px-4 rounded-xl text-xs font-bold cursor-pointer font-orbitron tracking-wider" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); box-shadow: 0 0 15px rgba(37,211,102,0.4); border: none;">
      💬 ENVIAR COMPROBANTE POR WHATSAPP ⟶
    </a>
  `;
};

window.backToFestForm = function() {
  document.getElementById("viewFestPayment").classList.add("hidden");
  document.getElementById("viewFestForm").classList.remove("hidden");
  document.getElementById("viewFestForm").style.animation = "fadeIn 0.4s ease-out";
};

window.shareEvent = function() {
  const text = `¡Me registré en el Maestros Fest 2.0! El evento educativo del año. Guadalajara, Jalisco. ${CONFIG.EVENT_DATE_TEXT}. #MaestrosFest2 #TikEduca`;
  if (navigator.share) {
    navigator.share({
      title: "Maestros Fest 2.0",
      text: `¡Me registré en el Maestros Fest 2.0! El evento educativo del año en Guadalajara, Jalisco. ${CONFIG.EVENT_DATE_TEXT}. ¡Únete!`,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(text).then(() =>
      alert("¡Texto copiado! Pégalo donde quieras compartirlo")
    );
  }
};

// ── 8. HOTEL BOOKING SYSTEM ──────────────────────────────────────────────
const hotelState = { tipo: "", precioNoche: 0, noches: 1 };
const checkInBase = new Date(CONFIG.HOTEL_CHECKIN_DATE);
const ROOM_LABELS = {
  sencilla: "Estándar Doble",
  doble: "Luxury King",
  suite: "Gobernador",
};

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt(d) {
  return d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function updateHotelCalc() {
  const total = hotelState.precioNoche * hotelState.noches;
  
  const display = document.getElementById("nightsDisplay");
  if (display) display.textContent = hotelState.noches;
  
  const calcNoches = document.getElementById("calc_noches");
  if (calcNoches) calcNoches.textContent = hotelState.noches;
  
  const calcTipo = document.getElementById("calc_tipo");
  if (calcTipo) calcTipo.textContent = hotelState.tipo ? ROOM_LABELS[hotelState.tipo] : "— No seleccionada";
  
  const calcPrecio = document.getElementById("calc_precio");
  if (calcPrecio) {
    calcPrecio.textContent = hotelState.precioNoche > 0 ? "$" + hotelState.precioNoche.toLocaleString("es-MX") + " MXN" : "$0 MXN";
  }
  
  const calcTotal = document.getElementById("calc_total");
  if (calcTotal) {
    calcTotal.textContent = "$" + total.toLocaleString("es-MX") + " MXN";
  }

  const cin = checkInBase;
  const cout = addDays(checkInBase, hotelState.noches);
  
  const checkinLabel = document.getElementById("checkinLabel");
  if (checkinLabel) checkinLabel.textContent = fmt(cin);
  
  const checkoutLabel = document.getElementById("checkoutLabel");
  if (checkoutLabel) checkoutLabel.textContent = fmt(cout);
}

window.changeNights = function(delta) {
  hotelState.noches = Math.max(1, Math.min(5, hotelState.noches + delta));
  updateHotelCalc();
};

window.selectRoom = function(el, tipo, colorClass) {
  document.querySelectorAll(".room-card").forEach((c) => {
    c.classList.remove("selected-cyan", "selected-purple", "selected-yellow");
  });
  el.classList.add("selected-" + colorClass);
  hotelState.tipo = tipo;
  hotelState.precioNoche = CONFIG.HOTEL_PRICES[tipo];
  updateHotelCalc();
  setTimeout(() => window.openHotelModal(tipo), 380);
};

window.modalSelectRoom = function(el, tipo, precio) {
  document.querySelectorAll(".modal-room-btn").forEach((b) => {
    b.style.borderColor = "";
    b.style.background = "rgba(10,17,40,0.8)";
    b.style.boxShadow = "";
  });
  const colors = { sencilla: "rgba(0,229,255,0.5)", doble: "rgba(155,0,255,0.5)", suite: "rgba(255,229,0,0.5)" };
  const bgs = { sencilla: "rgba(0,229,255,0.08)", doble: "rgba(155,0,255,0.1)", suite: "rgba(255,229,0,0.07)" };
  
  el.style.borderColor = colors[tipo];
  el.style.background = bgs[tipo];
  el.style.boxShadow = "0 0 15px " + colors[tipo];
  
  hotelState.tipo = tipo;
  hotelState.precioNoche = precio;
  document.getElementById("hotel_tipo").value = tipo;
  document.getElementById("hotel_precio_noche").value = precio;
  updateHotelCalc();
};

window.openHotelModal = function(preselect) {
  document.getElementById("hotelViewA").classList.remove("hidden");
  document.getElementById("hotelViewB").classList.add("hidden");
  document.getElementById("hotelViewPayment").classList.add("hidden");
  document.getElementById("hotelViewC").classList.add("hidden");
  document.getElementById("hotelErrorA").classList.add("hidden");
  
  const modal = document.getElementById("modalHotel");
  if (modal) modal.classList.add("active");
  document.body.style.overflow = "hidden";
  
  if (preselect) {
    hotelState.tipo = preselect;
    hotelState.precioNoche = CONFIG.HOTEL_PRICES[preselect] || 0;
    document.querySelectorAll(".modal-room-btn").forEach((b) => {
      const onclickAttr = b.getAttribute("onclick");
      if (onclickAttr && onclickAttr.includes("'" + preselect + "'")) {
        window.modalSelectRoom(b, preselect, CONFIG.HOTEL_PRICES[preselect]);
      }
    });
  }
  updateHotelCalc();
  
  if (userData.nombre) {
    document.getElementById("hotel_nombre").value = userData.nombre.split(" ")[0] || "";
  }
  if (userData.email) {
    document.getElementById("hotel_email").value = userData.email;
  }
  if (userData.whatsapp) {
    document.getElementById("hotel_tel").value = userData.whatsapp;
  }
};

window.closeHotelModal = function() {
  const modal = document.getElementById("modalHotel");
  if (modal) modal.classList.remove("active");
  document.body.style.overflow = "";
};

const modalHotel = document.getElementById("modalHotel");
if (modalHotel) {
  modalHotel.addEventListener("click", function (e) {
    if (e.target === this) window.closeHotelModal();
  });
}

window.goHotelFormB = function() {
  if (!hotelState.tipo) {
    const err = document.getElementById("hotelErrorA");
    if (err) {
      err.classList.remove("hidden");
      setTimeout(() => err.classList.add("hidden"), 3000);
    }
    return;
  }
  document.getElementById("summTipo").textContent = ROOM_LABELS[hotelState.tipo];
  document.getElementById("summNoches").textContent = hotelState.noches;
  document.getElementById("summTotal").textContent = "$" + (hotelState.precioNoche * hotelState.noches).toLocaleString("es-MX") + " MXN";
  
  document.getElementById("hotelViewA").classList.add("hidden");
  document.getElementById("hotelViewB").classList.remove("hidden");
  document.getElementById("hotelViewB").style.animation = "fadeIn 0.4s ease-out";
};

window.backHotelA = function() {
  document.getElementById("hotelViewB").classList.add("hidden");
  document.getElementById("hotelViewA").classList.remove("hidden");
};

window.submitHotel = function() {
  const nombre = document.getElementById("hotel_nombre").value.trim();
  const apellidos = document.getElementById("hotel_apellidos").value.trim();
  const email = document.getElementById("hotel_email").value.trim();
  const tel = document.getElementById("hotel_tel").value.trim();

  if (!nombre || !apellidos || !email || !tel) {
    const err = document.getElementById("hotelErrorB");
    if (err) {
      err.classList.remove("hidden");
      setTimeout(() => err.classList.add("hidden"), 3500);
    }
    return;
  }

  hotelState.nombre = nombre;
  hotelState.apellidos = apellidos;
  hotelState.email = email;
  hotelState.tel = tel;
  hotelState.notas = document.getElementById("hotel_notas").value.trim();
  
  const total = hotelState.precioNoche * hotelState.noches;
  document.getElementById("hotel_payment_room_name").textContent = ROOM_LABELS[hotelState.tipo];
  document.getElementById("hotel_payment_nights").textContent = hotelState.noches + " noche(s)";
  document.getElementById("hotel_payment_total").textContent = "$" + total.toLocaleString("es-MX") + " MXN";
  document.getElementById("hotel_pay_nombre_transfer").value = nombre + " " + apellidos;
  
  document.getElementById("hotelViewB").classList.add("hidden");
  document.getElementById("hotelViewPayment").classList.remove("hidden");
  document.getElementById("hotelViewPayment").style.animation = "fadeIn 0.4s ease-out";
};

window.backHotelB = function() {
  document.getElementById("hotelViewPayment").classList.add("hidden");
  document.getElementById("hotelViewB").classList.remove("hidden");
  document.getElementById("hotelViewB").style.animation = "fadeIn 0.4s ease-out";
};

window.copyHotelAccount = function() {
  const acc = document.getElementById("hotelAccountNumber").textContent.replace(/\s/g, "");
  navigator.clipboard.writeText(acc).then(() => {
    const btn = document.getElementById("hotelCopyBtn");
    if (btn) {
      btn.innerHTML = "<span>COPIADO</span>";
      btn.style.borderColor = "var(--pink)";
      btn.style.color = "var(--pink)";
      setTimeout(() => {
        btn.innerHTML = "<span>COPIAR</span>";
        btn.style.borderColor = "var(--purple)";
        btn.style.color = "var(--purple)";
      }, 2000);
    }
  });
};

window.submitHotelPayment = async function() {
  const transferNombre = document.getElementById("hotel_pay_nombre_transfer").value.trim();
  const referencia = document.getElementById("hotel_pay_referencia").value.trim();
  const fecha = document.getElementById("hotel_pay_fecha").value;
  const fileInput = document.getElementById("hotel_comprobante");
  const file = fileInput.files ? fileInput.files[0] : null;

  if (!transferNombre || !referencia || !fecha || !file) {
    const err = document.getElementById("hotelPayError");
    if (err) {
      err.classList.remove("hidden");
      setTimeout(() => err.classList.add("hidden"), 3500);
    }
    return;
  }

  const total = hotelState.precioNoche * hotelState.noches;
  const checkInDate = new Date(CONFIG.HOTEL_CHECKIN_DATE);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + Number(hotelState.noches));
  const fmtFecha = (d) => d.toLocaleDateString("es-MX", { day:"numeric", month:"short", year:"numeric" });

  const btn = document.getElementById("btnConfirmarHotel");
  if (btn) { 
    btn.disabled = true; 
    btn.innerHTML = "⏳ GUARDANDO..."; 
  }
  
  let guardadoOk = false;
  try {
    const base64 = await fileToBase64(file);
    const params = new URLSearchParams({
      tipo: "hotel",
      nombre: hotelState.nombre || "",
      apellidos: hotelState.apellidos || "",
      email: hotelState.email || "",
      tel: hotelState.tel || "",
      habitacion: ROOM_LABELS[hotelState.tipo] || hotelState.tipo,
      noches: hotelState.noches,
      total: "$" + total.toLocaleString("es-MX") + " MXN",
      checkin: fmtFecha(checkInDate),
      checkout: fmtFecha(checkOutDate),
      notas: hotelState.notas || "",
      titular: transferNombre,
      referencia,
      fechaPago: fecha,
      comprobanteBase64: base64,
      comprobanteNombre: file.name,
      comprobanteMime: file.type || "image/jpeg"
    });
    
    await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST", 
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    guardadoOk = true;
  } catch (_) {}

  document.getElementById("conf_tipo").textContent = ROOM_LABELS[hotelState.tipo];
  document.getElementById("conf_noches").textContent = hotelState.noches + " noche(s)";
  document.getElementById("conf_total").textContent = "$" + total.toLocaleString("es-MX") + " MXN";

  const waMsg = `Hola, acabo de registrar mi pago por transferencia para la reserva de hotel del Maestros Fest 2.0.\nHuésped: ${hotelState.nombre} ${hotelState.apellidos}\nWhatsApp: ${hotelState.tel}\nHabitación: ${ROOM_LABELS[hotelState.tipo]}\nNoches: ${hotelState.noches}\nTotal Pagado: $${total.toLocaleString("es-MX")} MXN\nTitular de transferencia: ${transferNombre}\nReferencia: ${referencia}\nFecha de pago: ${fecha}\nComprobante adjunto: [${file.name}]`;
  const waUrl = `https://wa.me/${CONFIG.ORGANIZER_WA}?text=${encodeURIComponent(waMsg)}`;
  
  const nota = guardadoOk
    ? `<div class="p-3 mb-4 rounded-lg text-left" style="background: rgba(255, 229, 0, 0.1); border: 1px solid rgba(255, 229, 0, 0.3);">
        <p class="text-yellow-400 text-xs font-bold mb-1 font-orbitron tracking-wider">📢 ¡ACCIÓN REQUERIDA PARA CONFIRMAR TU RESERVA!</p>
        <p class="text-gray-300 text-[11px] leading-relaxed font-space">
          Para garantizar la entrega inmediata de tu confirmación (debido a intermitencias en los correos), 
          <strong>es necesario enviar el comprobante haciendo clic en el botón de WhatsApp abajo</strong>.
        </p>
       </div>`
    : `<div class="p-3 mb-4 rounded-lg text-left" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
        <p class="text-red-400 text-xs font-bold mb-1 font-orbitron tracking-wider">⚠️ ERROR DE GUARDADO AUTOMÁTICO</p>
        <p class="text-gray-300 text-[11px] leading-relaxed font-space">
          No se pudo registrar tu pago automáticamente. 
          <strong>Por favor, envía tu comprobante por WhatsApp</strong> para poder registrar tu reserva manualmente.
        </p>
       </div>`;
  
  document.getElementById("hotelViewPayment").classList.add("hidden");
  document.getElementById("hotelViewC").classList.remove("hidden");
  
  if (typeof triggerSuccessSound === "function") triggerSuccessSound();
  
  document.getElementById("hotelViewC").style.animation = "fadeIn 0.5s ease-out";
  
  const noteContainer = document.querySelector("#hotelViewC .p-3.rounded-xl.mb-5.font-space");
  if (noteContainer) {
    noteContainer.innerHTML = `
      <div class="font-space text-gray-400 text-xs text-left space-y-1.5 mb-3">
        <span class="text-purple-400 font-bold block font-orbitron tracking-wider text-[10px]">PAGO REGISTRADO:</span>
        <div><strong class="text-gray-300">Habitación:</strong> ${ROOM_LABELS[hotelState.tipo]}</div>
        <div><strong class="text-gray-300">Noches:</strong> ${hotelState.noches}</div>
        <div><strong class="text-gray-300">Titular de Cuenta:</strong> ${transferNombre}</div>
        <div><strong class="text-gray-300">Referencia:</strong> ${referencia}</div>
        <div><strong class="text-gray-300">Comprobante:</strong> ${file.name}</div>
      </div>
      ${nota}
      <a href="${waUrl}" target="_blank" class="btn-gold inline-flex items-center justify-center w-full py-3 px-4 rounded-xl text-xs font-bold cursor-pointer font-orbitron tracking-wider" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); box-shadow: 0 0 15px rgba(37,211,102,0.4); border: none; color: white;">
        💬 ENVIAR COMPROBANTE POR WHATSAPP ⟶
      </a>
    `;
  }
};

window.shareHotel = function() {
  const text = `¡Ya reservé mi habitación para el Maestros Fest 2.0! Guadalajara, Jalisco. ${CONFIG.EVENT_DATE_TEXT}. ¿Te unes? #MaestrosFest2 #TikEduca`;
  if (navigator.share) {
    navigator.share({
      title: "Maestros Fest 2.0 – Hospedaje",
      text,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(text).then(() => alert("¡Texto copiado!"));
  }
};

// ── 9. MOBILE MENU NAVIGATION ────────────────────────────────────────────
window.openMobileMenu = function() {
  const overlay = document.getElementById('mobileMenuOverlay');
  const sheet = document.getElementById('mobileMenuSheet');
  if (overlay) overlay.classList.add('open');
  if (sheet) sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeMobileMenu = function() {
  const overlay = document.getElementById('mobileMenuOverlay');
  const sheet = document.getElementById('mobileMenuSheet');
  if (overlay) overlay.classList.remove('open');
  if (sheet) sheet.classList.remove('open');
  document.body.style.overflow = '';
};

// Escape Key Closes Modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.closeModal();
    window.closeHotelModal();
    window.closeSpeakerModal();
  }
});

// ── 10. FILE DRAG & DROP FOR COMPROBANTES ───────────────────────────────
(function () {
  // Main Comprobante
  const dropZoneMain = document.getElementById("uploadDropZone");
  const fileInputMain = document.getElementById("main_comprobante");
  const previewContainerMain = document.getElementById("comprobante_preview_container");
  const previewInfoMain = document.getElementById("comprobante_info");
  
  if (dropZoneMain && fileInputMain) {
    dropZoneMain.addEventListener("click", () => fileInputMain.click());
    dropZoneMain.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZoneMain.style.borderColor = "var(--pink)";
      dropZoneMain.style.background = "rgba(255, 0, 127, 0.05)";
    });
    dropZoneMain.addEventListener("dragleave", () => {
      dropZoneMain.style.borderColor = "";
      dropZoneMain.style.background = "";
    });
    dropZoneMain.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZoneMain.style.borderColor = "";
      dropZoneMain.style.background = "";
      if (e.dataTransfer.files.length) {
        fileInputMain.files = e.dataTransfer.files;
        handleFileSelectMain();
      }
    });
    fileInputMain.addEventListener("change", handleFileSelectMain);
  }

  function handleFileSelectMain() {
    if (fileInputMain.files && fileInputMain.files[0]) {
      const file = fileInputMain.files[0];
      previewInfoMain.innerHTML = `
        <div class="flex items-center gap-2 text-left">
          <span class="text-pink-500 text-lg">📄</span>
          <div class="min-w-0 flex-1">
            <div class="text-white font-medium truncate">${file.name}</div>
            <div class="text-gray-500 text-[10px]">${(file.size / 1024).toFixed(1)} KB</div>
          </div>
        </div>
      `;
      previewContainerMain.classList.remove("hidden");
      dropZoneMain.classList.add("hidden");
    }
  }

  window.removeUploadedFile = function (e) {
    if (e) e.stopPropagation();
    fileInputMain.value = "";
    previewContainerMain.classList.add("hidden");
    dropZoneMain.classList.remove("hidden");
  };

  // Hotel Comprobante
  const dropZoneHotel = document.getElementById("hotelUploadDropZone");
  const fileInputHotel = document.getElementById("hotel_comprobante");
  const previewContainerHotel = document.getElementById("hotel_comprobante_preview_container");
  const previewInfoHotel = document.getElementById("hotel_comprobante_info");
  
  if (dropZoneHotel && fileInputHotel) {
    dropZoneHotel.addEventListener("click", () => fileInputHotel.click());
    dropZoneHotel.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZoneHotel.style.borderColor = "var(--purple)";
      dropZoneHotel.style.background = "rgba(155, 0, 255, 0.05)";
    });
    dropZoneHotel.addEventListener("dragleave", () => {
      dropZoneHotel.style.borderColor = "";
      dropZoneHotel.style.background = "";
    });
    dropZoneHotel.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZoneHotel.style.borderColor = "";
      dropZoneHotel.style.background = "";
      if (e.dataTransfer.files.length) {
        fileInputHotel.files = e.dataTransfer.files;
        handleFileSelectHotel();
      }
    });
    fileInputHotel.addEventListener("change", handleFileSelectHotel);
  }

  function handleFileSelectHotel() {
    if (fileInputHotel.files && fileInputHotel.files[0]) {
      const file = fileInputHotel.files[0];
      previewInfoHotel.innerHTML = `
        <div class="flex items-center gap-2 text-left">
          <span class="text-purple-500 text-lg">📄</span>
          <div class="min-w-0 flex-1">
            <div class="text-white font-medium truncate">${file.name}</div>
            <div class="text-gray-500 text-[10px]">${(file.size / 1024).toFixed(1)} KB</div>
          </div>
        </div>
      `;
      previewContainerHotel.classList.remove("hidden");
      dropZoneHotel.classList.add("hidden");
    }
  }

  window.removeHotelUploadedFile = function (e) {
    if (e) e.stopPropagation();
    fileInputHotel.value = "";
    previewContainerHotel.classList.add("hidden");
    dropZoneHotel.classList.remove("hidden");
  };
})();


// ── 12. BACKGROUND PARTICLES CANVAS ─────────────────────────────────────
(function() {
  const canvas = document.getElementById("bgParticles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = (canvas.width = window.innerWidth);
    height = (canvas.height = window.innerHeight);
  });

  const colors = ["#00e5ff", "#ff007f", "#9b00ff", "#ffe500"];
  const particles = [];
  const particleCount = Math.min(60, Math.floor((width * height) / 30000));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.1,
      fadeDir: Math.random() < 0.5 ? 1 : -1,
      fadeSpeed: 0.002 + Math.random() * 0.003
    });
  }

  let mouseX = null;
  let mouseY = null;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouseX = null;
    mouseY = null;
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      p.alpha += p.fadeDir * p.fadeSpeed;
      if (p.alpha <= 0.1) {
        p.alpha = 0.1;
        p.fadeDir = 1;
      } else if (p.alpha >= 0.7) {
        p.alpha = 0.7;
        p.fadeDir = -1;
      }

      if (mouseX !== null && mouseY !== null) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.x += (dx / dist) * force * 0.8;
          p.y += (dy / dist) * force * 0.8;
        }
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }
  animate();
})();

// ── 13. INTERACTIVE SPLASH SCREEN LOADER ───────────────────────────────
(function() {
  const splashMsgs = [
    "CARGANDO EXPERIENCIA EDUCATIVA...",
    "ACTIVANDO MÓDULOS DIGITALES...",
    "SINCRONIZANDO COMUNIDAD DISRUPTIVA...",
    "PREPARANDO HOTEL HMB GUADALAJARA...",
    "SINTETIZANDO ELEMENTOS HOLOGRÁFICOS...",
    "INICIANDO MÓDULO WEB AUDIO API..."
  ];

  const splashFill = document.getElementById("splashFill");
  const splashMsg = document.getElementById("splashMsg");
  const splashLoader = document.getElementById("splash-loader");

  if (!splashLoader) return;

  // Canvas context configuration for neon particles inside splash screen
  const sCanvas = document.getElementById("splashCanvas");
  let sCtx = null, sParticles = [], sWidth = 0, sHeight = 0;
  if (sCanvas) {
    sCtx = sCanvas.getContext("2d");
    sWidth = sCanvas.width = window.innerWidth;
    sHeight = sCanvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      if (!sCanvas) return;
      sWidth = sCanvas.width = window.innerWidth;
      sHeight = sCanvas.height = window.innerHeight;
    });

    for (let i = 0; i < 35; i++) {
      sParticles.push({
        x: Math.random() * sWidth,
        y: Math.random() * sHeight,
        radius: Math.random() * 1.5 + 0.5,
        speedY: -0.2 - Math.random() * 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        color: ["#00e5ff", "#ff007f", "#9b00ff"][Math.floor(Math.random() * 3)]
      });
    }

    function drawSplashParticles() {
      if (!sCtx) return;
      sCtx.clearRect(0, 0, sWidth, sHeight);
      sParticles.forEach(p => {
        p.y += p.speedY;
        if (p.y < 0) p.y = sHeight;
        sCtx.save();
        sCtx.globalAlpha = p.alpha;
        sCtx.beginPath();
        sCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        sCtx.fillStyle = p.color;
        sCtx.shadowBlur = 5;
        sCtx.shadowColor = p.color;
        sCtx.fill();
        sCtx.restore();
      });
      requestAnimationFrame(drawSplashParticles);
    }
    drawSplashParticles();
  }

  let progress = 0;
  let msgIndex = 0;
  
  function updateProgress() {
    progress += Math.random() * 8 + 3;
    if (progress >= 100) {
      progress = 100;
      if (splashFill) splashFill.style.width = "100%";
      setTimeout(hideSplash, 400);
    } else {
      if (splashFill) splashFill.style.width = progress + "%";
      
      // Periodically update text messages
      if (progress > (msgIndex + 1) * 16 && msgIndex < splashMsgs.length - 1) {
        msgIndex++;
        if (splashMsg) splashMsg.textContent = splashMsgs[msgIndex];
      }
      setTimeout(updateProgress, Math.random() * 120 + 40);
    }
  }

  function hideSplash() {
    if (splashLoader) {
      splashLoader.classList.add("ld-fade");
      setTimeout(() => {
        splashLoader.style.display = "none";
        splashLoader.remove();
      }, 1000);
    }
  }

  // Run progress load
  setTimeout(updateProgress, 200);
})();
