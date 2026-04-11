/**
 * announcement-manager.js — SOSTTI Ad Popup Carousel
 * Shows admission ad images in a popup after page load.
 * To add/remove ads: edit the this.ads array below.
 * Supports: multi-image carousel, swipe on mobile, keyboard nav.
 */
(function () {
    'use strict';

    var ImageAdCarousel = (function () {
        function ImageAdCarousel() {
            this.ads = [];

            /* Auto-detect page depth based on path markers */
            var path = window.location.pathname;
            this.prefix = '';
            if (path.indexOf('/pages/courses/') !== -1) {
                this.prefix = '../../';
            } else if (path.indexOf('/pages/') !== -1) {
                this.prefix = '../';
            }

            this.applyLink = 'https://docs.google.com/forms/d/e/1FAIpQLSdnJItkIMyt3SGNaDeTBDcMTBKNeKJ4lC8cx3wxSOvjpciX4g/viewform?usp=header';
            this.delay = 1200; /* ms before popup appears */
            this.current = 0;
            this.init();
        }

        ImageAdCarousel.prototype.init = function () {
            if (document.getElementById('ad-carousel-overlay')) return;
            var self = this;

            /* Try to fetch fresh ads from PHP helper */
            fetch(this.prefix + 'get_ads.php')
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data && data.length > 0) {
                        // Use PHP data (prefixed)
                        self.ads = data.map(function (a) { return self.prefix + a; });
                    } else {
                        // Fallback to hardcoded prefixed list
                        self.ads = self.ads.map(function (a) { return self.prefix + a; });
                    }
                    self.start();
                })
                .catch(function () {
                    // Fallback if PHP fails
                    self.ads = self.ads.map(function (a) { return self.prefix + a; });
                    self.start();
                });
        };

        ImageAdCarousel.prototype.start = function () {
            if (this.ads.length === 0) return;
            
            this.createStyles();
            this.createHTML();
            this.bindEvents();
            this.preload();
            var self = this;
            setTimeout(function () { self.show(); }, this.delay);
        };

        ImageAdCarousel.prototype.createStyles = function () {
            var s = document.createElement('style');
            s.id = 'ad-carousel-styles';
            s.textContent = [
                '#ad-carousel-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;',
                'background:rgba(0,0,0,0.72);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);',
                'z-index:99999;justify-content:center;align-items:center;padding:16px;animation:adFadeIn .3s ease-out}',

                '#ad-carousel-popup{position:relative;width:100%;max-width:540px;border-radius:18px;',
                'overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.55);animation:adScaleIn .3s ease-out;background:#000}',

                '#ad-carousel-img{width:100%;height:auto;display:block;cursor:pointer;',
                'transition:opacity .25s ease;border-radius:18px 18px 0 0}',

                '#ad-carousel-img:hover{opacity:.93}',

                '.ad-cta-bar{display:flex;align-items:center;justify-content:center;',
                'background:linear-gradient(90deg,#0a5cbf,#1a7aff);color:#fff;',
                'font-size:.9rem;font-weight:700;padding:13px 20px;gap:8px;',
                'text-decoration:none;transition:background .2s;border-radius:0 0 18px 18px}',
                '.ad-cta-bar:hover{background:linear-gradient(90deg,#084fad,#1470ee);color:#fff}',

                '.ad-close-btn{position:absolute;top:10px;right:10px;width:34px;height:34px;',
                'background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:50%;',
                'font-size:18px;font-weight:bold;cursor:pointer;',
                'display:flex;align-items:center;justify-content:center;transition:all .2s;z-index:10}',
                '.ad-close-btn:hover{background:#000;transform:scale(1.1)}',

                '.ad-nav-btn{position:absolute;top:42%;transform:translateY(-50%);',
                'background:rgba(0,0,0,.55);color:#fff;border:none;',
                'width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer;',
                'display:flex;align-items:center;justify-content:center;transition:all .2s;z-index:10}',
                '.ad-nav-btn:hover{background:rgba(0,0,0,.9)}',
                '.ad-prev-btn{left:10px}.ad-next-btn{right:10px}',

                '.ad-dots-bar{position:absolute;bottom:52px;left:50%;transform:translateX(-50%);',
                'display:flex;gap:7px;z-index:10}',
                '.ad-dot-item{width:8px;height:8px;background:rgba(255,255,255,.45);',
                'border-radius:50%;cursor:pointer;transition:background .2s}',
                '.ad-dot-item.active{background:#fff}',

                '.ad-counter-lbl{position:absolute;top:10px;left:10px;',
                'background:rgba(0,0,0,.65);color:#fff;',
                'padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600;',
                'z-index:10;pointer-events:none}',

                '@keyframes adFadeIn{from{opacity:0}to{opacity:1}}',
                '@keyframes adScaleIn{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}',

                '@media(max-width:768px){#ad-carousel-popup{max-width:100%;border-radius:14px}',
                '#ad-carousel-img{border-radius:14px 14px 0 0}',
                '.ad-cta-bar{border-radius:0 0 14px 14px;font-size:.82rem;padding:11px 16px}',
                '.ad-close-btn{width:30px;height:30px;font-size:15px;top:7px;right:7px}',
                '.ad-nav-btn{width:33px;height:33px;font-size:19px}.ad-prev-btn{left:7px}.ad-next-btn{right:7px}}',

                '@media(max-width:400px){#ad-carousel-overlay{padding:10px}',
                '.ad-close-btn{width:27px;height:27px;font-size:13px}.ad-nav-btn{width:29px;height:29px}}'
            ].join('');
            document.head.appendChild(s);
        };

        ImageAdCarousel.prototype.createHTML = function () {
            var multi = this.ads.length > 1;
            var self = this;
            var dots = this.ads.map(function (_, i) {
                return '<div class="ad-dot-item' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '"></div>';
            }).join('');

            var html = [
                '<div id="ad-carousel-overlay" role="dialog" aria-modal="true" aria-label="Admission Advertisement">',
                '  <div id="ad-carousel-popup">',
                '    <button class="ad-close-btn" aria-label="Close">&#215;</button>',
                multi ? '<button class="ad-nav-btn ad-prev-btn" aria-label="Previous">&#8249;</button>' : '',
                multi ? '<button class="ad-nav-btn ad-next-btn" aria-label="Next">&#8250;</button>' : '',
                '    <img id="ad-carousel-img" fetchpriority="high" src="' + this.ads[0] + '" alt="Admission Advertisement">',
                multi ? '<div class="ad-dots-bar">' + dots + '</div>' : '',
                multi ? '<div class="ad-counter-lbl" id="ad-counter">1/' + this.ads.length + '</div>' : '',
                '    <a class="ad-cta-bar" id="adCtaLink" href="' + this.applyLink + '" target="_blank" rel="noopener">',
                '      <i class="fas fa-pen-to-square"></i> Apply Now ( Admissions Open )',
                '    </a>',
                '  </div>',
                '</div>'
            ].join('');
            document.body.insertAdjacentHTML('beforeend', html);
        };

        ImageAdCarousel.prototype.bindEvents = function () {
            var self = this;
            var overlay = document.getElementById('ad-carousel-overlay');
            var img = document.getElementById('ad-carousel-img');
            var closeBtn = overlay.querySelector('.ad-close-btn');
            var prevBtn = overlay.querySelector('.ad-prev-btn');
            var nextBtn = overlay.querySelector('.ad-next-btn');
            var dots = overlay.querySelectorAll('.ad-dot-item');
            var counter = document.getElementById('ad-counter');

            function close() {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                document.removeEventListener('keydown', keyHandler);
            }

            function go(dir) {
                self.current = (self.current + dir + self.ads.length) % self.ads.length;
                img.style.opacity = '0';
                setTimeout(function () {
                    img.src = self.ads[self.current];
                    img.style.opacity = '1';
                }, 200);
                dots.forEach(function (d, i) { d.classList.toggle('active', i === self.current); });
                if (counter) counter.textContent = (self.current + 1) + '/' + self.ads.length;
            }

            function keyHandler(e) {
                if (e.key === 'Escape') close();
                if (e.key === 'ArrowLeft') go(-1);
                if (e.key === 'ArrowRight') go(1);
            }

            /* Click image â€”> apply link */
            img.addEventListener('click', function () {
                window.open(self.applyLink, '_blank', 'noopener');
            });

            closeBtn.addEventListener('click', close);
            overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
            if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); });
            if (nextBtn) nextBtn.addEventListener('click', function () { go(1); });
            dots.forEach(function (d) {
                d.addEventListener('click', function () {
                    var idx = parseInt(d.getAttribute('data-idx'), 10);
                    go(idx - self.current);
                });
            });
            document.addEventListener('keydown', keyHandler);

            /* Touch swipe */
            var touchX = 0;
            overlay.addEventListener('touchstart', function (e) {
                touchX = e.touches[0].clientX;
            }, { passive: true });
            overlay.addEventListener('touchend', function (e) {
                var diff = touchX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 45) go(diff > 0 ? 1 : -1);
            }, { passive: true });
        };

        ImageAdCarousel.prototype.preload = function () {
            this.ads.forEach(function (src) { var img = new Image(); img.src = src; });
        };

        ImageAdCarousel.prototype.show = function () {
            var o = document.getElementById('ad-carousel-overlay');
            if (o) {
                o.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        };

        return ImageAdCarousel;
    })();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { new ImageAdCarousel(); });
    } else {
        new ImageAdCarousel();
    }
})();



