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
    images: []
  },
  halfbody: {
    title: '半身Q版人物',
    price: 'NT$350',
    images: []
  },
  qq: {
    title: 'QQ人',
    price: 'NT$300',
    images: []
  },
  furball: {
    title: '毛球',
    price: 'NT$250',
    images: []
  }
};

let currentGalleryImages = [];
let currentLightboxIndex = 0;

/* ────────────────────────────────────────────────────────
   依圖片實際長寬比例，決定它在格子裡要佔幾欄/幾列：
   橫圖佔多欄、直圖佔多列，圖片本身用 contain 完整顯示，
   不裁切也不變形，格子本身仍是規則的正方形基準單位。
   ──────────────────────────────────────────────────────── */
function computeGallerySpan(naturalWidth, naturalHeight, maxCols) {
  const ratio = naturalWidth / naturalHeight;
  if (ratio >= 1.15) {
    // 橫圖：越寬佔越多欄，最多佔滿一整排
    return { colSpan: Math.min(maxCols, Math.max(1, Math.round(ratio))), rowSpan: 1 };
  }
  if (ratio <= 0.87) {
    // 直圖：越長佔越多列，最多 3 列避免佔太滿
    return { colSpan: 1, rowSpan: Math.min(3, Math.max(1, Math.round(1 / ratio))) };
  }
  return { colSpan: 1, rowSpan: 1 };
}

function loadImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight, ok: true });
    img.onerror = () => resolve({ w: 1, h: 1, ok: false });
    img.src = src;
  });
}

/* 格子的正方形基準單位（--cell-size）用 JS 算，
   因為欄寬是 fr（響應式），列高只能用固定像素，
   所以量出目前一欄實際多寬，拿來當一列的高度，維持方格。 */
function updateGalleryCellSize() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return 3;
  const cols = window.innerWidth <= 700 ? 2 : 3;
  const gap = 14;
  const width = grid.clientWidth;
  if (width) {
    const cell = (width - gap * (cols - 1)) / cols;
    grid.style.setProperty('--cell-size', `${cell}px`);
  }
  return cols;
}
window.addEventListener('resize', () => { updateGalleryCellSize(); });

