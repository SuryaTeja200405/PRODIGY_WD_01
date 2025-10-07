const select = (selector, parent = document) => parent.querySelector(selector);
const selectAll = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

function setCurrentYear() {
  const yearElement = select('#year');
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}

function updateHeaderOnScroll() {
  const header = select('#header');
  if (!header) return;
  
  const currentScrollY = window.scrollY;
  const hasScrolled = currentScrollY > 12;
  
  // Add/remove scrolled class for backdrop blur effect
  header.classList.toggle('scrolled', hasScrolled);
  
  // Keep header always visible - remove any hidden class
  header.classList.remove('hidden');
}

function enableSmoothNavScroll() {
  const navLinks = selectAll('.nav-link');
  const header = select('#header');
  
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      event.preventDefault();

      const targetSection = select(href);
      if (!targetSection) return;

      // Calculate header height for offset
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

      // Smooth scroll to target
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Close mobile menu if open
      const navMenu = select('#nav-menu');
      const navOverlay = select('.nav-overlay');
      const menuToggle = select('.nav-toggle');
      if (navMenu?.classList.contains('open')) {
        navMenu.classList.remove('open');
        navOverlay?.classList.remove('active');
        menuToggle?.setAttribute('aria-expanded', 'false');
        navMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  });
}

function setupMobileMenuToggle() {
  const menuToggle = select('.nav-toggle');
  const navMenu = select('#nav-menu');
  const navOverlay = select('.nav-overlay');
  const body = document.body;
  
  if (!menuToggle || !navMenu) return;

  function openMenu() {
    navMenu.classList.add('open');
    navOverlay?.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    navMenu.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    
    // Focus first menu item
    const firstLink = navMenu.querySelector('.nav-link');
    firstLink?.focus();
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    navOverlay?.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    navMenu.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    menuToggle.focus();
  }

  function toggleMenu() {
    const isOpen = navMenu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  }

  // Toggle menu on button click
  menuToggle.addEventListener('click', toggleMenu);

  // Close menu on overlay click
  navOverlay?.addEventListener('click', closeMenu);

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  // Handle keyboard navigation in menu
  navMenu.addEventListener('keydown', (e) => {
    const menuItems = Array.from(navMenu.querySelectorAll('.nav-link'));
    const currentIndex = menuItems.indexOf(document.activeElement);

    switch (e.key) {
      case 'Tab':
        if (e.shiftKey && currentIndex === 0) {
          e.preventDefault();
          menuItems[menuItems.length - 1].focus();
        } else if (!e.shiftKey && currentIndex === menuItems.length - 1) {
          e.preventDefault();
          menuItems[0].focus();
        }
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        menuItems[nextIndex].focus();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        menuItems[prevIndex].focus();
        break;
      case 'Home':
        e.preventDefault();
        menuItems[0].focus();
        break;
      case 'End':
        e.preventDefault();
        menuItems[menuItems.length - 1].focus();
        break;
    }
  });

  // Add touch support for mobile
  let touchStartY = 0;
  navMenu.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  navMenu.addEventListener('touchmove', (e) => {
    if (!navMenu.classList.contains('open')) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    
    // Close menu on swipe up gesture (only for mobile full-screen menu)
    if (deltaY < -50 && window.innerWidth <= 480) {
      closeMenu();
    }
  }, { passive: true });

  // Close menu on window resize if larger than mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 767 && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

function setupScrollReveal() {
  const revealElements = selectAll('.reveal');
  if (revealElements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((el) => observer.observe(el));
}

function setupActiveLinkHighlighting() {
  const sectionIds = ['#home', '#about', '#services', '#contact'];
  const sections = sectionIds
    .map((id) => ({ id, el: select(id) }))
    .filter((s) => s.el);

  const linkByHref = new Map(selectAll('.nav-link').map((link) => [link.getAttribute('href'), link]));
  if (sections.length === 0 || linkByHref.size === 0) return;

  function setActiveLinkById(id) {
    linkByHref.forEach((link) => link.classList.remove('active'));
    const targetLink = linkByHref.get(id);
    if (targetLink) targetLink.classList.add('active');
  }

  function handleScroll() {
    const header = select('#header');
    const headerHeight = header ? header.offsetHeight : 0;
    const scrollPosition = window.scrollY + headerHeight + 50;

    let currentId = sections[0].id;
    
    // Find the current section based on scroll position
    sections.forEach(({ id, el }) => {
      const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
      const elementBottom = elementTop + el.offsetHeight;
      
      if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
        currentId = id;
      }
    });
    
    // Handle special case for the last section
    const lastSection = sections[sections.length - 1];
    if (lastSection) {
      const lastElementTop = lastSection.el.getBoundingClientRect().top + window.pageYOffset;
      if (scrollPosition >= lastElementTop) {
        currentId = lastSection.id;
      }
    }
    
    setActiveLinkById(currentId);
  }

  // Throttle scroll handler for better performance
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  handleScroll();
  window.addEventListener('scroll', requestTick, { passive: true });
}

setCurrentYear();
updateHeaderOnScroll();
enableSmoothNavScroll();
setupMobileMenuToggle();
setupScrollReveal();
setupActiveLinkHighlighting();

window.addEventListener('scroll', updateHeaderOnScroll, { passive: true }); 


