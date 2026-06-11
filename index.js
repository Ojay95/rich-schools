// Initialize Firebase dynamically if configured
let db = null;
let useFirebase = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadFirebase() {
  const config = window.firebaseConfig;
  if (config && config.apiKey && config.apiKey !== "YOUR_API_KEY") {
    try {
      if (!window.firebase) {
        await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
        await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js");
      }
      
      const app = window.firebase.initializeApp(config);
      db = window.firebase.firestore(app);
      
      useFirebase = true;
      console.log("Firebase initialized dynamically successfully via Compat SDK.");
      
      if (typeof window.onFirebaseReady === 'function') {
        window.onFirebaseReady();
      }
    } catch (err) {
      console.warn("Firebase failed to load dynamically. Running in offline/fallback mode:", err);
    }
  }
}

loadFirebase();

function init() {
  // 1. Header scroll effect
  const header = document.querySelector('header');
  if (header) {
    const checkHeaderScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('glass');
        header.style.boxShadow = 'var(--shadow-md)';
      } else {
        header.classList.remove('glass');
        header.style.boxShadow = 'none';
      }
    };
    window.addEventListener('scroll', checkHeaderScroll);
    checkHeaderScroll(); // Init status
  }

  // 2. Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('nav');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });
  }

  // 3. Scroll Reveal Observer (Fallback for scroll-driven animations)
  const scrollElements = document.querySelectorAll('.reveal-on-scroll');
  if (scrollElements.length > 0) {
    const elementObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });
    scrollElements.forEach(el => elementObserver.observe(el));
  }

  // 4. Accordion Component (Services Details)
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');
      
      // Close other accordions
      document.querySelectorAll('.accordion-item').forEach(accItem => {
        accItem.classList.remove('open');
        accItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
      });
      
      if (!isOpen) {
        item.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // 5. Contact Form Handler
  const contactForm = document.getElementById('contactForm');
  const formContainer = document.getElementById('formContainer');
  const successContainer = document.getElementById('successContainer');

  if (contactForm && formContainer && successContainer) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Basic client check
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      // Collect data (for mockup output)
      const formData = new FormData(contactForm);
      const dataObj = Object.fromEntries(formData.entries());
      console.log('Contact form submitted:', dataObj);

      // Loading state mockup
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending message...';

      setTimeout(() => {
        formContainer.style.display = 'none';
        successContainer.style.display = 'block';
        window.scrollTo({ top: formContainer.offsetTop - 100, behavior: 'smooth' });
      }, 1200);
    });
  }

  // 6. Newsletter Subscription Forms (Footer / Register)
  const newsletterForms = document.querySelectorAll('.newsletter-form, #registerForm');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value) return;

      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Subscribed!';

      setTimeout(() => {
        emailInput.value = '';
        btn.disabled = false;
        btn.textContent = originalText;
        alert('Thank you for registering! We will keep you updated with useful information.');
      }, 800);
    });
  });

  // 7. Unsubscribe Page Form
  const unsubscribeForm = document.getElementById('unsubscribeForm');
  const unsubContainer = document.getElementById('unsubContainer');
  const unsubSuccess = document.getElementById('unsubSuccess');
  if (unsubscribeForm && unsubContainer && unsubSuccess) {
    unsubscribeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!unsubscribeForm.checkValidity()) return;

      const btn = unsubscribeForm.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Processing...';

      setTimeout(() => {
        unsubContainer.style.display = 'none';
        unsubSuccess.style.display = 'block';
      }, 1000);
    });
  }

  // 8. Multi-Step Scheduler Wizard (book.html)
  initScheduler();

  // 9. Dynamic Blog Engine (blog.html)
  initBlog();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* Multi-Step Scheduler Functionality */
