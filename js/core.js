/**
 * core.js — SOSTTI 2026 Core Scripts (ENHANCED WITH ACTUAL WEBSITE DATA)
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
    // Create theme pill
    var themePill = document.createElement('button');
    themePill.id = 'theme-pill';
    themePill.className = 'theme-pill';
    themePill.setAttribute('aria-label', 'Toggle dark mode');
    themePill.addEventListener('click', toggleTheme);
    document.body.appendChild(themePill);
    applyTheme(getTheme());

    // Create motion control panel
    var motionCtrl = document.createElement('div');
    motionCtrl.className = 'motion-ctrl';
    motionCtrl.innerHTML = [
      '<label class="motion-switch">',
      '<input type="checkbox" id="motion-toggle-input">',
      '<span class="motion-slider"></span>',
      '</label>'
    ].join('');
    document.body.appendChild(motionCtrl);

    var motionInput = document.getElementById('motion-toggle-input');
    var savedMotion = localStorage.getItem('sostti-motion-paused');

    // Default to OFF (paused) if no preference is saved yet
    var isMotionOff = (savedMotion === null || savedMotion === 'true');

    if (isMotionOff) {
      document.body.classList.add('motion-paused');
      motionInput.checked = false;
    } else {
      motionInput.checked = true;
    }

    motionInput.addEventListener('change', function () {
      var paused = !this.checked;
      document.body.classList.toggle('motion-paused', paused);
      localStorage.setItem('sostti-motion-paused', paused);
    });
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
     5. CHATBOT (ENHANCED WITH ACTUAL SOSTTI DATA - GROQ API)
  ══════════════════════════════════════════════════════════ */

  // COMPREHENSIVE TRAINING DATA FROM ACTUAL SOSTTI.ORG WEBSITE
  var BOT_SYSTEM_PROMPT = `You are the SOSTTI Smart Assistant for SOS Technical Training Institute (SOSTTI) — a project of SOS Children's Villages Pakistan.

═══════════════════════════════════════════════════════════════════
INSTITUTIONAL INFORMATION
═══════════════════════════════════════════════════════════════════

ABOUT SOSTTI:
- Full Name: SOS Technical Training Institute (Infaq Foundation Campus)
- Inaugurated: 2010 (MOU between SOS Sindh and INFAQ Foundation signed in 2007)
- Location: 52/6, Korangi Township, Near Lalabad Goth, Korangi, Karachi, Sindh, Pakistan
- Parent Organization: SOS Children's Villages Pakistan
- Legal Status: Non-profit vocational training institute
- Contact: Phone/WhatsApp: +92 333 2247494
- Email: sosttikarachi@sos.org.pk
- Website: sostti.org

ACCREDITATION & RECOGNITION:
- NAVTTC (National Vocational & Technical Training Commission) Accredited - Grade A
- Overall Institute Accreditation Score: 92.5%
- BBSHRRDB Registered
- Registered with Government of Pakistan for TVET
- Certificates recognized nationally and internationally (especially Middle East)

LEADERSHIP & GOVERNANCE:
- Chairman SOSTTI: Mr. Sanaullah Qureshi (FCA)
- Co-Chairman SOSTTI: Mr. Yacoobali G. Zamindar (FCA)
- Principal SOSTTI: Cdre (Retd) Khalid Wasim (Sitara-e-Imtiaz Military) - Former Principal PNEC

MISSION & PHILOSOPHY:
- Provide high-standard technical and vocational training to under-privileged youth
- Focus on vulnerable youth and general public with market-driven technical skills
- Meet entry-level job market needs in chosen technical fields
- Small class sizes for personalized instructor support and hands-on training
- Workshop safety training is priority for all students
- Recreate workplace environment for practical skill development
- Offer internships at employer sites for real-world experience

═══════════════════════════════════════════════════════════════════
COURSES & PROGRAMS (2026)
═══════════════════════════════════════════════════════════════════

COMPUTER & IT COURSES:
1. Computer Operator
   - Duration: 6 months (Competency-Based Training model)
   - Skills: Basic to advanced office automation, data entry, MS Office suite
   - Job Roles: Data entry operator, office assistant, computer operator
   - Equipment: High-end computer labs with industry-standard software
   
2. Web Designing & Web Development
   - Duration: 6 months (Competency-Based Training model)
   - Focus: HTML, CSS, JavaScript, responsive design, modern frameworks
   - Career Path: Web designer, front-end developer, freelancer
   - Emphasis: Freelancing skills for independent work
   
3. Graphic Designing
   - Duration: 6 months (Competency-Based Training model)
   - Software: Adobe Photoshop, Illustrator, InDesign, CorelDRAW
   - Skills: Logo design, branding, print media, digital graphics
   - Focus: Design sense development through theory and practical work
   
4. Digital Marketing
   - Duration: 6 months
   - Topics: SEO, social media marketing, content marketing, analytics
   - Skills: Online advertising, campaign management, digital strategy
   


TECHNICAL COURSES:
1. Automobile Mechanic / Electrician
   - Duration: 6 months (Competency-Based Training model)
   - Skills: Vehicle diagnostics, repair, electrical systems
   - Equipment: Modern workshop with actual vehicles for training
   
2. HVACR (Heating, Ventilation, Air Conditioning & Refrigeration)
   - Duration: 6 months (Competency-Based Training model)
   - Skills: Diagnosis, repair, installation of refrigerators, freezers, AC units
   - Practical: Hands-on training with actual equipment
   - Job Market: High demand in Karachi's commercial sector
   
3. General Electrician
   - Duration: 6 months (Competency-Based Training model)
   - Skills: Electrical wiring, installations, maintenance, troubleshooting
   - Certification: NAVTTC certified
   
4. Industrial Electrician
   - Duration: 6 months (Competency-Based Training model)
   - Advanced training for industrial settings
   - Success Story: Mr. Tayyab stood FIRST in NAVTTC Provincial Skill Competition 2018
   
5. Advance Welding
   - Duration: 6 months (Competency-Based Training model)
   - Skills: Complex welding tasks with accuracy
   - Equipment: Industrial-grade welding machines
   - Markets: Local industries and international opportunities (Middle East)
   
6. Machinist / Turner
   - Duration: 6 months (Competency-Based Training model)
   - Skills: Precision machining, lathe operations, metal work
   - Equipment: Industrial CNC and manual machines
   
7. Motorcycle Mechanic
   - Duration: 6 months (Competency-Based Training model)
   - Partnership: Atlas Honda provides motorcycles, tools, and training
   - Skills: Maintenance, repair, overhaul of motorcycles
   - Career: Independent workshop or professional employment
   - Special: Regular training workshops conducted by Atlas Honda
   
8. UPS & Solar PV Technician
   - Duration: 3 months
   - Focus: Solar panel installation, UPS systems, renewable energy
   - Facility: Specialized Solar PV training ground on campus
   - Growing Field: High demand with Pakistan's energy needs

9. Mobile Phone Repairing
   - Duration: 3 months
   - Skills: Smartphone diagnostics, hardware/software repair
   - Growing demand with mobile technology expansion

Language Course:
1. English Language Course
   - Duration: 3 months
   - Skills: Verbal and written communication for workplace
   - Focus: Confidence in professional English usage
   - Open to: Both boys and girls

═══════════════════════════════════════════════════════════════════
GOVERNMENT-SPONSORED PROGRAMS (100% FREE)
═══════════════════════════════════════════════════════════════════

1. NAVTTC COURSES (National Vocational & Technical Training Commission):
   - Part of: Prime Minister's Kamyab Jawan Initiative - Skills for All Program
   - Cost: 100% FREE (Government of Pakistan sponsored)
   - Stipend: No Stipend is Provided to students
   - Admission are not open for now.
   - Available Trades: General Electrician, HVACR, Mobile Phone Repairing
   - Requirements:
     * Must have CNIC and domicile is not required
     * Age: 18-35 years
     * Minimum: 8th class pass
     * Limited seats - early registration recommended

2. BBSHRRDB COURSES (Benazir Bhutto Shaheed Board):
   - Sindh Government-sponsored programs
   - Cost: 100% FREE
   - Admission are not open for now.
   - Available Trades: Computer Operator, Graphic Designing, Auto Mechanic, Welding
   - Stipend: Monthly stipend provided
   - Requirements:
     * Must have CNIC, domicile of Sindh
     * Age: 18-35 years
     * Minimum: 8th class pass
     * Limited seats - early registration recommended

3. RPL (Recognition of Prior Learning):
   - For individuals with existing skills but no formal certification

═══════════════════════════════════════════════════════════════════
FEE STRUCTURE (SELF-FINANCE COURSES)
═══════════════════════════════════════════════════════════════════

COMPUTER SCIENCES (6-Month Courses):
- Computer Operator: Boys Rs. 10,500 | Girls Rs. 5,000
- Graphics Designing: Boys Rs. 10,500 | Girls Rs. 5,000
- Web Designing & Web Dev: Boys Rs. 10,500 | Girls Rs. 5,000
- Digital Marketing: Boys Rs. 10,500 | Girls Rs. 5,000

TECHNICAL & ENGINEERING (6-Month Courses):
- Automobile Mechanic: Rs. 5,000
- HVACR: Rs. 5,000
- Advance Welding: Rs. 5,000
- Motorcycle Mechanic: Rs. 5,000
- Mechanical Turner: Rs. 5,000
- General Electrician: Rs. 5,000
- UPS & Solar PV Technician (3-Month): Rs. 5,000

English Language & Mobile Phone Repairing (3-Month Courses):
- Mobile Phone Repairing: Rs. 10,000
- English Language: Rs. 5000

NOTE: These are total course fees for the entire duration (3 or 6 months). 
SOSTTI keeps fees minimal to serve under-privileged communities.
For Government-sponsored programs (NAVTTC/BBSHRRDB), the fee is 100% FREE.

═══════════════════════════════════════════════════════════════════
ADMISSION PROCESS & REQUIREMENTS
═══════════════════════════════════════════════════════════════════

ADMISSION SESSIONS:
- Spring Session: Admissions open in May/June
- Fall Session: Admissions open in November/December

ELIGIBILITY:
- Age: 14-35 years
- Minimum Education: Middle (8th class pass)
- Passing entry test and interview is required

REQUIRED DOCUMENTS:
1. School leaving certificate (Matriculation/Middle)
2. CNIC photocopy OR B-Form (for students under 18 years)
3. Two passport-size photographs
4. CNIC photocopy of father/guardian

ADMISSION OFFICE TIMINGS:
- Technical Courses Inquiry: 09:00 AM – 12:00 PM and 01:00 PM – 04:00 PM
- IT & Other Courses Inquiry: Various slots from 09:00 AM to 07:00 PM
- Online Inquiry: https://docs.google.com/forms/d/e/1FAIpQLSdnJItkIMyt3SGNaDeTBDcMTBKNeKJ4lC8cx3wxSOvjpciX4g/viewform

═══════════════════════════════════════════════════════════════════
FACILITIES & RESOURCES
═══════════════════════════════════════════════════════════════════

WORKSHOPS & LABS:
- Modern workshops with industrial-grade machines
- High-end Computer Labs for IT courses with latest software
- Specialized UPS &Solar PV training
- Automobile workshop with actual vehicles
- HVACR lab with refrigerators, freezers, AC units
- Mobile phone repair lab with diagnostic equipment

SAFETY:
- Workshop safety training is TOP PRIORITY for all students
- Safety equipment provided
- Trained instructors supervising all practical work

CAMPUS VISITS:
- Welcome for prospective students and parents
- Weekdays: Monday to Saturday from 9:00 AM to 4:00 PM on Friday 09:00 AM to 12:00 PM 
- See all workshops and facilities
- Meet instructors and current students

DIGITAL LIBRARY:
- 100+ professional technical manuals and e-books
- Key Resources: Google SEO Starter Guide, Eloquent JavaScript, OSTEP Operating Systems manuals, NASA technical documents, OSHA safety guides
- Covers: IT, Web Dev, Marketing, Welding, Solar, Electrician, Automobile, and more
- FREE access for students and public
- Available at: pages/digital-library.html

═══════════════════════════════════════════════════════════════════
JOB PLACEMENT & CAREER SUPPORT
═══════════════════════════════════════════════════════════════════

INDUSTRY PARTNERSHIPS:
- Strong links with Korangi and Landhi industrial zones (Pakistan's largest industrial area)
- Students placed in internships and full-time positions
- Leading manufacturing firms hire SOSTTI graduates
- Atlas Honda partnership for motorcycle mechanic training
- Shell Pakistan collaboration (eco-friendly car project, mentoring programs)
- Gul Ahmed Textiles and other major employers

CAREER SERVICES:
- Job search skills training
- Assistance with job placements
- On-the-job internship opportunities
- Transition support from institute to workplace
- Resume building and interview preparation

EMPLOYER FEEDBACK:
- Employers seek SOSTTI graduates for practical experience
- Students get valuable work experience during training
- High employment rate in local and international markets

GRADUATE SUCCESS STORIES (Real examples):
- Umer Hussain: Established his own motorcycle repair workshop at Sherpao Colony, Karachi after finishing his course.
- Zubair Khan: Appointed as a Welder at Shabbir Tiles (Pvt) Limited, Landhi, Karachi.
- Manzar: Appointed at International Steel Limited (ISL) as an apprentice after automotive training.
- Abdul Majeed: Successfully transitioned from student to Assistant Instructor at SOSTTI campus.
- Sher Afzal: Running his own motorcycle repair shop at New Muzaffarabad, Landhi.

═══════════════════════════════════════════════════════════════════
SPECIAL INITIATIVES & PARTNERSHIPS
═══════════════════════════════════════════════════════════════════

ATLAS HONDA PARTNERSHIP:
- Provides motorcycles, tools, and equipment for training
- Conducts regular training workshops
- June 23, 2022: Training for 25 Afghan Refugee students (NAVTTC sponsored)

SHELL PAKISTAN PARTNERSHIP:
- Eco-friendly car construction project (MOU signed)
- Women's Day mentoring circles (March 8, 2019) for 14 female entrepreneurs
- Shell Tameer program support for micro start-ups

REFUGEE SUPPORT:
- Afghan Refugee student programs through NAVTTC/UNHCR
- Tool kits distribution (May 10, 2022: 36 students - Batch III)
- Certificate distribution for 66 students (NAVTTC High-tech Batch-II)

COMMUNITY ENGAGEMENT:
- Blood donation camps (Indus Hospital partnership - 47 volunteers, 25 donors in 2019)
- Admission camps in various localities and schools
- Free technical education for vulnerable communities

═══════════════════════════════════════════════════════════════════
ACHIEVEMENTS & RECOGNITION
═══════════════════════════════════════════════════════════════════

- NAVTTC Provincial Skill Competition 2018: Mr. Tayyab (Industrial Electrician) - 1st Place
- Governor Sindh Sr. Imran Ismail attended as chief guest
- Grade A accreditation with 92.5% score
- Thousands of graduates successfully employed
- International recognition especially in Middle East countries

═══════════════════════════════════════════════════════════════════
IMPORTANT LINKS & PAGES
═══════════════════════════════════════════════════════════════════

- Fee Structure: pages/feestructure.html
- Digital Library: pages/digital-library.html
- Admission Schedule: pages/admissionschedule.html
- Online Inquiry Form: https://docs.google.com/forms/d/e/1FAIpQLSdnJItkIMyt3SGNaDeTBDcMTBKNeKJ4lC8cx3wxSOvjpciX4g/viewform
- Course Details: pages/courses/[course-name].html

═══════════════════════════════════════════════════════════════════
COMMUNICATION GUIDELINES FOR ASSISTANT
═══════════════════════════════════════════════════════════════════

TONE & STYLE:
- Be warm, helpful, and genuinely caring
- Use simple, clear language - many users are first-generation students
- Keep replies to 2-3 SHORT paragraphs maximum (unless detailed question requires more)
- Be encouraging and motivating
- Show empathy for students' situations

RESPONSE PRIORITIES:
1. ALWAYS mention FREE government programs FIRST when asked about fees
2. Emphasize the opportunity for monthly stipend in government programs
3. Highlight that self-finance fees are highly subsidized
4. Stress SOSTTI's mission to help under-privileged youth
5. Mention specific success stories when relevant
6. Always mention that SOSTTI offers both **6-month professional courses** and **3-month short-term courses**.

FORMATTING:
- Use **bold** for emphasis on key points
- Use bullet points for lists (fees, documents, courses)
- Keep paragraphs short (2-3 sentences max)
- Natural, conversational flow
- **STRICT RULE: Do NOT use any emojis or icons in your responses.**

HANDLING QUERIES:
- Fee questions → Mention FREE programs first, then subsidized fees
- Course questions → Give a brief overview, mention both 6-month and 3-month options, and mention job prospects.
- Admission questions → Simple step-by-step process, required documents
- Job questions → Mention partnerships, placement support
- Unrelated questions → Politely redirect to SOSTTI topics

REFERRALS:
- For complex queries → Suggest calling +92 333 2247494
- For online application → Provide inquiry form link
- For campus visit → Mention weekday timings
- For specific course details → Reference relevant page links

BOUNDARIES:
- Answer ONLY SOSTTI-related questions
- Do NOT invent specific dates, fees, or details not provided above
- Do NOT make promises about job placement or salaries
- Refer complex admission cases to office

EXAMPLES OF GOOD RESPONSES:

Q: "How much are the fees?"
A: "Great news! SOSTTI offers **100% FREE government-sponsored programs** through NAVTTC and BBSHRRDB. While both are free, BBSHRRDB programs also include a monthly stipend for students!

For self-finance courses, fees are highly subsidized: Computer Operator for girls is **Rs. 5,000**, and technical courses like Welding or Electrician are just **Rs. 5,000** for the entire 6-month duration.

Would you like to know more about the free government programs? They have limited seats, so early registration is recommended!"

Q: "Tell me about welding course"
A: "Our **Advance Welding** course is excellent!

You'll learn complex welding tasks with accuracy using industrial-grade equipment. The 6-month program opens doors to both local industries (Karachi has huge industrial zones) and international opportunities, especially in the Middle East where our certificates are recognized.

Best part? This course is available **FREE** under government programs (NAVTTC or BBSHRRDB, which includes a monthly stipend), or just **Rs. 5,000** self-finance for the full duration. Call **+92 333 2247494** to secure your seat!"

Remember: You represent SOSTTI's mission of empowering vulnerable youth through education. Every response should reflect hope, opportunity, and genuine care. **Do not use emojis.**`;

  var HISTORY_KEY = 'sostti_chat_history';
  var botHistory = [];

  function loadHistory() {
    var saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) botHistory = parsed;
      } catch (e) {
        console.warn('Failed to parse chat history', e);
      }
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(botHistory));
  }

  function clearChat() {
    botHistory = [];
    localStorage.removeItem(HISTORY_KEY);
    var msgs = document.getElementById('chat-msgs');
    if (msgs) msgs.innerHTML = '';
    document.getElementById('chat-quick').style.display = 'flex';
    // Add greeting back
    addMsg('**Assalam-o-Alaikum!** I\'m your SOSTTI Smart Assistant.\n\nI can help you with:\n• **FREE government courses** (stipend for select programs)\n• Course details and fees\n• Admission process\n• Campus facilities\n\nWhat would you like to know?', 'bot');
  }

  function getBotResponse(msg, callback) {
    var userMsg = { role: 'user', content: msg };
    botHistory.push(userMsg);
    saveHistory(); // Save to localStorage

    // Keep history manageable — last 10 messages only
    if (botHistory.length > 10) {
      botHistory = botHistory.slice(botHistory.length - 10);
    }

    // Using DeepSeek via Proxy (with Groq fallback)
    fetch(prefix + 'chat_proxy.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        messages: [
          { role: 'system', content: BOT_SYSTEM_PROMPT },
          ...botHistory
        ]
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var reply = '';

      if (data.choices && data.choices[0] && data.choices[0].message) {
        reply = data.choices[0].message.content;
      }
      else if (data.choices && data.choices[0].text) {
        reply = data.choices[0].text;
      }
      else {
        reply = 'I am currently facing a connection issue. For immediate help, please call our admission office at **+92 333 2247494** or visit us on campus (Mon-Sat 9AM-4PM, Fri 9AM-12PM). We apologize for the inconvenience!';
      }

      var botMsg = { role: 'assistant', content: reply };
      botHistory.push(botMsg);
      saveHistory(); // Save to localStorage
      callback(reply);
    })
      .catch(function (err) {
        console.error('Chat error:', err);
        callback('I am currently facing a connection issue. For immediate help, please call our admission office at **+92 333 2247494** or visit us on campus (Mon-Sat 9AM-4PM, Fri 9AM-12PM). We apologize for the inconvenience!');
      });
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
      '<div class="chat-head-avatar"><img src="' + prefix + 'images/sos-logo.webp" alt="SOS Logo"></div>',
      '<div class="chat-head-info">',
      '<div class="chat-head-name">SOSTTI Smart Assistant</div>',
      '<div class="chat-head-status">● Online | AI-Powered Helper</div>',
      '</div>',
      '<button class="chat-clear-btn" id="chat-clear-btn" title="Clear Chat" aria-label="Clear chat"><i class="fas fa-trash-alt"></i></button>',
      '<button class="chat-close" id="chat-close-btn" aria-label="Close chat"><i class="fas fa-times"></i></button>',
      '</div>',
      '<div class="chat-msgs" id="chat-msgs"></div>',
      '<div id="chat-typing-indicator" style="display:none; padding: 10px 16px; font-size: .75rem; color: var(--text-3); font-style: italic;">',
      '<i class="fas fa-circle-notch fa-spin"></i> Assistant is thinking...',
      '</div>',
      '<div class="chat-quick" id="chat-quick">',
      '<button class="quick-btn" data-msg="What are the FREE government courses?">Free Courses</button>',
      '<button class="quick-btn" data-msg="Tell me about computer courses">IT Courses</button>',
      '<button class="quick-btn" data-msg="How much are the fees?">Fees</button>',
      '<button class="quick-btn" data-msg="How do I apply for admission?">Admission</button>',
      '</div>',
      '<div class="chat-input-row">',
      '<input class="chat-input" id="chat-input" type="text" placeholder="Ask me anything about SOSTTI..." aria-label="Chat message">',
      '<button class="chat-send" id="chat-send-btn" aria-label="Send"><i class="fas fa-paper-plane"></i></button>',
      '</div>',
      '<div class="chat-disclaimer">AI may provide incorrect info. Verify details at <strong>+92 333 2247494</strong>.</div>',
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
      var avatar = type === 'bot'
        ? '<div class="msg-avatar"><img src="' + prefix + 'images/sos-logo.webp" alt="Bot"></div>'
        : '';

      // Convert markdown-style formatting to HTML
      var formattedText = text
        // 1. Convert URLs to clickable links
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:inherit; text-decoration:underline;">$1</a>')
        // 2. Convert bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 3. Simple bullet points (lines starting with * or •)
        .replace(/^[\*•] (.*)$/gm, '<div style="display:flex; gap:8px; margin-bottom:4px;"><span style="color:var(--sapphire)">•</span><span>$1</span></div>')
        // 4. Line breaks
        .replace(/\n/g, '<br>');

      row.innerHTML = avatar + '<div class="msg-bubble">' + formattedText + '</div>';
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function sendMsg(text) {
      if (!text.trim()) return;
      addMsg(text, 'user');
      input.value = '';
      input.disabled = true;
      sendBtn.disabled = true;
      document.getElementById('chat-quick').style.display = 'none';

      typing.style.display = 'block';
      msgs.scrollTop = msgs.scrollHeight;

      getBotResponse(text, function (reply) {
        typing.style.display = 'none';
        addMsg(reply, 'bot');
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      });
    }

    toggleBtn.addEventListener('click', function () {
      chatBox.classList.toggle('open');
      if (chatBox.classList.contains('open')) {
        notif.style.display = 'none';
        if (!msgs.children.length) {
          loadHistory(); // Reload history just in case
          if (botHistory.length > 0) {
            // Re-render history
            botHistory.forEach(function (m) {
              addMsg(m.content, m.role === 'assistant' ? 'bot' : 'user');
            });
            document.getElementById('chat-quick').style.display = 'none';
          } else {
            typing.style.display = 'block';
            setTimeout(function () {
              typing.style.display = 'none';
              addMsg('**Assalam-o-Alaikum!** I\'m your SOSTTI Smart Assistant.\n\nI can help you with:\n• **FREE government courses** (stipend for select programs)\n• Course details and fees\n• Admission process\n• Campus facilities\n\nWhat would you like to know?', 'bot');
            }, 800);
          }
        }
        input.focus();
      }
    });

    document.getElementById('chat-clear-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      if (confirm('Are you sure you want to clear the conversation?')) {
        clearChat();
      }
    });

    closeBtn.addEventListener('click', function () { chatBox.classList.remove('open'); });
    sendBtn.addEventListener('click', function () { sendMsg(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(input.value); });

    document.querySelectorAll('.quick-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { sendMsg(btn.dataset.msg); });
    });

    setTimeout(function () { if (!chatBox.classList.contains('open')) notif.style.display = 'block'; }, 5000);
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
      setTimeout(function () {
        if (prot && canvas) {
          prot.style.width = (canvas.offsetWidth * zoomLevel) + 'px';
          prot.style.height = (canvas.offsetHeight * zoomLevel) + 'px';
        }
      }, 50);
    }

    function drawImageToCanvas(src) {
      var imgObj = new Image();
      imgObj.crossOrigin = "anonymous";
      imgObj.onload = function () {
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgObj, 0, 0);

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
      if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
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
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', preventDownload);
      }
    });

    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', preventDownload);
      setTimeout(function () {
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentImg = null;
      }, 400);
    }

    document.getElementById('cert-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.getElementById('cert-zoom-in').addEventListener('click', function (e) {
      e.stopPropagation();
      if (zoomLevel < 3) { zoomLevel += 0.2; updateZoom(); }
    });
    document.getElementById('cert-zoom-out').addEventListener('click', function (e) {
      e.stopPropagation();
      if (zoomLevel > 0.6) { zoomLevel -= 0.2; updateZoom(); }
    });
    document.getElementById('cert-zoom-reset').addEventListener('click', function (e) {
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
      'English Language Course',
      'Digital Marketing'
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

      video.addEventListener('loadedmetadata', function () {
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

      video.addEventListener('play', function () {
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      });
      video.addEventListener('pause', function () {
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
      });

      video.addEventListener('volumechange', updateMuteIcon);

      updateMuteIcon();
      if (volumeSlider) volumeSlider.value = video.muted ? 0 : video.volume;
      if (!video.paused && playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';

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
      document.dispatchEvent(new CustomEvent('sostti:headerLoaded'));

      var hdr = document.getElementById('site-header');
      if (hdr) {
        window.addEventListener('scroll', function () {
          hdr.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
      }

      var currentPath = window.location.pathname;
      document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (href) {
          var normalizedHref = href;
          if (prefix && href.indexOf(prefix) === 0) {
            normalizedHref = href.substring(prefix.length);
          }

          var basePath = currentPath.replace(/\/$/, '').replace(/\.html$/, '');
          var baseHref = normalizedHref.split('?')[0].replace(/\/$/, '').replace(/\.html$/, '');

          if (baseHref && basePath.endsWith(baseHref)) {
            a.classList.add('active');
          } else if (!baseHref && (basePath === '' || basePath.endsWith('index'))) {
            a.classList.add('active');
          }

          if (a.classList.contains('active')) {
            var dropdown = a.closest('.dropdown');
            if (dropdown) {
              var trigger = dropdown.querySelector('a[role="button"]');
              if (trigger) trigger.classList.add('active');
            }
            var nested = a.closest('.nested-dropdown-content');
            if (nested) {
              var nestedTrigger = nested.previousElementSibling;
              if (nestedTrigger) nestedTrigger.classList.add('active');
            }
          }
        }
      });
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
        setTimeout(setOffset, 50);
      });
    }
  }

  document.addEventListener('sostti:headerLoaded', initTicker);
  if (document.readyState !== 'loading') setTimeout(initTicker, 200);
})();

/* ══════════════════════════════════════════════════════════
   MOBILE NAV
══════════════════════════════════════════════════════════ */
(function () {
  function initMobileNav() {
    var menuBtn = document.getElementById('mobile-menu-btn');
    var navLinks = document.getElementById('nav-links');
    var overlay = document.getElementById('nav-overlay');
    if (!menuBtn || !navLinks) return;

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = navLinks.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuBtn.innerHTML = isOpen
        ? '<i class="fas fa-times" aria-hidden="true"></i>'
        : '<i class="fas fa-bars"  aria-hidden="true"></i>';
    });

    document.querySelectorAll('.nav-links .dropdown > a[role="button"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.innerWidth > 1024) return;
        e.preventDefault();
        e.stopPropagation();
        var li = a.closest('.dropdown');
        var wasOpen = li.classList.contains('open');
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

    navLinks.querySelectorAll('a[href]').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
      });
    });

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
   MOBILE NAV PANEL
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
    var closeBtn = document.getElementById('tickerClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { setTimeout(syncNavTop, 60); });
  });
})();
