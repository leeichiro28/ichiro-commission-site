function setPrice(currency, btn) {
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.price-amount').forEach(el => {
    el.textContent = el.dataset[currency] || el.dataset.ntd;
  });
}

/* ════════════════════════════════════════════════════════
   分類圖庫 + Lightbox 放大
   ────────────────────────────────────────────────────────
   怎麼新增/修改圖片：
   只要編輯下面 galleryData 這個物件就好，不用碰 HTML。
   每個分類 key（例如 'qchibi'）要跟 portfolio-card 上
   onclick="openGallery('qchibi')" 的名稱對應。
   images 陣列裡的路徑就是你要放的圖片，可以新增任意多張。
   ════════════════════════════════════════════════════════ */
const galleryData = {
  qchibi: {
    title: 'Q版人物',
    price: 'NT$400',
    images: [
      'images/kSPEAK.png',
      'images/comic3.png',
      'images/comic1.png',
    
    ]
  },
  halfbody: {
    title: '半身Q版人物',
    price: 'NT$350',
    images: [
      'images/comic6.png',
      'images/comic2.png',
      'images/comic4.png',
      'images/comic5.png',
    ]
  },
  qq: {
    title: 'QQ人',
    price: 'NT$300',
    images: [
      'images/qq1.png',
      'images/qq2.png',
  
    ]
  },
  furball: {
    title: '毛球',
    price: 'NT$250',
    images: [
      'images/dragon.png',
      'images/eat1.png',
      'images/anm3.png',
      'images/anm1.png',
      'images/anm2.png',
    ]
  }
};

let currentGalleryImages = [];
let currentLightboxIndex = 0;

function openGallery(categoryKey) {
  const data = galleryData[categoryKey];
  if (!data) return;

  document.getElementById('galleryTitle').textContent = data.title;
  document.getElementById('galleryPrice').textContent = data.price;

  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  data.images.forEach((src, idx) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.onclick = () => openLightbox(data.images, idx);
    // 圖片載入失敗時顯示占位符號，不會整頁壞掉
    item.innerHTML = `<img src="${src}" alt="${data.title} 範例 ${idx + 1}"
      onerror="this.style.display='none'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.innerHTML='<span style=\\'font-size:32px;color:rgba(201,169,110,0.3);font-family:Jost,sans-serif;\\'>✦</span>';">`;
    grid.appendChild(item);
  });

  document.getElementById('galleryModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  document.getElementById('galleryModal').classList.remove('open');
  document.body.style.overflow = '';
}

function openLightbox(images, index) {
  currentGalleryImages = images;
  currentLightboxIndex = index;
  updateLightboxImage();
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

function navLightbox(direction) {
  currentLightboxIndex = (currentLightboxIndex + direction + currentGalleryImages.length) % currentGalleryImages.length;
  updateLightboxImage();
}

function updateLightboxImage() {
  const img = document.getElementById('lightboxImg');
  img.style.transition = 'opacity 0.15s ease';
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = currentGalleryImages[currentLightboxIndex];
    img.style.opacity = '1';
  }, 150);
  document.getElementById('lightboxCounter').textContent =
    (currentLightboxIndex + 1) + ' / ' + currentGalleryImages.length;
}

// 點擊彈窗背景（非內容區）時關閉
document.getElementById('galleryModal').addEventListener('click', (e) => {
  if (e.target.id === 'galleryModal') closeGallery();
});
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') closeLightbox();
});

// 鍵盤操作：ESC 關閉，左右鍵切換圖片
document.addEventListener('keydown', (e) => {
  if (document.getElementById('lightbox').classList.contains('open')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  } else if (document.getElementById('galleryModal').classList.contains('open')) {
    if (e.key === 'Escape') closeGallery();
  }
});

/* ────────────────────────────────────────────────────────
   Email 連結備援機制
   原因：mailto: 連結只有在電腦/手機設定了「預設郵件 App」
   （例如 Outlook、Mail App）時才會自動開啟。
   很多人是用瀏覽器開 Gmail，沒有設定預設郵件 App，
   點擊後會「看起來」沒反應。
   這段程式碼會在點擊時，同時把信箱複製到剪貼簿，
   並顯示提示文字，這樣即使沒跳出郵件視窗，
   使用者也能直接貼上信箱寄信。
   ──────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
  link.addEventListener('click', function () {
    const email = this.href.replace('mailto:', '').split('?')[0];
    navigator.clipboard?.writeText(email).then(() => {
      const toast = document.createElement('div');
      toast.textContent = '已複製信箱：' + email;
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e1e18;color:#e2c898;border:1px solid #7a6340;padding:10px 20px;border-radius:4px;font-size:13px;z-index:999;font-family:"Noto Sans TC",sans-serif;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }).catch(() => {});
  });
});

/* ────────────────────────────────────────────────────────
   手機版三條橫線 (hamburger) 選單
   視窗縮小到 700px 以下時，導覽列文字會隱藏，
   改成右上角的漢堡選單按鈕，點擊後展開下拉選單。
   ──────────────────────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

// 點擊選單裡的任一連結後，自動收起選單
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ────────────────────────────────────────────────────────
   防止圖片被輕易下載
   - 擋右鍵選單：避免「另存圖片」選項出現
   - 擋拖曳：避免把圖片拖到桌面儲存
   注意：這只能擋掉最常見的存圖方式，無法防止
   截圖、開發者工具等進階手段。圖庫裡的圖片是動態
   產生的，所以這裡用「事件委派」綁在 document 上，
   這樣新產生的圖片也會自動套用，不用額外處理。
   ──────────────────────────────────────────────────────── */
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.portfolio-card') ||
      e.target.closest('.gallery-item') ||
      e.target.closest('.lightbox')) {
    e.preventDefault();
  }
});