async function openGallery(categoryKey) {
  const data = galleryData[categoryKey];
  if (!data) return;

  document.getElementById('galleryTitle').textContent = data.title;
  document.getElementById('galleryPrice').textContent = data.price;

  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<p style="color:var(--text-muted);font-size:12px;grid-column:1/-1;">載入中…</p>';
  document.getElementById('galleryModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  const cols = updateGalleryCellSize();

  const { data: rows } = await supa.from('artworks').select('image_url')
    .eq('category', categoryKey).order('created_at', { ascending: false });
  const urls = (rows || []).map(r => r.image_url);

  if (!urls.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:12px;grid-column:1/-1;">目前還沒有範例圖，敬請期待</p>';
    currentGalleryImages = [];
    return;
  }

  const dims = await Promise.all(urls.map(loadImageDimensions));
  currentGalleryImages = urls;

  grid.innerHTML = '';
  urls.forEach((src, idx) => {
    const { w, h, ok } = dims[idx];
    const { colSpan, rowSpan } = ok ? computeGallerySpan(w, h, cols) : { colSpan: 1, rowSpan: 1 };
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.style.gridColumn = `span ${colSpan}`;
    item.style.gridRow = `span ${rowSpan}`;
    item.onclick = () => openLightbox(currentGalleryImages, idx);
    // 圖片載入失敗時顯示占位符號，不會整頁壞掉
    item.innerHTML = `<img src="${src}" alt="${data.title} 範例 ${idx + 1}"
      onerror="this.style.display='none'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.innerHTML='<span style=\\'font-size:32px;color:rgba(201,169,110,0.3);font-family:Jost,sans-serif;\\'>✦</span>';">`;
    grid.appendChild(item);
  });
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
const SUPABASE_URL = 'https://vjohtmslqwafccjjpzqq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LakOr2FuYGqCLUL3JhzuFQ_pKbo5vG8';
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_LABELS = { qchibi: 'Q版人物', halfbody: '半身Q版人物', qq: 'QQ人', furball: '毛球' };

/* Supabase Storage 的檔名（key）只允許英數字、句點、底線、連字號，
   中文、空白、特殊符號會直接被拒絕，回傳「Invalid key」錯誤。
   這裡把檔名清乾淨，中文字元一律拿掉，副檔名保留。 */
function sanitizeFileName(name) {
  const dotIdx = name.lastIndexOf('.');
  const ext = dotIdx > -1 ? name.slice(dotIdx + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const base = (dotIdx > -1 ? name.slice(0, dotIdx) : name)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const safeBase = base || 'file';
  return ext ? `${safeBase}.${ext}` : safeBase;
}

/* ────────────────────────────────────────────────────────
   首頁卡片封面圖：優先抓後台手動標記「設為預覽圖」(is_cover=true) 的那張，
   如果該分類還沒手動指定過，就自動退回抓最新一張。
   對應 index.html 裡的 <img id="cover-xxx">。
   ──────────────────────────────────────────────────────── */
Object.keys(CATEGORY_LABELS).forEach((category) => { fetchCategoryCover(category); });

async function fetchCategoryCover(category) {
  const img = document.getElementById(`cover-${category}`);
  if (!img) return;
  let { data } = await supa.from('artworks').select('image_url')
    .eq('category', category).eq('is_cover', true).limit(1);
  if (!data || !data.length) {
    const fallback = await supa.from('artworks').select('image_url')
      .eq('category', category).order('created_at', { ascending: false }).limit(1);
    data = fallback.data;
  }
  if (!data || !data.length) return;
  img.src = data[0].image_url;
}

/* ────────────────────────────────────────────────────────
   首頁大頭貼：從 Supabase 抓最新一張 category='avatar' 的圖，
   對應 index.html 裡的 <img id="heroAvatar">。
   ──────────────────────────────────────────────────────── */
supa.from('artworks').select('image_url').eq('category', 'avatar')
  .order('created_at', { ascending: false }).limit(1)
  .then(({ data }) => {
    if (!data || !data.length) return;
    const img = document.getElementById('heroAvatar');
    if (img) img.src = data[0].image_url;
  });
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
  document.getElementById('adminReopenBtn').classList.remove('show');
});
document.getElementById('adminPanelClose').addEventListener('click', () => {
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('adminReopenBtn').classList.add('show');
});
document.getElementById('adminReopenBtn').addEventListener('click', () => {
  document.getElementById('adminPanel').classList.add('open');
  document.getElementById('adminReopenBtn').classList.remove('show');
});

function showAdminPanel() {
  document.getElementById('adminPanel').classList.add('open');
  document.getElementById('adminReopenBtn').classList.remove('show');
  loadAdminItems();
  loadAdminAvatarPreview();
}

/* ────────────────────────────────────────────────────────
   大頭貼管理：上傳新圖時，先清掉舊的 avatar 紀錄（storage + 資料表），
   再存新的一筆，確保 category='avatar' 永遠只有一張是「目前生效」的。
   ──────────────────────────────────────────────────────── */
async function loadAdminAvatarPreview() {
  const preview = document.getElementById('adminAvatarPreview');
  const { data } = await supa.from('artworks').select('image_url')
    .eq('category', 'avatar').order('created_at', { ascending: false }).limit(1);
  if (data && data.length) preview.src = data[0].image_url;
}

document.getElementById('adminAvatarBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('adminAvatarStatus');
  const fileInput = document.getElementById('adminAvatarFile');
  const file = fileInput.files[0];
  if (!file) { statusEl.textContent = '請先選擇圖片'; return; }
  statusEl.textContent = '上傳中…';

  const { data: oldRows } = await supa.from('artworks').select('id, storage_path').eq('category', 'avatar');
  if (oldRows && oldRows.length) {
    const oldPaths = oldRows.map(r => r.storage_path).filter(Boolean);
    if (oldPaths.length) await supa.storage.from('artworks').remove(oldPaths);
    await supa.from('artworks').delete().eq('category', 'avatar');
  }

  const path = `avatar/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error: upErr } = await supa.storage.from('artworks').upload(path, file);
  if (upErr) { statusEl.textContent = '上傳失敗：' + upErr.message; return; }
  const { data: urlData } = supa.storage.from('artworks').getPublicUrl(path);
  const { error: insErr } = await supa.from('artworks').insert({
    category: 'avatar', image_url: urlData.publicUrl, storage_path: path
  });
  if (insErr) { statusEl.textContent = '存檔失敗：' + insErr.message; return; }

  statusEl.textContent = '已更新，訪客現在就看得到！';
  fileInput.value = '';
  document.getElementById('adminAvatarPreview').src = urlData.publicUrl;
  const heroImg = document.getElementById('heroAvatar');
  if (heroImg) heroImg.src = urlData.publicUrl;
});

document.getElementById('adminUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById('adminUploadStatus');
  const category = document.getElementById('adminCategory').value;
  const fileInput = document.getElementById('adminFile');
  const file = fileInput.files[0];
  if (!file) return;
  statusEl.textContent = '上傳中…';
  const path = `${category}/${Date.now()}-${sanitizeFileName(file.name)}`;
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

const CATEGORY_ORDER = ['qchibi', 'halfbody', 'qq', 'furball'];

async function loadAdminItems() {
  const list = document.getElementById('adminItemList');
  list.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">載入中…</p>';
  const { data, error } = await supa.from('artworks').select('*')
    .neq('category', 'avatar').order('created_at', { ascending: false });
  if (error) { list.innerHTML = '<p style="color:#d16a6a;font-size:12px;">讀取失敗</p>'; return; }
  list.innerHTML = '';

  // 依分類分組，順序固定用 CATEGORY_ORDER，未知分類排最後
  const groups = {};
  data.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });
  const orderedCategories = [
    ...CATEGORY_ORDER.filter(c => groups[c]),
    ...Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c))
  ];

  if (!orderedCategories.length) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">目前還沒有作品</p>';
    return;
  }

  orderedCategories.forEach(category => {
    const title = document.createElement('div');
    title.className = 'admin-item-group-title';
    title.textContent = `${CATEGORY_LABELS[category] || category}（${groups[category].length}）`;
    list.appendChild(title);

    groups[category].forEach(item => {
      const row = document.createElement('div');
      row.className = 'admin-item-row' + (item.is_cover ? ' is-cover' : '');
      const img = document.createElement('img');
      img.src = item.image_url;
      const label = document.createElement('span');
      label.textContent = CATEGORY_LABELS[item.category] || item.category;
      const coverBtn = document.createElement('button');
      if (item.is_cover) {
        coverBtn.className = 'admin-cover-btn is-active';
        coverBtn.textContent = '★ 預覽圖';
        coverBtn.disabled = true;
      } else {
        coverBtn.className = 'admin-cover-btn';
        coverBtn.textContent = '設為預覽圖';
        coverBtn.addEventListener('click', async () => {
          coverBtn.disabled = true;
          coverBtn.textContent = '設定中…';
          await supa.from('artworks').update({ is_cover: false })
            .eq('category', item.category).eq('is_cover', true);
          await supa.from('artworks').update({ is_cover: true }).eq('id', item.id);
          const coverImg = document.getElementById(`cover-${item.category}`);
          if (coverImg) coverImg.src = item.image_url;
          loadAdminItems();
        });
      }
      const delBtn = document.createElement('button');
      delBtn.className = 'admin-del-btn';
      delBtn.textContent = '刪除';
      delBtn.addEventListener('click', async () => {
        await supa.storage.from('artworks').remove([item.storage_path]);
        await supa.from('artworks').delete().eq('id', item.id);
        loadAdminItems();
      });
      row.append(img, label, coverBtn, delBtn);
      list.appendChild(row);
    });
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