function initScheduler() {
  const wizard = document.getElementById('bookingWizardContainer');
  if (!wizard) return;

  const panels = wizard.querySelectorAll('.step-panel');
  const dots = wizard.querySelectorAll('.step-dot');
  const nextBtns = wizard.querySelectorAll('.btn-next');
  const prevBtns = wizard.querySelectorAll('.btn-prev');
  const finishBtn = wizard.getElementById ? wizard.getElementById('btnFinish') : document.getElementById('btnFinish');
  
  let currentStep = 0;
  let selectedService = '';
  let selectedFormat = '';
  let selectedDate = '';
  let selectedTime = '';

  // Step 1: Select Service Choice Cards
  const serviceCards = wizard.querySelectorAll('.choices-grid[data-type="service"] .choice-card');
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      serviceCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedService = card.getAttribute('data-value');
      enableNextBtn(0);
    });
  });

  // Step 2: Select Format Choice Cards
  const formatCards = wizard.querySelectorAll('.choices-grid[data-type="format"] .choice-card');
  formatCards.forEach(card => {
    card.addEventListener('click', () => {
      formatCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedFormat = card.getAttribute('data-value');
      enableNextBtn(1);
    });
  });

  // Step 3: Date & Time Picker
  const dateInput = wizard.querySelector('#bookingDate');
  const timeSlotBtns = wizard.querySelectorAll('.time-slot-btn');
  
  if (dateInput) {
    // Restrict dates to today or future only
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.addEventListener('change', () => {
      selectedDate = dateInput.value;
      checkDateTimeCompletion();
    });
  }

  timeSlotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeSlotBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTime = btn.textContent.trim();
      checkDateTimeCompletion();
    });
  });

  function checkDateTimeCompletion() {
    if (selectedDate && selectedTime) {
      enableNextBtn(2);
    }
  }

  // Navigation Logic
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep < panels.length - 1) {
        // Validation check for Step 3 (form fields)
        if (currentStep === 3) {
          const formInputs = panels[3].querySelectorAll('input[required]');
          let valid = true;
          formInputs.forEach(input => {
            if (!input.checkValidity()) {
              input.reportValidity();
              valid = false;
            }
          });
          if (!valid) return;
        }

        goToStep(currentStep + 1);
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) {
        goToStep(currentStep - 1);
      }
    });
  });

  if (finishBtn) {
    finishBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const detailsForm = document.getElementById('bookingDetailsForm');
      if (detailsForm && !detailsForm.checkValidity()) {
        detailsForm.reportValidity();
        return;
      }

      // Collect final inputs
      const clientName = document.getElementById('clientName')?.value || '';
      const clientEmail = document.getElementById('clientEmail')?.value || '';
      const clientPhone = document.getElementById('clientPhone')?.value || '';
      const clientNotes = document.getElementById('clientNotes')?.value || '';

      const bookingPayload = {
        service: selectedService,
        format: selectedFormat,
        date: selectedDate,
        time: selectedTime,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        notes: clientNotes,
        createdAt: new Date().toISOString()
      };

      console.log('Consultation Booking Completed:', bookingPayload);

      // Show spinner state
      finishBtn.disabled = true;
      finishBtn.textContent = 'Booking your schedule...';

      // Save request to database
      let savedToFirestore = false;
      if (useFirebase && db) {
        try {
          await db.collection("bookings").add(bookingPayload);
          console.log("Booking written to Firestore successfully!");
          savedToFirestore = true;
        } catch (err) {
          console.error("Error writing booking to Firestore (falling back to LocalStorage):", err);
        }
      }

      if (!savedToFirestore) {
        // Fallback to local storage if Firebase is offline, unconfigured, or fails to write
        const localBookings = JSON.parse(localStorage.getItem('rich_schools_bookings') || '[]');
        localBookings.push(bookingPayload);
        localStorage.setItem('rich_schools_bookings', JSON.stringify(localBookings));
        console.log("Booking saved to LocalStorage successfully.");
      }

      setTimeout(() => {
        document.getElementById('bookingWizardContainer').style.display = 'none';
        document.getElementById('bookingSuccessContainer').style.display = 'block';
        
        // Populate summary
        const summaryEl = document.getElementById('bookingSummary');
        if (summaryEl) {
          summaryEl.innerHTML = `
            <strong>Service:</strong> ${selectedService}<br>
            <strong>Type:</strong> ${selectedFormat}<br>
            <strong>Date & Time:</strong> ${selectedDate} at ${selectedTime}<br>
            <strong>Contact:</strong> ${clientName} (${clientEmail})
          `;
        }
      }, 1000);
    });
  }

  function goToStep(step) {
    panels[currentStep].classList.remove('active');
    dots[currentStep].classList.remove('active');
    
    if (step > currentStep) {
      dots[currentStep].classList.add('completed');
    } else {
      dots[step].classList.remove('completed');
    }

    currentStep = step;
    panels[currentStep].classList.add('active');
    dots[currentStep].classList.add('active');
    
    // Auto scroll to scheduler top
    window.scrollTo({ top: wizard.offsetTop - 120, behavior: 'smooth' });
  }

  function enableNextBtn(stepIndex) {
    nextBtns[stepIndex].disabled = false;
  }
}

