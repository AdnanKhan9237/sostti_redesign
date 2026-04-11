/**
 * core.js — SOSTTI 2026 Core Scripts
 * Handles: header/footer loading, dark mode, chatbot, floating buttons,
 *          scroll reveal, apply popup, certificate modal
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     0. GLOBAL HELPERS & PREFIX
  ══════════════════════════════════════════════════════════ */
  // Determine relative path prefix for component URLs
  var path = window.location.pathname;
  var prefix = '';
  if (path.indexOf('/pages/courses/') !== -1) {
    prefix = '../../';
  } else if (path.indexOf('/pages/') !== -1) {
    prefix = '../';
  }

  /* ══════════════════════════════════════════════════════════
     1. COMPONENT LOADER
  ══════════════════════════════════════════════════════════ */
  function loadHTML(selector, url, prefix, cb) {
    var el = document.querySelector(selector);
    if (!el) { if (cb) cb(); return; }
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        el.innerHTML = html;

        // Fix absolute-ish paths starting with / if a prefix exists
        if (prefix) {
          el.querySelectorAll('a[href^="/"], img[src^="/"], source[src^="/"]').forEach(function (node) {
            var attr = (node.tagName === 'A') ? 'href' : 'src';
            var val = node.getAttribute(attr);
            // Only fix if it's a root-relative path (starts with / but not //)
            if (val && val.charAt(0) === '/' && val.charAt(1) !== '/') {
              node.setAttribute(attr, prefix + val.substring(1));
            }
          });
        }

        // Execute any inline scripts
        el.querySelectorAll('script').forEach(function (s) {
          var ns = document.createElement('script');
          ns.textContent = s.textContent;
          document.head.appendChild(ns);
        });
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  /* ══════════════════════════════════════════════════════════
     2. DARK MODE
  ══════════════════════════════════════════════════════════ */
  var THEME_KEY = 'sostti-theme';

  function getTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    var pill = document.getElementById('theme-pill');
    if (pill) {
      pill.innerHTML = theme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
      pill.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      pill.setAttribute('aria-label', pill.title);
    }
  }

  function toggleTheme() {
    var cur = getTheme();
    var next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  function initTheme() {
    applyTheme(getTheme());
    // Create pill
    var pill = document.createElement('button');
    pill.id = 'theme-pill';
    pill.className = 'theme-pill';
    pill.setAttribute('aria-label', 'Toggle dark mode');
    pill.addEventListener('click', toggleTheme);
    document.body.appendChild(pill);
    applyTheme(getTheme()); // Apply icon after append
  }

  /* ══════════════════════════════════════════════════════════
     3. SCROLL REVEAL
  ══════════════════════════════════════════════════════════ */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (!window.revealObserver) {
      window.revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            window.revealObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.01, rootMargin: '0px 0px 100px 0px' });
    }

    els.forEach(function (el) {
      if (!el.classList.contains('visible')) {
        window.revealObserver.observe(el);
      }
    });
  }
  window.initReveal = initReveal;

  /* ══════════════════════════════════════════════════════════
     4. FLOATING BUTTONS
  ══════════════════════════════════════════════════════════ */
  function initFloatBtns() {
    var wrap = document.createElement('div');
    wrap.className = 'float-btns';
    wrap.innerHTML = [
      '<a class="float-btn float-wa" href="https://wa.me/923332247494?text=Hello%20SOSTTI" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>',
      '<a class="float-btn float-ph" href="tel:+923332247494" aria-label="Call"><i class="fas fa-phone"></i></a>',
      '<button class="float-btn float-top" id="back-top-btn" aria-label="Back to top" style="display:none"><i class="fas fa-arrow-up"></i></button>'
    ].join('');
    document.body.appendChild(wrap);

    var topBtn = document.getElementById('back-top-btn');
    if (topBtn) {
      window.addEventListener('scroll', function () {
        topBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
      }, { passive: true });
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     5. CHATBOT
  ══════════════════════════════════════════════════════════ */
  var BOT_KB = {
    greetings: {
      patterns: /hello|hi|hey|greetings|salaam|aoa|good morning|good afternoon/,
      responses: [
        "👋 Hello! I'm the SOSTTI Smart Assistant. I'm here to help you navigate your way into a successful technical career. What can I tell you about our institute today?",
        "Hi there! It's great to see you interested in technical education. Whether you're looking for free courses or professional certifications, I've got the answers. How can I help?",
        "Assalam-u-Alaikum! Welcome to SOS Technical Training Institute. How can we help you build your future today?"
      ]
    },
    identity: {
      patterns: /who are you|about sostti|mission|vision|what is sos|charity|organization/,
      responses: [
        "SOS Technical Training Institute (SOSTTI) is a project of **SOS Children's Villages Pakistan**. Since 2000, we have been dedicated to providing high-quality, professional vocational training to vulnerable youth and the general public, empowering them with the skills needed for financial independence.",
        "We are more than just a school; we are a path to empowerment. SOSTTI is a non-profit technical institute that focuses on market-driven skills, accredited by top government bodies like NAVTTC and BBSHRRDB."
      ]
    },
    thanks: {
      patterns: /thanks|thank you|thx|jazak|helpful|nice|great/,
      responses: [
        "You're very welcome! Supporting your education is what we do best. Is there anything else—perhaps about our free government programs—you'd like to know?",
        "Happy to assist! Remember, our doors are always open at Korangi if you want to see our labs in person. Anything else for today?"
      ]
    },
    digital_library: {
      patterns: /library|book|pdf|resource|manual|manuals|study material|reading|ebook/,
      responses: [
        "Knowledge should be free! Our **Digital Library** features over 100+ professional technical manuals, ranging from NASA graphics standards to OSHA safety guides. You can browse them all here: <a href='/pages/digital-library.html'>Visit Library</a>.",
        "We maintain a huge repository of PDF resources to help our students study at home. You can find manuals for Welding, Solar, Computer IT, and Digital Marketing in our <a href='/pages/digital-library.html'>Digital Library</a>."
      ]
    },
    courses: {
      patterns: /course|program|learn|study|train|what do you teach|classes|departments|marketing/,
      responses: [
        "We offer a wide range of professional trades across 14+ departments:\n\n• **Computer Sciences**: Web & Graphic Design, Digital Marketing, Computer Operator\n• **Engineering Trades**: Automobile, HVACR, Advance Welding, Machinist\n• **Electrical**: Solar PV, General/Industrial Electrician\n• **Life Skills**: English Language, Mobile Repairing\n\nMost courses are 6 months long and follow the 'Competency-Based Training' (CBT) model. Which area interests you most?",
        "Our courses are designed by industry experts. We offer both **Free Government-funded seats** and low-cost self-finance options. Popular choices right now are Solar PV, Web Development, and Digital Marketing."
      ]
    },
    admission: {
      patterns: /admiss|enroll|register|apply|join|how to get in|entrance|form|deadline/,
      responses: [
        "Joining SOSTTI is simple! Admissions are currently **OPEN**. You just need to be between 14-35 years old.\n\n**To register:** Visit our campus at Korangi with your CNIC (or B-Form) and 2 passport photos. We'll give you a simple entrance interview.\n\nYou can also start your journey by filling out our <a href='https://docs.google.com/forms/d/e/1FAIpQLSdnJItkIMyt3SGNaDeTBDcMTBKNeKJ4lC8cx3wxSOvjpciX4g/viewform' target='_blank'>Online Inquiry Form</a> and we'll call you back!"
      ]
    },
    fee: {
      patterns: /fee|cost|price|pay|afford|free|scholarship|monthly/,
      responses: [
        "We are committed to making education affordable for everyone. \n\n1. **Government Programs**: NAVTTC and BBSHRRDB courses are **100% FREE** with a monthly stipend often provided.\n2. **SOS Managed**: Our regular self-finance courses are highly subsidized thanks to our donors.\n\nYou can view the full breakdown on our <a href='/pages/feestructure.html'>Fee Structure</a> page."
      ]
    },
    certification: {
      patterns: /certificate|recognized|degree|valid|attested|navttc|grade/,
      responses: [
        "Excellence is guaranteed! SOSTTI is a **Grade-A** accredited institute by **NAVTTC** (National Vocational and Technical Training Commission) with an audit score of 92.5%. Our certificates are recognized both in Pakistan and internationally, which is a huge advantage for jobs in the Middle East and beyond."
      ]
    },
    facilities: {
      patterns: /facility|lab|workshop|machine|equipment|campus|building/,
      responses: [
        "We believe in 'Learning by Doing.' Our campus features modern workshops equipped with industrial-grade machines for Welding and Machining, high-end Computer Labs for IT, and a specialized Solar PV training ground. You're invited to visit us any weekday between 9 AM and 5 PM for a tour!"
      ]
    },
    job_placement: {
      patterns: /job|work|career|placement|hired|industry|future|salary/,
      responses: [
        "Your success is our priority. We have strong links with local industries in Korangi and Landhi. Many of our students are placed in internships and full-time positions at leading manufacturing firms"
      ]
    },
    location: {
      patterns: /location|address|where|map|find|office|how to reach/,
      responses: [
        "Our main campus is conveniently located at:\n**52/6, Korangi Township, Near Lalabad Goth, Korangi, Karachi.**\n\nIt's easily accessible by local transport. You can find us on Google Maps via the link in our website's footer."
      ]
    },
    contact: {
      patterns: /contact|phone|call|email|number|whatsapp|helpline/,
      responses: [
        "I'm here for quick questions, but for detailed academic guidance, you can call us directly:\n\n📞 **+92 333 2247494**"
      ]
    },
    fallback: [
      "I want to make sure I give you the right answer! Are you asking about our **courses**, **admission deadlines**, or **free government programs**?",
      "That's an interesting question. While I'm still learning some of the finer details, I can tell you that SOS Technical is dedicated to youth empowerment. Could you rephrase your question slightly?",
      "I'm not exactly sure about that specific detail. However, our main coordinator can definitely help you at **+92 333 2247494**. Should I tell you more about our **Digital Library** instead?"
    ]
  };

  function getBotResponse(msg) {
    var query = msg.toLowerCase();
    for (var key in BOT_KB) {
      if (key === 'fallback') continue;
      if (BOT_KB[key].patterns.test(query)) {
        var r = BOT_KB[key].responses;
        return r[Math.floor(Math.random() * r.length)];
      }
    }
    var f = BOT_KB.fallback;
    return f[Math.floor(Math.random() * f.length)];
  }

  function initChat() {
    var wrap = document.createElement('div');
    wrap.id = 'sostti-chat';
    wrap.innerHTML = [
      '<button class="chat-toggle" id="chat-toggle-btn" aria-label="Open chat">',
      '<i class="fas fa-comment-dots"></i>',
      '<span class="chat-notif" id="chat-notif"></span>',
      '</button>',
      '<div class="chat-box" id="chat-box" role="dialog" aria-label="SOSTTI Chat Support">',
      '<div class="chat-head">',
      '<div class="chat-head-avatar"><i class="fas fa-graduation-cap"></i></div>',
      '<div class="chat-head-info">',
      '<div class="chat-head-name">SOSTTI Smart Assistant</div>',
      '<div class="chat-head-status">● Online | Digital Assistant</div>',
      '</div>',
      '<button class="chat-close" id="chat-close-btn" aria-label="Close chat"><i class="fas fa-times"></i></button>',
      '</div>',
      '<div class="chat-msgs" id="chat-msgs"></div>',
      '<div id="chat-typing-indicator" style="display:none; padding: 10px 16px; font-size: .75rem; color: var(--text-3); font-style: italic;">Assistant is typing...</div>',
      '<div class="chat-quick" id="chat-quick">',
      '<button class="quick-btn" data-msg="Tell me about courses">Courses</button>',
      '<button class="quick-btn" data-msg="How to apply for admission">Admissions</button>',
      '<button class="quick-btn" data-msg="Free government programs">Free Programs</button>',
      '<button class="quick-btn" data-msg="Digital Library">Books</button>',
      '</div>',
      '<div class="chat-input-row">',
      '<input class="chat-input" id="chat-input" type="text" placeholder="Type your question..." aria-label="Chat message">',
      '<button class="chat-send" id="chat-send-btn" aria-label="Send"><i class="fas fa-paper-plane"></i></button>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(wrap);

    var toggleBtn = document.getElementById('chat-toggle-btn');
    var closeBtn = document.getElementById('chat-close-btn');
    var chatBox = document.getElementById('chat-box');
    var msgs = document.getElementById('chat-msgs');
    var input = document.getElementById('chat-input');
    var sendBtn = document.getElementById('chat-send-btn');
    var notif = document.getElementById('chat-notif');
    var typing = document.getElementById('chat-typing-indicator');

    function addMsg(text, type) {
      var row = document.createElement('div');
      row.className = 'msg ' + type;
      var avatar = type === 'bot' ? '<div class="msg-avatar"><i class="fas fa-robot"></i></div>' : '';
      row.innerHTML = avatar + '<div class="msg-bubble">' + text.replace(/\n/g, '<br>') + '</div>';
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function sendMsg(text) {
      if (!text.trim()) return;
      addMsg(text, 'user');
      input.value = '';
      document.getElementById('chat-quick').style.display = 'none';

      typing.style.display = 'block';
      msgs.scrollTop = msgs.scrollHeight;

      setTimeout(function () {
        typing.style.display = 'none';
        addMsg(getBotResponse(text), 'bot');
      }, 1000 + Math.random() * 500);
    }

    toggleBtn.addEventListener('click', function () {
      chatBox.classList.toggle('open');
      if (chatBox.classList.contains('open')) {
        notif.style.display = 'none';
        if (!msgs.children.length) {
          typing.style.display = 'block';
          setTimeout(function () {
            typing.style.display = 'none';
            addMsg('👋 Hello there! I am your SOSTTI Smart Assistant. How can I help you today?', 'bot');
          }, 600);
        }
        input.focus();
      }
    });

    closeBtn.addEventListener('click', function () { chatBox.classList.remove('open'); });
    sendBtn.addEventListener('click', function () { sendMsg(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(input.value); });

    document.querySelectorAll('.quick-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { sendMsg(btn.dataset.msg); });
    });

    setTimeout(function () { if (!chatBox.classList.contains('open')) notif.style.display = 'block'; }, 4000);
  }

  /* ══════════════════════════════════════════════════════════
     6. CERTIFICATE MODAL (Enhanced with Zoom)
  ══════════════════════════════════════════════════════════ */
  function initCertModal() {
    var overlay = document.createElement('div');
    overlay.className = 'cert-modal-overlay';
    overlay.id = 'cert-modal-overlay';
    overlay.innerHTML = [
      '<div class="cert-modal" id="cert-modal-box">',
      '<button class="cert-modal-close" id="cert-modal-close" aria-label="Close">×</button>',
      '<div class="cert-modal-container" id="cert-img-container">',
      '<div class="cert-modal-protection" id="cert-modal-protection"></div>',
      '<canvas id="cert-modal-canvas"></canvas>',
      '</div>',
      '<div class="cert-modal-controls">',
      '<button class="cert-ctrl-btn" id="cert-zoom-in" title="Zoom In"><i class="fas fa-search-plus"></i></button>',
      '<button class="cert-ctrl-btn" id="cert-zoom-out" title="Zoom Out"><i class="fas fa-search-minus"></i></button>',
      '<button class="cert-ctrl-btn" id="cert-zoom-reset" title="Reset Zoom"><i class="fas fa-sync-alt"></i></button>',
      '</div>',
      '<div class="cert-privacy-notice"><i class="fas fa-user-shield"></i> Privacy Protected: Direct download is restricted.</div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    var canvas = document.getElementById('cert-modal-canvas');
    var ctx = canvas.getContext('2d');
    var prot = document.getElementById('cert-modal-protection');
    var zoomLevel = 1;
    var currentImg = null;

    function updateZoom() {
      if (!canvas) return;
      canvas.style.transform = 'scale(' + zoomLevel + ')';
      // Sync protection div size with canvas
      setTimeout(function() {
        if (prot && canvas) {
          prot.style.width = (canvas.offsetWidth * zoomLevel) + 'px';
          prot.style.height = (canvas.offsetHeight * zoomLevel) + 'px';
        }
      }, 50);
    }

    function drawImageToCanvas(src) {
      var imgObj = new Image();
      imgObj.crossOrigin = "anonymous";
      imgObj.onload = function() {
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgObj, 0, 0);
        
        // Add a subtle watermark
        ctx.font = "bold " + (canvas.width / 20) + "px Arial";
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.textAlign = "center";
        ctx.fillText("SOS TECHNICAL TRAINING INSTITUTE - PRIVACY PROTECTED", canvas.width / 2, canvas.height / 2);
        
        currentImg = imgObj;
        updateZoom();
      };
      imgObj.src = src;
    }

    function preventDownload(e) {
      if (!overlay.classList.contains('open')) return;
      
      // Prevent Print (Ctrl+P), Save (Ctrl+S), Source (Ctrl+U)
      if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }

      // Prevent DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c'))) {
        e.preventDefault();
        return false;
      }
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-certificate]');
      if (btn) {
        zoomLevel = 1;
        drawImageToCanvas(btn.dataset.certificate);
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Lock scroll
        window.addEventListener('keydown', preventDownload);
      }
    });

    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', preventDownload);
      // Clear canvas memory
      setTimeout(function() { 
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentImg = null;
      }, 400);
    }

    document.getElementById('cert-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    // Zoom Controls
    document.getElementById('cert-zoom-in').addEventListener('click', function(e) {
      e.stopPropagation();
      if (zoomLevel < 3) { zoomLevel += 0.2; updateZoom(); }
    });
    document.getElementById('cert-zoom-out').addEventListener('click', function(e) {
      e.stopPropagation();
      if (zoomLevel > 0.6) { zoomLevel -= 0.2; updateZoom(); }
    });
    document.getElementById('cert-zoom-reset').addEventListener('click', function(e) {
      e.stopPropagation();
      zoomLevel = 1;
      updateZoom();
    });
  }


  /* ══════════════════════════════════════════════════════════
     8. TYPING EFFECT
  ══════════════════════════════════════════════════════════ */
  function initTyping() {
    var el = document.getElementById('typing-text');
    if (!el) return;
    var phrases = [
      'Computer Operator',
      'Web Designing & Development',
      'Graphic Designing',
      'Automobile Mechanic / Electrician',
      'HVACR',
      'General & Industrial Electrician',
      'Motorcycle Mechanic',
      'UPS & Solar PV Technician',
      'Mobile Phone Repairing',
      'Advance Welding',
      'Machinist / Turner',
      'English Language & Communication Skills'
    ];
    var pi = 0, ci = 0, deleting = false;

    function type() {
      var phrase = phrases[pi];
      if (deleting) {
        el.textContent = phrase.substring(0, --ci) || '\u00A0';
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(type, 500); return; }
        setTimeout(type, 40);
      } else {
        el.textContent = phrase.substring(0, ++ci);
        if (ci === phrase.length) { deleting = true; setTimeout(type, 1800); return; }
        setTimeout(type, 70);
      }
    }
    type();
  }

  /* ══════════════════════════════════════════════════════════
     9. COURSE FILTER (homepage)
  ══════════════════════════════════════════════════════════ */
  function initCourseFilter() {
    var tabs = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.course-card');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var filter = tab.dataset.filter;
        cards.forEach(function (card) {
          var cats = (card.dataset.category || '').split(' ');
          card.style.display = (filter === 'all' || cats.indexOf(filter) !== -1) ? '' : 'none';
        });
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     10. VIDEO PLAYER
  ══════════════════════════════════════════════════════════ */
  function initVideo() {
    var wrappers = document.querySelectorAll('.video-wrapper');
    if (!wrappers.length) return;

    wrappers.forEach(function (wrapper) {
      var video = wrapper.querySelector('video');
      if (!video) return;

      var playBtn = wrapper.querySelector('.v-btn.play');
      var muteBtn = wrapper.querySelector('.v-btn.mute');
      var volumeSlider = wrapper.querySelector('.v-volume-slider');
      var fullBtn = wrapper.querySelector('.v-btn.fullscreen');
      var time = wrapper.querySelector('.v-time');
      var progress = wrapper.querySelector('.v-progress');
      var fill = wrapper.querySelector('.v-progress-fill');

      function fmt(s) {
        if (!s || isNaN(s)) return '0:00';
        var m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return m + ':' + (sec < 10 ? '0' : '') + sec;
      }

      video.addEventListener('loadedmetadata', function() {
        if (time) time.textContent = '0:00 / ' + fmt(video.duration);
        wrapper.classList.remove('loading');
      });

      if (playBtn) {
        playBtn.addEventListener('click', function () {
          if (video.paused) { video.play(); playBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
          else { video.pause(); playBtn.innerHTML = '<i class="fas fa-play"></i>'; }
        });
      }

      function updateMuteIcon() {
        if (!muteBtn) return;
        if (video.muted || video.volume === 0) {
          muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
          muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
      }

      if (volumeSlider) {
        volumeSlider.addEventListener('input', function (e) {
          video.volume = e.target.value;
          video.muted = video.volume == 0;
          updateMuteIcon();
        });
      }

      if (muteBtn) {
        muteBtn.addEventListener('click', function () {
          if (video.muted || video.volume === 0) {
            video.muted = false;
            if (video.volume === 0) {
              video.volume = 1;
              if (volumeSlider) volumeSlider.value = 1;
            }
          } else {
            video.muted = true;
            if (volumeSlider) volumeSlider.value = 0;
          }
          updateMuteIcon();
        });
      }

      if (fullBtn) {
        fullBtn.addEventListener('click', function () {
          if (!document.fullscreenElement) {
            if (wrapper.requestFullscreen) wrapper.requestFullscreen();
            else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
            else if (wrapper.msRequestFullscreen) wrapper.msRequestFullscreen();
            fullBtn.innerHTML = '<i class="fas fa-compress"></i>';
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
            fullBtn.innerHTML = '<i class="fas fa-expand"></i>';
          }
        });

        document.addEventListener('fullscreenchange', function () {
          if (!document.fullscreenElement) fullBtn.innerHTML = '<i class="fas fa-expand"></i>';
          else fullBtn.innerHTML = '<i class="fas fa-compress"></i>';
        });
      }

      video.addEventListener('timeupdate', function () {
        if (time) time.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
        if (fill && video.duration) fill.style.width = (video.currentTime / video.duration * 100) + '%';
        if (progress) progress.setAttribute('aria-valuenow', Math.floor(video.currentTime / video.duration * 100) || 0);
      });

      if (progress) {
        progress.addEventListener('click', function (e) {
          var rect = progress.getBoundingClientRect();
          var pct = (e.clientX - rect.left) / rect.width;
          if (video.duration) video.currentTime = pct * video.duration;
        });
      }

      video.addEventListener('play', function() {
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      });
      video.addEventListener('pause', function() {
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
      });

      video.addEventListener('volumechange', updateMuteIcon);

      // Initial sync for autoplay/muted states
      updateMuteIcon();
      if (volumeSlider) volumeSlider.value = video.muted ? 0 : video.volume;
      if (!video.paused && playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';

      // If already loaded or no preload="none", remove loading class
      if (video.readyState >= 1) {
        if (time) time.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
        wrapper.classList.remove('loading');
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     11. PRELOADER
  ══════════════════════════════════════════════════════════ */
  function initPreloader() {
    if (document.getElementById('sostti-preloader')) return;
    var loader = document.createElement('div');
    loader.className = 'sostti-preloader';
    loader.id = 'sostti-preloader';
    loader.innerHTML = [
      '<img class="preloader-logo" src="' + prefix + 'images/sos-logo.webp" alt="SOSTTI Logo">',
      '<div class="preloader-spin"></div>'
    ].join('');
    document.body.appendChild(loader);

    // Safety timeout to hide if components take too long
    setTimeout(hidePreloader, 4000);
  }

  function hidePreloader() {
    var loader = document.getElementById('sostti-preloader');
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
      setTimeout(function () { loader.remove(); }, 600);
    }
  }


  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  // Apply theme immediately to prevent flash
  (function () {
    var saved = localStorage.getItem('sostti-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();

  function onReady() {
    initPreloader();

    loadHTML('#header-container', prefix + 'components/header.html', prefix, function () {
      initTheme();
      initFloatBtns();
      initChat();
      initCertModal();
      initReveal();
      initTyping();
      initCourseFilter();
      initVideo();
      // Fire event so ticker + nested dropdown inits can run
      // (mobile nav, ticker, and nested dropdowns are all initialized
      //  by their own IIFEs listening to this event below)
      document.dispatchEvent(new CustomEvent('sostti:headerLoaded'));

      // ── Header scroll effect ────────────────────────────────
      var hdr = document.getElementById('site-header');
      if (hdr) {
        window.addEventListener('scroll', function () {
          hdr.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
      }

      // ── Active nav link highlighting ────────────────────────
      var currentPath = window.location.pathname;
      document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        // Check if link matches current page (handling relative prefix)
        if (href) {
          var normalizedHref = href;
          if (prefix && href.indexOf(prefix) === 0) {
            normalizedHref = href.substring(prefix.length);
          }
          if (normalizedHref && currentPath.endsWith(normalizedHref)) {
            a.classList.add('active');
          } else if ((normalizedHref === '' || normalizedHref === '/') && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
            a.classList.add('active');
          }

          // ── Parent Dropdown Handling ────────────────────────
          if (a.classList.contains('active')) {
            var dropdown = a.closest('.dropdown');
            if (dropdown) {
              var trigger = dropdown.querySelector('a[role="button"]');
              if (trigger) trigger.classList.add('active');
            }
            // Handle nested items (like Computer/Technical courses)
            var nested = a.closest('.nested-dropdown-content');
            if (nested) {
              var nestedTrigger = nested.previousElementSibling;
              if (nestedTrigger) nestedTrigger.classList.add('active');
            }
          }
        }
      });
      // ── Hide preloader ──
      setTimeout(hidePreloader, 350);
    });
    loadHTML('#footer-container', prefix + 'components/footer.html', prefix);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();

/* ══════════════════════════════════════════════════════════
   ADMISSION TICKER
══════════════════════════════════════════════════════════ */
(function () {
  function initTicker() {
    var ticker = document.getElementById('admissionTicker');
    var closeBtn = document.getElementById('tickerClose');
    if (!ticker) return;

    /* Measure actual header height and set CSS var + body padding */
    function setOffset() {
      var hdr = document.getElementById('site-header');
      var h = hdr ? hdr.offsetHeight : 70;
      document.documentElement.style.setProperty('--nav-offset', h + 'px');
      document.body.style.paddingTop = h + 'px';
    }
    setOffset();
    window.addEventListener('resize', setOffset, { passive: true });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        ticker.classList.add('ticker-hidden');
        /* Recalculate offset after ticker removed */
        setTimeout(setOffset, 50);
      });
    }
  }

  document.addEventListener('sostti:headerLoaded', initTicker);
  if (document.readyState !== 'loading') setTimeout(initTicker, 200);
})();

/* ══════════════════════════════════════════════════════════
   MOBILE NAV — hamburger + top-level dropdowns
══════════════════════════════════════════════════════════ */
(function () {
  function initMobileNav() {
    var menuBtn = document.getElementById('mobile-menu-btn');
    var navLinks = document.getElementById('nav-links');
    var overlay = document.getElementById('nav-overlay');
    if (!menuBtn || !navLinks) return;

    /* ── Hamburger toggle ── */
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = navLinks.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuBtn.innerHTML = isOpen
        ? '<i class="fas fa-times" aria-hidden="true"></i>'
        : '<i class="fas fa-bars"  aria-hidden="true"></i>';
    });

    /* ── Top-level dropdown toggles (mobile only) ── */
    document.querySelectorAll('.nav-links .dropdown > a[role="button"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.innerWidth > 1024) return; // desktop: CSS hover handles it
        e.preventDefault();
        e.stopPropagation();
        var li = a.closest('.dropdown');
        var wasOpen = li.classList.contains('open');
        /* Close all other top-level dropdowns */
        document.querySelectorAll('.nav-links .dropdown.open').forEach(function (d) {
          d.classList.remove('open');
          var chevron = d.querySelector('.fa-chevron-down');
          if (chevron) chevron.style.transform = '';
        });
        if (!wasOpen) {
          li.classList.add('open');
          var chevron = li.querySelector('.fa-chevron-down');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      });
    });

    /* ── Close nav when a real link is tapped ── */
    navLinks.querySelectorAll('a[href]').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
      });
    });

    /* ── Close nav on overlay/outside tap ── */
    function closeNav() {
      navLinks.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
    }

    if (overlay) overlay.addEventListener('click', closeNav);
    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
        closeNav();
      }
    });
  }

  document.addEventListener('sostti:headerLoaded', initMobileNav);
})();

