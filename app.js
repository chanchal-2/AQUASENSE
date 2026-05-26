    // ─── DYNAMIC COMPONENT LOADING ────────────────────────
    async function loadComponents() {
      try {
        // Load home.html
        const homeRes = await fetch('pages/home.html');
        document.getElementById('home-container').innerHTML = await homeRes.text();

        // Load login.html
        const loginRes = await fetch('pages/login.html');
        document.getElementById('login-container').innerHTML = await loginRes.text();

        // Load admin-login.html
        const adminLoginRes = await fetch('pages/admin-login.html');
        document.getElementById('admin-login-container').innerHTML = await adminLoginRes.text();

        // Load citizen-login.html
        const citizenLoginRes = await fetch('pages/citizen-login.html');
        document.getElementById('citizen-login-container').innerHTML = await citizenLoginRes.text();

        // Load modal.html
        const modalRes = await fetch('pages/modal.html');
        document.getElementById('modal-container').innerHTML = await modalRes.text();

        // Load main content pages
        const pages = [
          'dashboard', 'map', 'forecast', 'alerts', 'admin',
          'complaints', 'report-submit', 'myward', 'budget', 'badges'
        ];
        const mainContent = document.getElementById('g-main');
        for (const page of pages) {
          const pageRes = await fetch(`pages/${page}.html`);
          const html = await pageRes.text();
          mainContent.insertAdjacentHTML('beforeend', html);
        }

        // Setup navbar/scroll listeners for home page
        setupHomeListeners();

        // Initialize swipe-back navigation
        SwipeBack.init();
        SwipeBack.push('home-screen');
      } catch (error) {
        console.error("Error loading templates dynamically:", error);
      }
    }

    // Navigation helpers
    function navigateToLogin() {
      const home = document.getElementById('home-screen');
      const login = document.getElementById('login-screen');
      if (home) home.classList.remove('active');
      if (login) login.classList.add('active');
      SwipeBack.push('login-screen');
    }

    function navigateToHome() {
      const login = document.getElementById('login-screen');
      const home = document.getElementById('home-screen');
      if (login) login.classList.remove('active');
      if (home) home.classList.add('active');
      SwipeBack.pop();
    }

    // ─── ADMIN LOGIN NAVIGATION ─────────────────────────
    let adminMapAnimId = null;

    function navigateToAdminLogin() {
      const home = document.getElementById('home-screen');
      const adminLogin = document.getElementById('admin-login-screen');
      if (home) home.classList.remove('active');
      if (adminLogin) adminLogin.classList.add('active');
      SwipeBack.push('admin-login-screen');
      setTimeout(initAdminMap, 120);
    }

    function navigateFromAdminToHome() {
      if (adminMapAnimId) { cancelAnimationFrame(adminMapAnimId); adminMapAnimId = null; }
      const adminLogin = document.getElementById('admin-login-screen');
      const home = document.getElementById('home-screen');
      if (adminLogin) {
        adminLogin.classList.add('slide-out');
        setTimeout(() => {
          adminLogin.classList.remove('active', 'slide-out');
          if (home) home.classList.add('active');
        }, 400);
      }
      SwipeBack.pop();
    }

    function navigateToCitizenLogin() {
      const home = document.getElementById('home-screen');
      const citizenLogin = document.getElementById('citizen-login-screen');
      if (home) home.classList.remove('active');
      if (citizenLogin) citizenLogin.classList.add('active');
      SwipeBack.push('citizen-login-screen');
    }

    function navigateFromCitizenToHome() {
      const citizenLogin = document.getElementById('citizen-login-screen');
      const home = document.getElementById('home-screen');
      if (citizenLogin) {
        citizenLogin.classList.add('slide-out');
        setTimeout(() => {
          citizenLogin.classList.remove('active', 'slide-out');
          if (home) home.classList.add('active');
        }, 400);
      }
      SwipeBack.pop();
    }

    function toggleCitizenPassword() {
      const input = document.getElementById('citizen-password');
      const icon = document.getElementById('citizen-eye-icon');
      if (!input || !icon) return;
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'ti ti-eye-off';
      } else {
        input.type = 'password';
        icon.className = 'ti ti-eye';
      }
    }

    function citizenLogin() {
      const btn = document.getElementById('citizen-auth-btn');
      if (btn) btn.classList.add('loading');

      setTimeout(() => {
        if (btn) btn.classList.remove('loading');
        currentRole = 'citizen';
        const ward = document.getElementById('citizen-ward-select') ? document.getElementById('citizen-ward-select').value : 'Koramangala';
        currentWard = ward;

        const citizenLogin = document.getElementById('citizen-login-screen');
        if (citizenLogin) citizenLogin.classList.remove('active');
        document.getElementById('app-screen').classList.add('active');

        document.getElementById('user-avatar').textContent = ward[0];
        document.getElementById('user-avatar').style.background = '#34a853';
        document.getElementById('user-name-display').textContent = 'Citizen — ' + ward;
        document.getElementById('role-badge-display').textContent = 'CITIZEN';
        document.getElementById('role-badge-display').style.background = '#e6f4ea';
        document.getElementById('role-badge-display').style.color = '#34a853';
        document.getElementById('ward-rc-name').textContent = ward;
        document.getElementById('myward-sub').textContent = 'Personalized water status for ' + ward;
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'none');
        document.querySelectorAll('.citizen-only').forEach(e => e.style.display = 'flex');
        document.querySelectorAll('.admin-only-page').forEach(e => e.dataset.hidden = 'true');
        document.querySelectorAll('.citizen-only-page').forEach(e => e.dataset.hidden = '');
        document.getElementById('dash-subtitle').textContent = ward + ' — Your ward status · Updated 2 min ago';
        showPage('myward');

        SwipeBack.push('app-screen');
        initApp();
        setTimeout(() => {
          showToast('info', 'Welcome! Showing data for ' + ward, 'Signed In');
          setTimeout(() => showToast('critical', 'Whitefield WSI crossed 0.90 threshold', 'Critical Alert 🔴'), 2500);
          setTimeout(() => showToast('alert', 'Your ward ' + ward + ' needs attention in 30 days', 'Ward Advisory'), 5000);
        }, 400);
      }, 1200);
    }

    function citizenGoogleLogin() {
      showToast('info', 'Google SSO integration coming soon', 'Google Login');
    }

    function citizenGuestLogin() {
      currentRole = 'citizen';
      currentWard = 'Koramangala';

      const citizenLogin = document.getElementById('citizen-login-screen');
      if (citizenLogin) citizenLogin.classList.remove('active');
      document.getElementById('app-screen').classList.add('active');

      document.getElementById('user-avatar').textContent = 'G';
      document.getElementById('user-avatar').style.background = '#9aa0a6';
      document.getElementById('user-name-display').textContent = 'Guest Citizen';
      document.getElementById('role-badge-display').textContent = 'GUEST';
      document.getElementById('role-badge-display').style.background = '#f1f3f4';
      document.getElementById('role-badge-display').style.color = '#80868b';
      document.getElementById('ward-rc-name').textContent = 'Koramangala';
      document.getElementById('myward-sub').textContent = 'Personalized water status for Koramangala';
      document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'none');
      document.querySelectorAll('.citizen-only').forEach(e => e.style.display = 'flex');
      document.querySelectorAll('.admin-only-page').forEach(e => e.dataset.hidden = 'true');
      document.querySelectorAll('.citizen-only-page').forEach(e => e.dataset.hidden = '');
      document.getElementById('dash-subtitle').textContent = 'Koramangala — Your ward status · Updated 2 min ago';
      showPage('myward');

      SwipeBack.push('app-screen');
      initApp();
      setTimeout(() => {
        showToast('info', 'Welcome, Guest! Explore water data for Koramangala', 'Guest Mode');
      }, 400);
    }

    function citizenSignupPrompt() {
      showToast('info', 'Registration portal coming soon. Use demo credentials for now.', 'Create Account');
    }

    function toggleAdminPassword() {
      const input = document.getElementById('admin-password');
      const icon = document.getElementById('admin-eye-icon');
      if (!input || !icon) return;
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'ti ti-eye-off';
      } else {
        input.type = 'password';
        icon.className = 'ti ti-eye';
      }
    }

    function adminLogin() {
      currentRole = 'admin';
      const adminLogin = document.getElementById('admin-login-screen');
      if (adminLogin) adminLogin.classList.remove('active');
      document.getElementById('app-screen').classList.add('active');

      document.getElementById('user-avatar').textContent = 'A';
      document.getElementById('user-avatar').style.background = '#1a73e8';
      document.getElementById('user-name-display').textContent = 'Admin — BWSSB';
      document.getElementById('role-badge-display').textContent = 'ADMIN';
      document.getElementById('role-badge-display').style.background = '#fce8e6';
      document.getElementById('role-badge-display').style.color = '#ea4335';
      document.querySelectorAll('.citizen-only').forEach(e => e.style.display = 'none');
      document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'flex');
      document.querySelectorAll('.admin-only-page').forEach(e => e.style.display = '');
      document.querySelectorAll('.citizen-only-page').forEach(e => e.dataset.hidden = 'true');

      SwipeBack.push('app-screen');
      initApp();
      setTimeout(() => {
        showToast('info', 'Welcome back, BWSSB Admin', 'Signed In');
        setTimeout(() => showToast('critical', 'Whitefield WSI crossed 0.90 threshold', 'Critical Alert 🔴'), 2500);
      }, 400);
    }

    // ─── ADMIN WARD MAP CANVAS ──────────────────────────
    function initAdminMap() {
      if (adminMapAnimId) cancelAnimationFrame(adminMapAnimId);
      const canvas = document.getElementById('adminWardMap');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      let frame = 0;
      const mapWards = [
        { name: 'Whitefield', x: 0.76, y: 0.32, r: 16, color: '#ea4335' },
        { name: 'Yelahanka', x: 0.38, y: 0.13, r: 14, color: '#ea4335' },
        { name: 'M.halli', x: 0.70, y: 0.50, r: 13, color: '#fa7b17' },
        { name: 'K.gala', x: 0.52, y: 0.58, r: 13, color: '#fa7b17' },
        { name: 'HSR', x: 0.47, y: 0.72, r: 12, color: '#fa7b17' },
        { name: 'Hebbal', x: 0.42, y: 0.22, r: 12, color: '#fbbc04' },
        { name: 'J.nagar', x: 0.37, y: 0.70, r: 11, color: '#fbbc04' },
        { name: 'R.nagar', x: 0.24, y: 0.44, r: 11, color: '#fbbc04' },
        { name: 'M.waram', x: 0.32, y: 0.52, r: 10, color: '#34a853' },
        { name: 'B.gudi', x: 0.42, y: 0.84, r: 10, color: '#34a853' },
      ];
      const conns = [[0,2],[2,3],[3,4],[5,8],[8,6],[7,8],[3,6],[1,5],[5,7],[0,5],[4,9],[6,9]];

      function draw() {
        ctx.clearRect(0, 0, W, H);
        frame++;

        // Dot grid
        ctx.fillStyle = 'rgba(66,133,244,0.04)';
        for (let gx = 10; gx < W; gx += 22) {
          for (let gy = 10; gy < H; gy += 22) {
            ctx.beginPath();
            ctx.arc(gx, gy, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // City boundary
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(66,133,244,0.1)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 5]);
        ctx.ellipse(W * 0.48, H * 0.48, W * 0.4, H * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Connections with animated flow dots
        conns.forEach(function(c) {
          var a = mapWards[c[0]], b = mapWards[c[1]];
          var ax = a.x * W, ay = a.y * H, bx = b.x * W, by = b.y * H;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(66,133,244,0.08)';
          ctx.lineWidth = 0.8;
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          // Flow dot
          var t = ((frame * 0.004 + c[0] * 0.1) % 1);
          var dx = ax + (bx - ax) * t, dy = ay + (by - ay) * t;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(66,133,244,0.45)';
          ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Ward zones
        mapWards.forEach(function(w) {
          var x = w.x * W, y = w.y * H;
          // Outer glow
          var g = ctx.createRadialGradient(x, y, 0, x, y, w.r * 2.2);
          g.addColorStop(0, w.color + '20');
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, w.r * 2.2, 0, Math.PI * 2);
          ctx.fill();
          // Filled circle
          ctx.beginPath();
          ctx.fillStyle = w.color + '30';
          ctx.strokeStyle = w.color + '70';
          ctx.lineWidth = 1.2;
          ctx.arc(x, y, w.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Pulsing ring
          var pr = w.r + 2 + Math.sin(frame * 0.025 + w.x * 10) * 3;
          ctx.beginPath();
          ctx.strokeStyle = w.color + '25';
          ctx.lineWidth = 0.8;
          ctx.arc(x, y, pr, 0, Math.PI * 2);
          ctx.stroke();
          // Label
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          ctx.font = '8px "Google Sans", Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(w.name, x, y);
        });

        // Legend
        var lx = 8, ly = H - 52;
        var items = [
          { l: 'Critical', c: '#ea4335' },
          { l: 'High Risk', c: '#fa7b17' },
          { l: 'Moderate', c: '#fbbc04' },
          { l: 'Stable', c: '#34a853' }
        ];
        items.forEach(function(it, i) {
          var iy = ly + i * 13;
          ctx.beginPath();
          ctx.fillStyle = it.c;
          ctx.arc(lx + 4, iy, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = '8px "Google Sans", Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(it.l, lx + 12, iy + 3);
        });

        adminMapAnimId = requestAnimationFrame(draw);
      }
      draw();
    }

    function setupHomeListeners() {
      const sections = document.querySelectorAll('#home-screen section');
      const navLinks = document.querySelectorAll('.home-link');

      const options = {
        root: null,
        threshold: 0.3,
        rootMargin: "-72px 0px 0px 0px"
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
              }
            });
          }
        });
      }, options);

      sections.forEach(section => observer.observe(section));
    }

    // Trigger template loading immediately
    loadComponents();

    // ─── DATA ───────────────────────────────────────────
    const WARDS = [
      { name: 'Whitefield', wsi: 0.91, borewell: 22, supply: 8.4, r30: 'Critical', r60: 'Critical', color: '#ea4335', x: 72, y: 40 },
      { name: 'Yelahanka', wsi: 0.82, borewell: 35, supply: 11.2, r30: 'Critical', r60: 'Critical', color: '#ea4335', x: 28, y: 18 },
      { name: 'Marathahalli', wsi: 0.76, borewell: 41, supply: 12.8, r30: 'High', r60: 'Critical', color: '#fa7b17', x: 66, y: 55 },
      { name: 'Koramangala', wsi: 0.74, borewell: 52, supply: 14.2, r30: 'High', r60: 'Critical', color: '#fa7b17', x: 45, y: 65 },
      { name: 'HSR Layout', wsi: 0.68, borewell: 58, supply: 15.6, r30: 'High', r60: 'High', color: '#fa7b17', x: 42, y: 75 },
      { name: 'Hebbal', wsi: 0.61, borewell: 63, supply: 17.1, r30: 'Moderate', r60: 'High', color: '#fbbc04', x: 38, y: 25 },
      { name: 'Jayanagar', wsi: 0.55, borewell: 70, supply: 18.4, r30: 'Moderate', r60: 'Moderate', color: '#fbbc04', x: 34, y: 72 },
      { name: 'Rajajinagar', wsi: 0.47, borewell: 78, supply: 20.1, r30: 'Moderate', r60: 'Moderate', color: '#fbbc04', x: 22, y: 50 },
      { name: 'Malleswaram', wsi: 0.38, borewell: 85, supply: 22.5, r30: 'Low', r60: 'Moderate', color: '#34a853', x: 28, y: 58 },
      { name: 'Basavanagudi', wsi: 0.31, borewell: 90, supply: 24.3, r30: 'Low', r60: 'Low', color: '#34a853', x: 33, y: 82 },
    ];

    let currentRole = 'admin';
    let currentWard = 'Koramangala';
    let notifCount = 3;
    let charts = {};

    // ─── LOGIN ───────────────────────────────────────────
    function selectRole(r) {
      currentRole = r;
      document.getElementById('role-admin').classList.toggle('selected', r === 'admin');
      document.getElementById('role-citizen').classList.toggle('selected', r === 'citizen');
      document.getElementById('ward-select-wrap').classList.toggle('visible', r === 'citizen');
      document.getElementById('login-email').value = r === 'admin' ? 'admin@bwssb.gov.in' : 'citizen@gmail.com';
    }

    function doLogin() {
      const ward = document.getElementById('ward-select') ? document.getElementById('ward-select').value : 'Koramangala';
      currentWard = ward;
      document.getElementById('login-screen').classList.remove('active');
      document.getElementById('app-screen').classList.add('active');

      if (currentRole === 'admin') {
        document.getElementById('user-avatar').textContent = 'A';
        document.getElementById('user-avatar').style.background = '#1a73e8';
        document.getElementById('user-name-display').textContent = 'Admin — BWSSB';
        document.getElementById('role-badge-display').textContent = 'ADMIN';
        document.getElementById('role-badge-display').style.background = '#fce8e6';
        document.getElementById('role-badge-display').style.color = '#ea4335';
        document.querySelectorAll('.citizen-only').forEach(e => e.style.display = 'none');
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'flex');
        document.querySelectorAll('.admin-only-page').forEach(e => e.style.display = '');
        document.querySelectorAll('.citizen-only-page').forEach(e => e.dataset.hidden = 'true');
      } else {
        document.getElementById('user-avatar').textContent = ward[0];
        document.getElementById('user-avatar').style.background = '#34a853';
        document.getElementById('user-name-display').textContent = 'Citizen — ' + ward;
        document.getElementById('role-badge-display').textContent = 'CITIZEN';
        document.getElementById('role-badge-display').style.background = '#e6f4ea';
        document.getElementById('role-badge-display').style.color = '#34a853';
        document.getElementById('ward-rc-name').textContent = ward;
        document.getElementById('myward-sub').textContent = 'Personalized water status for ' + ward;
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'none');
        document.querySelectorAll('.citizen-only').forEach(e => e.style.display = 'flex');
        document.querySelectorAll('.admin-only-page').forEach(e => e.dataset.hidden = 'true');
        document.querySelectorAll('.citizen-only-page').forEach(e => e.dataset.hidden = '');
        document.getElementById('dash-subtitle').textContent = ward + ' — Your ward status · Updated 2 min ago';
        showPage('myward');
      }

      SwipeBack.push('app-screen');
      initApp();
      setTimeout(() => {
        showToast('info', currentRole === 'admin' ? 'Welcome back, BWSSB Admin' : 'Welcome! Showing data for ' + ward, 'Signed In');
        setTimeout(() => showToast('critical', 'Whitefield WSI crossed 0.90 threshold', 'Critical Alert 🔴'), 2500);
        if (currentRole === 'citizen') {
          setTimeout(() => showToast('alert', 'Your ward ' + ward + ' needs attention in 30 days', 'Ward Advisory'), 5000);
        }
      }, 400);
    }

    function logout() {
      const app = document.getElementById('app-screen');
      const home = document.getElementById('home-screen');
      if (app) app.classList.add('slide-out');
      setTimeout(() => {
        if (app) app.classList.remove('active', 'slide-out');
        if (home) home.classList.add('active');
      }, 400);
      SwipeBack.reset('home-screen');
    }

    // ─── SWIPE-BACK EVENT HANDLER ─────────────────────────
    // Listen for SwipeBack completions to do app-specific cleanup
    document.addEventListener('swipeback', function(e) {
      var from = e.detail.from;
      // Cancel admin map animation when swiping away from admin login
      if (from === 'admin-login-screen') {
        if (adminMapAnimId) { cancelAnimationFrame(adminMapAnimId); adminMapAnimId = null; }
      }
      // Handle swipe-back from citizen login
      if (from === 'citizen-login-screen') {
        // No special cleanup needed
      }
    });


    // ─── PAGE NAVIGATION ─────────────────────────────────
    function showPage(id) {
      document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
      });
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const page = document.getElementById('page-' + id);
      if (page && page.dataset.hidden !== 'true') page.classList.add('active');
      else if (page) page.classList.add('active');
      // activate nav
      event && event.currentTarget && event.currentTarget.classList.add('active');
      // init charts for page
      if (id === 'forecast') initForecastCharts();
      if (id === 'admin') initAdminCharts();
      if (id === 'complaints') initReportsChart();
      if (id === 'budget') initBudgetChart();
      if (id === 'myward') initWardChart();
      if (id === 'map') setTimeout(() => initMap('mapCanvas2'), 50);
    }

    // ─── INIT APP ────────────────────────────────────────
    function initApp() {
      renderWardTable();
      renderAlerts();
      renderReportFeed();
      renderAdvisory();
      renderBudgetInputs();
      initMap('mapCanvas');
      updateForecastCards(30);
    }

    // ─── WARD TABLE ──────────────────────────────────────
    function renderWardTable() {
      const tb = document.getElementById('ward-tbody');
      if (!tb) return;
      tb.innerHTML = WARDS.map(w => `
    <tr>
      <td><strong style="font-family:var(--font)">${w.name}</strong></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="progress-bar"><div class="progress-fill" style="width:${w.wsi * 100}%;background:${w.color}"></div></div>
          <span style="font-size:12px;font-family:var(--font);font-weight:500;color:${w.color}">${w.wsi}</span>
        </div>
      </td>
      <td style="color:${w.borewell < 50 ? 'var(--red)' : w.borewell < 70 ? 'var(--orange)' : 'var(--green)'}">${w.borewell}%</td>
      <td>${w.supply} MLD</td>
      <td><span class="risk-chip ${w.r30.toLowerCase()}">${w.r30}</span></td>
      <td><span class="risk-chip ${w.r60.toLowerCase()}">${w.r60}</span></td>
    </tr>`).join('');
    }

    // ─── ALERTS ──────────────────────────────────────────
    const ALERTS = [
      { type: 'critical', icon: 'ti-alert-circle', title: 'Whitefield — Critical WSI 0.91', desc: 'Borewell depleted 78% · Immediate action required · Push tanker supply', time: '2 min ago' },
      { type: 'critical', icon: 'ti-droplet-off', title: 'Yelahanka — Supply Disruption Risk', desc: 'Reservoir at 35% · 60-day forecast: Critical · Activate emergency plan', time: '18 min ago' },
      { type: 'high', icon: 'ti-trending-up', title: 'Marathahalli — Rapid WSI Rise', desc: 'WSI increased 0.12 in 7 days · Borewell extraction at 180% safe limit', time: '1 hr ago' },
      { type: 'high', icon: 'ti-cloud-rain', title: 'Below Normal Rainfall — IMD Update', desc: 'June 2026 forecast: 60% below normal for Bengaluru division', time: '3 hrs ago' },
      { type: 'info', icon: 'ti-refresh', title: 'BWSSB Data Sync Complete', desc: '198 wards updated · 3 anomalies detected in Zone 4 supply data', time: '6 hrs ago' },
      { type: 'resolved', icon: 'ti-check', title: 'Jayanagar — Alert Resolved', desc: 'Supply restored to normal levels · WSI dropped to 0.55', time: 'Yesterday' },
    ];
    function renderAlerts() {
      const el = document.getElementById('all-alerts-list');
      if (!el) return;
      el.innerHTML = ALERTS.map(a => `
    <div class="alert-item ${a.type}">
      <div class="alert-icon"><i class="ti ${a.icon}"></i></div>
      <div>
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
        <div class="alert-meta">${a.time}</div>
      </div>
    </div>`).join('');
    }

    // ─── REPORT FEED ─────────────────────────────────────
    const REPORTS = [
      { ward: 'Whitefield', type: 'Dry Tap', desc: 'No water supply for 3 consecutive days', status: 'investigating', time: 'Today 09:14' },
      { ward: 'Marathahalli', type: 'Illegal Borewell', desc: 'Unauthorized drilling observed near main road', status: 'pending', time: 'Today 08:30' },
      { ward: 'Koramangala', type: 'Water Quality', desc: 'Yellowish water coming from taps since morning', status: 'resolved', time: 'Yesterday' },
      { ward: 'HSR Layout', type: 'Supply Leak', desc: 'Major pipe leak at 5th cross, water wastage high', status: 'investigating', time: 'Yesterday' },
    ];
    function renderReportFeed() {
      const el = document.getElementById('report-feed');
      if (!el) return;
      el.innerHTML = REPORTS.map(r => `
    <div class="report-item">
      <div class="report-avatar"><i class="ti ti-message-report"></i></div>
      <div style="flex:1">
        <div style="font-family:var(--font);font-size:13px;font-weight:500;color:var(--gray900)">${r.ward} — ${r.type}</div>
        <div style="font-size:12px;color:var(--gray600);margin-top:2px">${r.desc}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="report-status ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
          <span style="font-size:11px;color:var(--gray400)">${r.time}</span>
        </div>
      </div>
    </div>`).join('');
    }

    // ─── ADVISORY ────────────────────────────────────────
    function renderAdvisory() {
      const el = document.getElementById('advisory-list');
      if (!el) return;
      const tips = [
        { icon: 'ti-alert-triangle', color: 'var(--red)', bg: 'var(--red-light)', text: 'WSI score 0.74 — reduce borewell extraction immediately' },
        { icon: 'ti-droplet', color: 'var(--blue)', bg: 'var(--blue-light)', text: 'Store 2–3 days of water as buffer before June 1 supply cut risk' },
        { icon: 'ti-tools', color: 'var(--orange)', bg: 'var(--orange-light)', text: 'Fix any leaking taps — save up to 50L/day per household' },
        { icon: 'ti-bell', color: 'var(--green)', bg: 'var(--green-light)', text: 'Enable push notifications to get early shortage alerts' },
      ];
      el.innerHTML = tips.map(t => `
    <div style="display:flex;gap:10px;align-items:flex-start;padding:10px;background:${t.bg};border-radius:var(--radius)">
      <i class="ti ${t.icon}" style="font-size:16px;color:${t.color};margin-top:1px;flex-shrink:0"></i>
      <div style="font-size:13px;color:var(--gray800)">${t.text}</div>
    </div>`).join('');
    }

    // ─── BUDGET INPUTS ───────────────────────────────────
    const BUDGET_ITEMS = [
      { label: 'Drinking & cooking', key: 'drink', val: 5, unit: 'L/day' },
      { label: 'Bathing / shower', key: 'bath', val: 50, unit: 'L/day' },
      { label: 'Toilet flushes', key: 'flush', val: 30, unit: 'L/day' },
      { label: 'Washing dishes', key: 'dishes', val: 15, unit: 'L/day' },
      { label: 'Laundry (per cycle)', key: 'laundry', val: 80, unit: 'L/wash' },
      { label: 'Garden / plants', key: 'garden', val: 10, unit: 'L/day' },
    ];
    function renderBudgetInputs() {
      const el = document.getElementById('budget-inputs');
      if (!el) return;
      el.innerHTML = BUDGET_ITEMS.map(b => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
      <label style="font-size:13px;color:var(--gray700);font-family:var(--font);flex:1">${b.label}</label>
      <input type="number" class="g-input" style="width:90px" value="${b.val}" min="0" id="bi-${b.key}"
        oninput="calcBudget()"/>
      <span style="font-size:11px;color:var(--gray600);width:50px">${b.unit}</span>
    </div>`).join('');
      setTimeout(calcBudget, 100);
    }
    function calcBudget() {
      let total = 0;
      BUDGET_ITEMS.forEach(b => {
        const el = document.getElementById('bi-' + b.key);
        if (el) total += parseFloat(el.value) || 0;
      });
      const el = document.getElementById('budget-val');
      const sc = document.getElementById('budget-score');
      if (el) el.textContent = Math.round(total) + ' L';
      if (sc) {
        if (total < 100) { sc.textContent = '🌟 Excellent Saver'; sc.style.background = 'var(--green-light)'; sc.style.color = 'var(--green)' }
        else if (total < 150) { sc.textContent = '👍 Good'; sc.style.background = 'var(--blue-light)'; sc.style.color = 'var(--blue)' }
        else if (total < 200) { sc.textContent = '⚠️ Average'; sc.style.background = 'var(--yellow-light)'; sc.style.color = 'var(--orange)' }
        else { sc.textContent = '🔴 High Usage'; sc.style.background = 'var(--red-light)'; sc.style.color = 'var(--red)' }
      }
    }

    // ─── MAP ─────────────────────────────────────────────
    function initMap(canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight || 340;
      canvas.width = W; canvas.height = H;

      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, W, H);

      // Draw grid
      ctx.strokeStyle = '#e8eaed'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Draw wards as circles
      WARDS.forEach(w => {
        const x = w.x / 100 * W; const y = w.y / 100 * H;
        const r = 18 + w.wsi * 12;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = w.color + '33'; ctx.fill();
        ctx.strokeStyle = w.color; ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = w.color;
        ctx.font = 'bold 11px Google Sans, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(w.name.split(' ')[0], x, y);
      });

      const tt = document.getElementById('wardTooltip');
      if (!tt) return;
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);
        let hit = null;
        WARDS.forEach(w => {
          const wx = w.x / 100 * W; const wy = w.y / 100 * H;
          const d = Math.hypot(mx - wx, my - wy);
          if (d < 30) hit = w;
        });
        if (hit) {
          tt.style.display = 'block';
          tt.style.left = (e.clientX - rect.left + 12) + 'px';
          tt.style.top = (e.clientY - rect.top - 60) + 'px';
          tt.innerHTML = `<div class="tt-name">${hit.name}</div>
        <div class="tt-row"><span>WSI Score</span><span style="color:${hit.color}">${hit.wsi}</span></div>
        <div class="tt-row"><span>30-Day Risk</span><span style="color:${hit.color}">${hit.r30}</span></div>
        <div class="tt-row"><span>Borewell</span><span>${hit.borewell}%</span></div>`;
        } else tt.style.display = 'none';
      };
      canvas.onmouseleave = () => { if (tt) tt.style.display = 'none'; };
    }

    // ─── FORECAST ────────────────────────────────────────
    function updateForecastCards(days) {
      const el = document.getElementById('forecast-cards');
      if (!el) return;
      const d = parseInt(days);
      const pct = d / 60;
      const wsi30 = Math.min(0.95, 0.64 + 0.20 * pct);
      const wsi60 = Math.min(0.99, 0.64 + 0.35 * pct);
      const rl = (v) => v > 0.8 ? 'Critical' : v > 0.65 ? 'High' : v > 0.45 ? 'Moderate' : 'Low';
      const rc = (v) => v > 0.8 ? 'var(--red)' : v > 0.65 ? 'var(--orange)' : v > 0.45 ? 'var(--orange)' : 'var(--green)';
      el.innerHTML = `
    <div class="fc-card">
      <div class="fc-day">30-Day Forecast</div>
      <div class="fc-risk" style="color:${rc(wsi30)}">${rl(wsi30)}</div>
      <div style="font-size:12px;color:var(--gray600);margin-top:4px">Avg WSI: ${wsi30.toFixed(2)} · ${Math.round(wsi30 * 100)}% stress</div>
    </div>
    <div class="fc-card">
      <div class="fc-day">60-Day Forecast</div>
      <div class="fc-risk" style="color:${rc(wsi60)}">${rl(wsi60)}</div>
      <div style="font-size:12px;color:var(--gray600);margin-top:4px">Avg WSI: ${wsi60.toFixed(2)} · ${Math.round(wsi60 * 100)}% stress</div>
    </div>`;
    }

    function initForecastCharts() {
      if (charts.forecast) charts.forecast.destroy();
      const ctx = document.getElementById('forecastChart');
      if (!ctx) return;
      const labels = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 60 + i * 10);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      });
      charts.forecast = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Reservoir %', data: [72, 70, 68, 65, 63, 62, 59, 57, 54, 52, 49, 46],
              borderColor: '#1a73e8', backgroundColor: 'rgba(26,115,232,0.08)', fill: true, tension: 0.4, borderWidth: 2
            },
            {
              label: 'WSI Score', data: [0.52, 0.54, 0.57, 0.59, 0.61, 0.64, 0.67, 0.70, 0.73, 0.76, 0.80, 0.84],
              borderColor: '#ea4335', backgroundColor: 'rgba(234,67,53,0.05)', fill: true, tension: 0.4, borderWidth: 2,
              yAxisID: 'wsi'
            },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { family: 'Google Sans' }, boxWidth: 12 } } },
          scales: {
            y: { grid: { color: '#f1f3f4' }, ticks: { font: { family: 'Google Sans', size: 11 } } },
            wsi: { position: 'right', min: 0, max: 1, grid: { display: false }, ticks: { font: { family: 'Google Sans', size: 11 } } },
            x: { grid: { color: '#f1f3f4' }, ticks: { font: { family: 'Google Sans', size: 10 }, maxRotation: 0 } }
          }
        }
      });
    }

    function initAdminCharts() {
      if (charts.model) charts.model.destroy();
      const ctx = document.getElementById('modelChart');
      if (!ctx) return;
      charts.model = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            { label: 'Predicted WSI', data: [0.58, 0.60, 0.62, 0.63, 0.64, 0.67], backgroundColor: 'rgba(26,115,232,0.7)', borderRadius: 4 },
            { label: 'Actual WSI', data: [0.57, 0.61, 0.61, 0.64, 0.63, 0.66], backgroundColor: 'rgba(52,168,83,0.5)', borderRadius: 4 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { family: 'Google Sans' }, boxWidth: 12 } } },
          scales: {
            y: { min: 0.4, max: 0.9, grid: { color: '#f1f3f4' }, ticks: { font: { family: 'Google Sans', size: 11 } } },
            x: { grid: { color: '#f1f3f4' }, ticks: { font: { family: 'Google Sans', size: 11 } } }
          }
        }
      });
    }

    function initReportsChart() {
      if (charts.reports) charts.reports.destroy();
      const ctx = document.getElementById('reportsChart');
      if (!ctx) return;
      charts.reports = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Dry Tap', 'Illegal Borewell', 'Water Quality', 'Supply Leak', 'Tanker Issue'],
          datasets: [{
            data: [34, 18, 22, 16, 10],
            backgroundColor: ['#ea4335', '#fa7b17', '#fbbc04', '#1a73e8', '#34a853'],
            borderWidth: 0, hoverOffset: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'right', labels: { font: { family: 'Google Sans', size: 12 }, boxWidth: 12, padding: 12 } } }
        }
      });
    }

    function initBudgetChart() {
      if (charts.budget) charts.budget.destroy();
      const ctx = document.getElementById('budgetChart');
      if (!ctx) return;
      charts.budget = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Bathing', 'Toilet', 'Laundry', 'Dishes', 'Drinking', 'Garden'],
          datasets: [{
            data: [50, 30, 80, 15, 5, 10],
            backgroundColor: ['#1a73e8', '#ea4335', '#fa7b17', '#fbbc04', '#34a853', '#9aa0a6'],
            borderWidth: 0, hoverOffset: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'right', labels: { font: { family: 'Google Sans', size: 11 }, boxWidth: 10, padding: 8 } } }
        }
      });
    }

    function initWardChart() {
      if (charts.ward) charts.ward.destroy();
      const ctx = document.getElementById('wardChart');
      if (!ctx) return;
      charts.ward = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'WSI Score',
            data: [0.58, 0.61, 0.65, 0.68, 0.72, 0.74],
            borderColor: '#1a73e8', backgroundColor: 'rgba(26,115,232,0.1)',
            fill: true, tension: 0.4, borderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0.4, max: 1.0, grid: { color: '#f1f3f4' }, ticks: { font: { family: 'Google Sans', size: 11 } } },
            x: { grid: { color: '#f1f3f4' }, ticks: { font: { family: 'Google Sans', size: 11 } } }
          }
        }
      });
    }

    // ─── TOASTS ──────────────────────────────────────────
    function showToast(type, message, title) {
      const container = document.getElementById('toast-container');
      const t = document.createElement('div');
      t.className = 'toast';
      const iconMap = { critical: 'ti-alert-circle', alert: 'ti-bell-ringing', info: 'ti-info-circle', success: 'ti-circle-check' };
      const typeMap = { critical: 'critical', alert: 'high', info: 'info', success: 'success' };
      t.innerHTML = `
    <div class="toast-icon ${typeMap[type] || 'info'}"><i class="ti ${iconMap[type] || 'ti-info-circle'}"></i></div>
    <div class="toast-body">
      <div class="toast-title">${title || 'Notification'}</div>
      <div class="toast-sub">${message}</div>
    </div>
    <div class="toast-close" onclick="this.parentElement.remove()">×</div>`;
      container.appendChild(t);
      requestAnimationFrame(() => { t.classList.add('show'); });
      setTimeout(() => { t.classList.remove('show'); t.classList.add('hide'); setTimeout(() => t.remove(), 400); }, 5000);
      notifCount++;
      const badge = document.getElementById('notif-count');
      if (badge) badge.textContent = notifCount;
    }

    function triggerTestNotification() {
      const msgs = [
        ['critical', 'Yelahanka WSI crossed 0.85 — Critical threshold', '⚠️ Critical Alert'],
        ['alert', 'BWSSB reduced supply to Zone 4 by 30%', 'Supply Update'],
        ['info', 'IMD data synced — updated rainfall forecast', 'Data Sync'],
        ['success', 'Complaint #108 resolved — Jayanagar supply restored', 'Report Resolved'],
      ];
      const m = msgs[Math.floor(Math.random() * msgs.length)];
      showToast(m[0], m[1], m[2]);
    }

    // ─── MODAL ───────────────────────────────────────────
    function pushAlertModal() {
      document.getElementById('modal-overlay').style.display = 'flex';
    }
    function closeModal() {
      document.getElementById('modal-overlay').style.display = 'none';
    }
    function sendAlert() {
      closeModal();
      showToast('success', 'Emergency alert sent to 7 critical wards successfully', 'Alert Sent ✓');
    }
    function submitReport() {
      showPage('complaints');
      showToast('success', 'Report submitted · Ref #CR-' + Math.floor(Math.random() * 9000 + 1000), 'Report Submitted');
    }

    // ─── INIT MAP ON LOAD ────────────────────────────────
    window.addEventListener('resize', () => {
      setTimeout(() => {
        initMap('mapCanvas');
        initMap('mapCanvas2');
      }, 100);
    });