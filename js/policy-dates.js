/**
 * policy-dates.js — SOSTTI Auto Policy Review Date Engine
 * ─────────────────────────────────────────────────────────
 * Dynamically sets "Last Reviewed" and "Next Review" dates
 * based on the current year. No manual edits ever needed.
 *
 * Logic:
 *   Last Reviewed = January [current year]
 *   Next Review   = January [current year + 1]
 *
 * Targets elements with:
 *   id="policy-last-reviewed"
 *   id="policy-next-review"
 *   class="policy-last-reviewed"  (multiple)
 *   class="policy-next-review"    (multiple)
 */
(function () {
  'use strict';

  var MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  var now  = new Date();
  var year = now.getFullYear();

  // Always anchor to January for annual policy review cycle
  var lastReviewed = MONTHS[0] + ' ' + year;
  var nextReview   = MONTHS[0] + ' ' + (year + 1);

  function fill(selector, value) {
    var els = document.querySelectorAll(selector);
    els.forEach(function (el) { el.textContent = value; });
  }

  function init() {
    // ID-based targets
    fill('#policy-last-reviewed', lastReviewed);
    fill('#policy-next-review',   nextReview);

    // Class-based targets (for pages using multiple instances)
    fill('.policy-last-reviewed', lastReviewed);
    fill('.policy-next-review',   nextReview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
