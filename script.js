/* =========================================================
   Desa Tebas Sungai — interaksi
   Navigasi mobile, animasi muncul saat discroll, efek tilt
   3D ringan pada kartu, dan penghitung statistik berjalan.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Toggle menu mobile ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Animasi muncul saat discroll ---------- */
  const revealTargets = document.querySelectorAll(
    ".card, .stat, .news-item, .gallery-scene, .section-head, .list-hamlet li, .hero-art"
  );
  revealTargets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = (i % 6) * 60 + "ms";
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add("in-view"));
  }

  /* ---------- Efek tilt 3D ringan pada kartu & galeri ---------- */
  const tiltEls = document.querySelectorAll(".card, .gallery-scene");
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  if (isFinePointer) {
    tiltEls.forEach(el => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-4px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- Penghitung statistik berjalan ---------- */
  const stats = document.querySelectorAll(".stat b[data-count]");
  const animateCount = (el) => {
    const raw = el.getAttribute("data-count");
    const suffix = el.getAttribute("data-suffix") || "";
    const parts = raw.split(",");
    const decimals = parts[1] ? parts[1].length : 0;
    const target = parseFloat(parts[0] + (parts[1] ? "." + parts[1] : ""));
    const duration = 1100;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = decimals
        ? value.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Math.round(value).toLocaleString("id-ID");
      el.textContent += suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (stats.length && "IntersectionObserver" in window) {
    const statIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    stats.forEach(el => statIo.observe(el));
  }


  /* ---------- Forum Pengaduan (versi statis/localStorage) ---------- */
  const complaintForm = document.getElementById("complaintForm");
  const complaintResult = document.getElementById("complaintResult");
  const checkComplaint = document.getElementById("checkComplaint");
  const checkResult = document.getElementById("checkResult");

  const getComplaints = () => {
    try { return JSON.parse(localStorage.getItem("tebasSungaiComplaints") || "[]"); }
    catch { return []; }
  };

  const saveComplaints = (items) => localStorage.setItem("tebasSungaiComplaints", JSON.stringify(items));

  const makeToken = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const n = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    return `ADU-${y}${m}${d}-${n}`;
  };

  if (complaintForm) {
    complaintForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(complaintForm);
      const token = makeToken();
      const item = {
        token,
        nama: String(form.get("nama") || "").trim(),
        email: String(form.get("email") || "").trim(),
        kategori: String(form.get("kategori") || "").trim(),
        judul: String(form.get("judul") || "").trim(),
        isi: String(form.get("isi") || "").trim(),
        status: "Menunggu verifikasi",
        createdAt: new Date().toISOString()
      };
      const items = getComplaints();
      items.push(item);
      saveComplaints(items);
      complaintResult.className = "form-result success";
      complaintResult.innerHTML = `Pengaduan berhasil dicatat. Token kamu: <strong>${token}</strong><br>Simpan token ini untuk mengecek status pengaduan.`;
      document.getElementById("aduanToken").value = token;
      complaintForm.reset();
    });
  }

  if (checkComplaint) {
    checkComplaint.addEventListener("click", () => {
      const token = document.getElementById("aduanToken").value.trim().toUpperCase();
      const found = getComplaints().find(item => item.token === token);
      if (!token) {
        checkResult.className = "form-result error";
        checkResult.textContent = "Masukkan token pengaduan terlebih dahulu.";
        return;
      }
      if (!found) {
        checkResult.className = "form-result error";
        checkResult.textContent = "Token tidak ditemukan pada perangkat ini.";
        return;
      }
      checkResult.className = "form-result success";
      checkResult.innerHTML = `<strong>${found.judul}</strong><br>Kategori: ${found.kategori}<br>Status: <strong>${found.status}</strong>`;
    });
  }

});