/* Dynamic Blog Engine */
async function initBlog() {
  const blogContainer = document.getElementById('blogGrid');
  if (!blogContainer) return;

  const searchInput = document.getElementById('blogSearch');
  const tagBtns = document.querySelectorAll('.blog-tag');
  const noResults = document.getElementById('noResults');

  // Hardcoded premium blog data to render dynamically as fallback
  const fallbackPosts = [
    {
      title: "Understanding UK Common Entrance Exams (11+ & 13+)",
      date: "May 24, 2026",
      category: "advice",
      categoryLabel: "Educational Advice",
      snippet: "Preparing your child for independent school exams can feel daunting. Here's a breakdown of the syllabus, timing and how to approach assessments with confidence.",
      img: "hero_bg.png" // Fallback to our premium school photo
    },
    {
      title: "Finding the Right Boarding School for International Students",
      date: "May 12, 2026",
      category: "placement",
      categoryLabel: "School Placement",
      snippet: "Choosing a boarding school from overseas involves looking beyond rankings. Discover how to evaluate school culture, boarding houses, and international integration.",
      img: "hero_bg.png"
    },
    {
      title: "The Importance of Guardianship and Pastoral Care in the UK",
      date: "April 29, 2026",
      category: "care",
      categoryLabel: "Pastoral Care",
      snippet: "For families living abroad, a local guardian isn't just a legal requirement — they are an essential lifeline. Discover how our pastoral service builds a home away from home.",
      img: "hero_bg.png"
    },
    {
      title: "Preparing for Academic Assessment: A Parent's Guide",
      date: "April 15, 2026",
      category: "assessments",
      categoryLabel: "Academic Assessments",
      snippet: "Academic assessments shouldn't be stressful tests. Learn how we evaluate your child's learning profile to craft a customized support plan that enables them to thrive.",
      img: "hero_bg.png"
    },
    {
      title: "Navigating the Sixth-Form Selection Process",
      date: "March 22, 2026",
      category: "placement",
      categoryLabel: "School Placement",
      snippet: "Selecting between A-Levels, IB, or BTECs at sixth-form level defines a student's university pathway. We examine how to approach this critical decision stage.",
      img: "hero_bg.png"
    },
    {
      title: "Supporting Student Well-being and Mental Health in School",
      date: "March 08, 2026",
      category: "care",
      categoryLabel: "Pastoral Care",
      snippet: "A successful education is grounded in emotional well-being. Learn how independent schools evaluate pastoral care and support students going through transitions.",
      img: "hero_bg.png"
    }
  ];

  let activePosts = [...fallbackPosts];
  let currentTag = 'all';
  let searchQuery = '';

  function renderPosts() {
    blogContainer.innerHTML = '';
    
    const filtered = activePosts.filter(post => {
      const matchesTag = currentTag === 'all' || post.category === currentTag;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.snippet.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });

    if (filtered.length === 0) {
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
      filtered.forEach(post => {
        const card = document.createElement('article');
        card.className = 'blog-card glass reveal-on-scroll revealed';
        // Resolve img source
        const imgSrc = (post.img && (post.img.startsWith('http') || post.img.includes('assets/'))) ? post.img : `assets/${post.img || 'hero_bg.png'}`;
        card.innerHTML = `
          <div class="blog-img">
            <img src="${imgSrc}" alt="${post.title}" loading="lazy">
          </div>
          <div class="blog-card-content">
            <div class="blog-meta">
              <span>${post.date}</span>
              <span>•</span>
              <span>${post.categoryLabel || getCategoryLabel(post.category)}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.snippet}</p>
            <a href="#" class="blog-readmore">Read full article</a>
          </div>
        `;
        blogContainer.appendChild(card);
      });
    }
  }

  function getCategoryLabel(cat) {
    const labels = {
      advice: "Educational Advice",
      placement: "School Placement",
      care: "Pastoral Care",
      assessments: "Academic Assessments"
    };
    return labels[cat] || "General";
  }

  // Load from Firebase if active or register callback when loaded
  if (useFirebase && db) {
    fetchFirestorePosts();
  } else {
    window.onFirebaseReady = () => {
      fetchFirestorePosts();
    };
  }

  async function fetchFirestorePosts() {
    try {
      const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
      const fbPosts = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        let dateStr = data.date;
        if (data.createdAt && data.createdAt.seconds) {
          dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          });
        }
        fbPosts.push({
          id: doc.id,
          title: data.title,
          date: dateStr || "Recent",
          category: data.category,
          categoryLabel: data.categoryLabel || getCategoryLabel(data.category),
          snippet: data.snippet,
          img: data.imageUrl || "hero_bg.png"
        });
      });
      if (fbPosts.length > 0) {
        activePosts = fbPosts;
        renderPosts();
      }
    } catch (err) {
      console.warn("Failed to retrieve posts from Firestore, using fallbacks: ", err);
    }
  }

  // Search Event
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderPosts();
    });
  }

  // Tag Event
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tagBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTag = btn.getAttribute('data-tag');
      renderPosts();
    });
  });

  // Initial render
  renderPosts();
}