document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
  }
});

/* ────────────────────────────────────────────────────────
   以下為新增的動效強化，完全不動原本的文字/結構，
   只針對互動手感做補強。
   ──────────────────────────────────────────────────────── */

/* 捲動進場：各區塊內容依序淡入上移 */
const revealTargets = document.querySelectorAll(
  '.eyebrow, .section-title, .section-sub, .guide-card, .timeline-card, .step, .price-row, .payment-row, .portfolio-card, .social-item, .price-toggle, .price-disclaimer, .contact-note'
);
revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = (i % 6) * 0.06 + 's';
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
revealTargets.forEach(el => revealObserver.observe(el));

/* 磁吸按鈕：查看價目表 / 委託前須知 / 查看作品範例 / 聯絡我 等金色與外框按鈕 */
document.querySelectorAll('.btn-gold, .btn-outline').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
});

/* 作品卡片：滑鼠移動時做輕微 3D 傾斜，取代原本單純的上移 */
document.querySelectorAll('.portfolio-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${py * -8}deg) rotateY(${px * 8}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* 委託須知卡片 / 製作時間卡片 / 付款方式列：滑鼠移動時泛出一圈金色柔光 */
document.querySelectorAll('.guide-card, .timeline-card, .payment-row').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.background = `radial-gradient(220px circle at ${x}px ${y}px, rgba(201,169,110,0.09), var(--bg-card) 65%)`;
  });
  card.addEventListener('mouseleave', () => { card.style.background = 'var(--bg-card)'; });
});

/* ════════════════════════════════════════════════════════
   隱藏後台邏輯（只有你自己知道怎麼進來）
   ────────────────────────────────────────────────────────
   使用前，把下面兩個值換成你 Supabase 專案的設定：
   Supabase 後台 → Project Settings → API
   → Project URL 貼到 SUPABASE_URL
   → anon public key 貼到 SUPABASE_ANON_KEY
   （anon key 是設計來放在前端的，不是密碼，安全）
   ════════════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://vjohtmslqwafccjjjpzqq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LakOr2FuYGqCLUL3JhzuFQ_pKbo5vG8';
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_LABELS = { qchibi: 'Q版人物', halfbody: '半身Q版人物', qq: 'QQ人', furball: '毛球' };

/* 入口：連續點擊 Logo 7 下（3 秒內），別的地方完全沒有入口 */
let logoClicks = 0, logoClickTimer = null;
document.querySelector('.nav-logo').addEventListener('click', (e) => {
  logoClicks++;
  clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => { logoClicks = 0; }, 3000);
  if (logoClicks >= 7) {
    logoClicks = 0;
    e.preventDefault();
    openAdminEntry();
  }
});

async function openAdminEntry() {
  const { data: { session } } = await supa.auth.getSession();
  if (session) {
    showAdminPanel();
  } else {
    document.getElementById('adminOverlay').classList.add('open');
    document.getElementById('adminEmail').focus();
  }
}

document.getElementById('adminCloseBtn').addEventListener('click', () => {
  document.getElementById('adminOverlay').classList.remove('open');
});
document.getElementById('adminOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'adminOverlay') document.getElementById('adminOverlay').classList.remove('open');
});

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const errEl = document.getElementById('adminError');
  errEl.textContent = '登入中…';
  const { error } = await supa.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = '登入失敗，請確認帳號密碼';
  } else {
    errEl.textContent = '';
    document.getElementById('adminOverlay').classList.remove('open');
    document.getElementById('adminLoginForm').reset();
    showAdminPanel();
  }
});

document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
  await supa.auth.signOut();
  document.getElementById('adminPanel').classList.remove('open');
});
document.getElementById('adminPanelClose').addEventListener('click', () => {
  document.getElementById('adminPanel').classList.remove('open');
});