/* ══════════════════════════════════════════════════════════
   MOBILE NESTED DROPDOWN FIX
══════════════════════════════════════════════════════════ */
(function () {
  function initNestedMobile() {
    document.querySelectorAll('.nav-links .nested-dropdown > a[role="button"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          e.stopPropagation();
          var nd = a.closest('.nested-dropdown');
          var wasOpen = nd.classList.contains('open');
          document.querySelectorAll('.nested-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
          if (!wasOpen) nd.classList.add('open');
        }
      });
    });
  }
  document.addEventListener('sostti:headerLoaded', initNestedMobile);
  if (document.readyState !== 'loading') setTimeout(initNestedMobile, 200);
})();

/* ══════════════════════════════════════════════════════════
   MOBILE NAV PANEL — keep its top in sync with header height
══════════════════════════════════════════════════════════ */
(function () {
  function syncNavTop() {
    if (window.innerWidth > 1024) return;
    var hdr = document.getElementById('site-header');
    var nav = document.getElementById('nav-links');
    if (!hdr || !nav) return;
    nav.style.top = hdr.offsetHeight + 'px';
  }

  document.addEventListener('sostti:headerLoaded', function () {
    syncNavTop();
    window.addEventListener('resize', syncNavTop, { passive: true });
    /* Also update when ticker is closed */
    var closeBtn = document.getElementById('tickerClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { setTimeout(syncNavTop, 60); });
  });
})();
