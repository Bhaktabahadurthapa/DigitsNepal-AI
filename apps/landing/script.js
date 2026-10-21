const languageButton = document.querySelector(".language-button");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");

function setLanguage(locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll("[data-en][data-ne]").forEach((node) => {
    node.textContent = node.dataset[locale];
  });
  languageButton.innerHTML = locale === "en" ? '<span aria-hidden="true">अ</span> नेपाली' : '<span aria-hidden="true">A</span> English';
  languageButton.setAttribute("aria-label", locale === "en" ? "Switch to Nepali" : "Switch to English");
  localStorage.setItem("dn-language", locale);
}

languageButton.addEventListener("click", () => setLanguage(document.documentElement.lang === "en" ? "ne" : "en"));
setLanguage(localStorage.getItem("dn-language") === "ne" ? "ne" : "en");

menuButton.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navLinks.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
document.querySelectorAll(".nav-links a").forEach((link) => {
  const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, "") || "/";
  if (linkPath === currentPath) link.setAttribute("aria-current", "page");
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelectorAll("[data-stage]").forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.stage !== filter;
    });
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
document.getElementById("year").textContent = String(new Date().getFullYear());