function showAdminPanel() {
  document.getElementById('adminPanel').classList.add('open');
  loadAdminItems();
}

document.getElementById('adminUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById('adminUploadStatus');
  const category = document.getElementById('adminCategory').value;
  const fileInput = document.getElementById('adminFile');
  const file = fileInput.files[0];
  if (!file) return;
  statusEl.textContent = '上傳中…';
  const path = `${category}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supa.storage.from('artworks').upload(path, file);
  if (upErr) { statusEl.textContent = '上傳失敗：' + upErr.message; return; }
  const { data: urlData } = supa.storage.from('artworks').getPublicUrl(path);
  const { error: insErr } = await supa.from('artworks').insert({
    category, image_url: urlData.publicUrl, storage_path: path
  });
  if (insErr) { statusEl.textContent = '存檔失敗：' + insErr.message; return; }
  statusEl.textContent = '已新增，訪客現在就看得到！';
  fileInput.value = '';
  loadAdminItems();
});

async function loadAdminItems() {
  const list = document.getElementById('adminItemList');
  list.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">載入中…</p>';
  const { data, error } = await supa.from('artworks').select('*').order('created_at', { ascending: false });
  if (error) { list.innerHTML = '<p style="color:#d16a6a;font-size:12px;">讀取失敗</p>'; return; }
  list.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-item-row';
    const img = document.createElement('img');
    img.src = item.image_url;
    const label = document.createElement('span');
    label.textContent = CATEGORY_LABELS[item.category] || item.category;
    const delBtn = document.createElement('button');
    delBtn.className = 'admin-del-btn';
    delBtn.textContent = '刪除';
    delBtn.addEventListener('click', async () => {
      await supa.storage.from('artworks').remove([item.storage_path]);
      await supa.from('artworks').delete().eq('id', item.id);
      loadAdminItems();
    });
    row.append(img, label, delBtn);
    list.appendChild(row);
  });
}

/* ────────────────────────────────────────────────────────
   一鍵搬遷：把 images/ 資料夾裡原本寫死在 galleryData 的舊圖，
   逐一上傳到 Supabase Storage + 寫進 artworks 資料表。
   可以放心重複按：已經搬過的圖片（用 storage_path 判斷）會自動跳過，
   不會重複上傳、也不會在作品牆上出現兩次。
   ──────────────────────────────────────────────────────── */
document.getElementById('adminMigrateBtn').addEventListener('click', async () => {
  const btn = document.getElementById('adminMigrateBtn');
  const statusEl = document.getElementById('adminMigrateStatus');
  btn.disabled = true;

  const jobs = [];
  Object.entries(galleryData).forEach(([category, info]) => {
    info.images.forEach(src => jobs.push({ category, src }));
  });

  let migrated = 0, skipped = 0, failed = 0;
  for (let i = 0; i < jobs.length; i++) {
    const { category, src } = jobs[i];
    statusEl.textContent = `搬遷中… ${i + 1}/${jobs.length}`;
    try {
      const filename = src.split('/').pop();
      const storagePath = `${category}/${filename}`;

      const { data: existing } = await supa.from('artworks')
        .select('id').eq('storage_path', storagePath).limit(1);
      if (existing && existing.length) { skipped++; continue; }

      const res = await fetch(src);
      const blob = await res.blob();

      const { error: upErr } = await supa.storage.from('artworks')
        .upload(storagePath, blob, { upsert: true });
      if (upErr) { failed++; continue; }

      const { data: urlData } = supa.storage.from('artworks').getPublicUrl(storagePath);
      const { error: insErr } = await supa.from('artworks').insert({
        category, image_url: urlData.publicUrl, storage_path: storagePath
      });
      if (insErr) { failed++; continue; }

      migrated++;
    } catch (err) {
      failed++;
    }
  }

  statusEl.textContent = `完成：新搬 ${migrated} 張、已存在跳過 ${skipped} 張、失敗 ${failed} 張。`;
  btn.disabled = false;
  loadAdminItems();
});

/* 前台圖庫：打開分類圖庫時，把後台新增的圖片一起併進去，
   訪客只會看到作品變多了，完全看不到後台入口 */
const _originalOpenGallery = openGallery;
openGallery = function (categoryKey) {
  _originalOpenGallery(categoryKey);
  supa.from('artworks').select('image_url').eq('category', categoryKey)
    .order('created_at', { ascending: false })
    .then(({ data }) => {
      if (!data || !data.length) return;
      const grid = document.getElementById('galleryGrid');
      data.forEach((row) => {
        currentGalleryImages.push(row.image_url);
        const idx = currentGalleryImages.length - 1;
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => openLightbox(currentGalleryImages, idx);
        item.innerHTML = `<img src="${row.image_url}" alt="">`;
        grid.appendChild(item);
      });
    });
};
