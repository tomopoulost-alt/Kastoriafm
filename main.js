(() => {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const year = document.querySelector("[data-year]");
  const cinematic = document.querySelector("[data-cinematic]");
  const progress = document.querySelector("[data-progress]");
  const slides = [...document.querySelectorAll("[data-slide]")];
  const chapters = [...document.querySelectorAll("[data-chapter]")];

  if (year) year.textContent = String(new Date().getFullYear());

  const closeNav = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });
  }

  const setChapter = (index) => {
    slides.forEach((el, i) => el.classList.toggle("is-active", i === index));
    chapters.forEach((el, i) => el.classList.toggle("is-active", i === index));
  };

  const onScroll = () => {
    if (!cinematic) return;

    const rect = cinematic.getBoundingClientRect();
    const total = cinematic.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const ratio = total > 0 ? scrolled / total : 0;

    if (progress) progress.style.width = `${ratio * 100}%`;

    const index = Math.min(
      slides.length - 1,
      Math.floor(ratio * slides.length)
    );
    setChapter(index);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }
})();
