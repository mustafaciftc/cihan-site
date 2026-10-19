/* modern.js — bağımsız (jQuery/Bootstrap JS gerektirmez) */
(function () {
	'use strict';
	var d = document, w = window;
	var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var $ = function (s, r) { return (r || d).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

	/* 1) yükleme ekranı — takılmaz */
	var loader = $('.loader-wrapper');
	function hideLoader() { if (loader) { loader.classList.add('done'); setTimeout(function () { if (loader) { loader.style.display = 'none'; } }, 600); } }
	if (d.readyState === 'complete') { hideLoader(); } else { w.addEventListener('load', hideLoader); setTimeout(hideLoader, 3500); }

	/* 2) menü: kaydırınca cam efekti, aktif bağlantı, mobil açma/kapama */
	var nav = $('#mainNav'), bar = $('#scrollBar'), toTop = $('.back-to-top');
	var links = $$('#navbarDefault .nav-link');
	var sections = links.map(function (a) { return $(a.getAttribute('href')); });
	var ticking = false;
	function onScroll() {
		var y = w.pageYOffset || d.documentElement.scrollTop;
		var h = d.documentElement.scrollHeight - w.innerHeight;
		if (nav) { nav.classList.toggle('navbar-reduce', y > 50); nav.classList.toggle('navbar-trans', y <= 50); }
		if (bar) { bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')'; }
		if (toTop) { toTop.classList.toggle('show', y > 400); }
		var cur = 0, mark = y + w.innerHeight * 0.35;
		sections.forEach(function (s, i) { if (s && s.offsetTop <= mark) { cur = i; } });
		links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
		ticking = false;
	}
	w.addEventListener('scroll', function () { if (!ticking) { ticking = true; w.requestAnimationFrame(onScroll); } }, { passive: true });
	w.addEventListener('resize', onScroll);
	onScroll();

	var toggler = $('#navToggle'), panel = $('#navbarDefault');
	function setMenu(open) {
		if (!toggler || !panel) { return; }
		panel.classList.toggle('show', open);
		toggler.classList.toggle('collapsed', !open);
		toggler.setAttribute('aria-expanded', open ? 'true' : 'false');
		if (open && nav) { nav.classList.add('navbar-reduce'); }
	}
	if (toggler) { toggler.addEventListener('click', function () { setMenu(!panel.classList.contains('show')); }); }
	$$('.js-scroll').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
	d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); } });

	/* 3) başlık: yazma efekti (sıralı kelimeler) */
	var typed = $('#typed'), words = $$('#roles li').map(function (li) { return li.textContent; });
	if (typed && words.length) {
		if (reduce) { typed.textContent = words[0]; }
		else {
			var wi = 0, ci = 0, del = false;
			typed.textContent = '';
			(function tick() {
				var word = words[wi];
				if (!del) { ci++; typed.textContent = word.slice(0, ci); if (ci === word.length) { del = true; return setTimeout(tick, 900); } return setTimeout(tick, 42); }
				ci--; typed.textContent = word.slice(0, ci);
				if (ci === 0) { del = false; wi = (wi + 1) % words.length; return setTimeout(tick, 120); }
				setTimeout(tick, 22);
			})();
		}
	}

	/* 4) görünme animasyonları */
	var rv = $$('.rv');
	if ('IntersectionObserver' in w && !reduce) {
		var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
		rv.forEach(function (el) { io.observe(el); });
	} else { rv.forEach(function (el) { el.classList.add('in'); }); }

	/* 5) iletişim formu */
	var form = $('#contact-form'), msg = $('.form-message');
	if (form) {
		var btn = $('.btn-send', form), label = btn ? $('span', btn) : null, original = label ? label.textContent : '';
		var show = function (ok, text) { msg.className = 'form-message ' + (ok ? 'success' : 'error'); msg.textContent = text; };
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var bad = false;
			$$('input[required], textarea[required]', form).forEach(function (f) {
				var v = f.value.trim(), okf = v !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
				f.classList.toggle('invalid', !okf); if (!okf) { bad = true; }
			});
			if (bad) { show(false, 'Lütfen tüm alanları doğru şekilde doldurun.'); return; }
			if ($('[name=website]', form).value) { show(true, 'Mesajınız gönderildi.'); form.reset(); return; } /* bot tuzağı */
			btn.disabled = true; btn.classList.add('loading'); label.textContent = 'Gönderiliyor...';
			var body = new URLSearchParams(new FormData(form)).toString();
			var xhr = new XMLHttpRequest();
			xhr.open('POST', form.getAttribute('action'));
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.onload = function () {
				var t = (xhr.responseText || '').trim();
				if (xhr.status >= 200 && xhr.status < 300) { show(true, t || 'Mesajınız gönderildi. Teşekkürler!'); form.reset(); }
				else { show(false, t || 'Mesaj gönderilemedi. Lütfen tekrar deneyin veya telefon / e-posta ile ulaşın.'); }
			};
			xhr.onerror = function () { show(false, 'Bağlantı hatası. Lütfen tekrar deneyin veya telefon / e-posta ile ulaşın.'); };
			xhr.onloadend = function () { btn.disabled = false; btn.classList.remove('loading'); label.textContent = original; };
			xhr.send(body);
		});
		$$('input, textarea', form).forEach(function (f) { f.addEventListener('input', function () { f.classList.remove('invalid'); }); });
	}
})();
