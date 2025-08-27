'use strict';

/* -------------------------
   Helper
   ------------------------- */
const elementToggleFunc = (elem) => elem && elem.classList.toggle('active');

/* -------------------------
   Sidebar (mobile)
   ------------------------- */
const sidebar = document.querySelector('[data-sidebar]');
const sidebarBtn = document.querySelector('[data-sidebar-btn]');
if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener('click', () => elementToggleFunc(sidebar));
}

/* -------------------------
   Custom select / filter
   ------------------------- */
const select = document.querySelector('[data-select]');
const selectItems = document.querySelectorAll('[data-select-item]');
const selectValue = document.querySelector('[data-selecct-value]'); // note: typo in "selecct"
const filterBtn = document.querySelectorAll('[data-filter-btn]');
const filterItems = document.querySelectorAll('[data-filter-item]');

if (select) select.addEventListener('click', function () { elementToggleFunc(this); });

const filterFunc = function (selectedValue) {
  filterItems.forEach(item => {
    if (selectedValue === 'all') {
      item.classList.add('active');
    } else if (selectedValue === item.dataset.category) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
};

if (selectItems.length && selectValue) {
  selectItems.forEach(si => {
    si.addEventListener('click', function () {
      const selectedValue = this.innerText.toLowerCase().trim();
      selectValue.innerText = this.innerText;
      elementToggleFunc(select);
      filterFunc(selectedValue);
    });
  });
}

if (filterBtn.length) {
  let lastClickedBtn = filterBtn[0];
  filterBtn.forEach(btn => {
    btn.addEventListener('click', function () {
      const selectedValue = this.innerText.toLowerCase().trim();
      if (selectValue) selectValue.innerText = this.innerText;
      filterFunc(selectedValue);
      if (lastClickedBtn) lastClickedBtn.classList.remove('active');
      this.classList.add('active');
      lastClickedBtn = this;
    });
  });
}

/* -------------------------
   Contact form validation
   ------------------------- */
const form = document.querySelector('[data-form]') || document.querySelector('form');
const formInputs = document.querySelectorAll('[data-form-input]');
const formBtn = document.querySelector('[data-form-btn]');

if (form && formInputs.length) {
  formInputs.forEach(inp => {
    inp.addEventListener('input', function () {
      if (form.checkValidity()) {
        if (formBtn) formBtn.removeAttribute('disabled');
      } else {
        if (formBtn) formBtn.setAttribute('disabled', '');
      }
    });
  });
}

/* -------------------------
   Page navigation
   ------------------------- */
const navigationLinks = document.querySelectorAll('[data-nav-link]');
const pages = document.querySelectorAll('[data-page]');

if (navigationLinks.length && pages.length) {
  const aliasMap = {
    'projects': 'portfolio',
    'project': 'portfolio'
  };

  navigationLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      let target = (link.dataset.target || link.innerText || '').toLowerCase().trim();
      if (aliasMap[target]) target = aliasMap[target];

      let found = false;
      pages.forEach(page => {
        const isTarget = (page.dataset.page === target);
        page.classList.toggle('active', isTarget);
        if (isTarget) found = true;
      });

      navigationLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      if (!found) {
        console.warn(`No page found for nav target "${target}". Consider adding data-target="${target}" to the button or ensure you have <article data-page="${target}">`);
      }

      window.scrollTo(0, 0);
    });
  });
}
