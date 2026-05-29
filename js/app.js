/* ==================================================================
   DK日常开销 v1.0 - 完整应用逻辑
   ================================================================== */

// ==================== 分类数据 ====================
const CATEGORIES = [
  { name: '餐饮', icon: '🍜', subs: ['早餐', '午餐', '晚餐', '奶茶咖啡', '水果生鲜'] },
  { name: '交通', icon: '🚗', subs: ['公交地铁', '打车', '加油', '停车费', '车险保养'] },
  { name: '购物', icon: '🛍️', subs: ['日用百货', '衣服鞋包', '数码产品', '家居', '美妆护肤'] },
  { name: '居住', icon: '🏠', subs: ['租房/房贷', '水电燃气', '物业费', '网费话费'] },
  { name: '娱乐', icon: '🎮', subs: ['电影演出', '游戏', '运动健身', '旅游出行'] },
  { name: '医疗', icon: '💊', subs: ['看病买药', '体检'] },
  { name: '学习', icon: '📚', subs: ['买书', '课程培训'] },
  { name: '人情', icon: '💌', subs: ['红包送礼', '聚餐请客'] },
  { name: '其他', icon: '📦', subs: ['其他支出'] },
];

const CHART_COLORS = [
  '#FF6B35', '#FF8C42', '#FFB088', '#FFD4B8',
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
  '#85C1E9', '#F0B27A', '#82E0AA'
];

// ==================== 状态 ====================
const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  records: [],
  settings: { monthlyBudget: 5000 },
};

// ==================== DOM 引用 ====================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const dom = {};

function cacheDom() {
  dom.pages = $$('.page');
  dom.homePage = $('#page-home');
  dom.statsPage = $('#page-stats');
  dom.settingsPage = $('#page-settings');

  dom.tabs = $$('.tab-item');
  dom.tabAdd = $('.tab-add');

  dom.monthYear = $('#month-year');
  dom.monthPrev = $('#month-prev');
  dom.monthNext = $('#month-next');
  dom.summaryAmount = $('#summary-amount');
  dom.summaryCount = $('#summary-count');
  dom.summaryDaily = $('#summary-daily');
  dom.budgetFill = $('#budget-fill');
  dom.budgetUsed = $('#budget-used');
  dom.budgetTotal = $('#budget-total');
  dom.recordList = $('#record-list');

  dom.addOverlay = $('#add-overlay');
  dom.addClose = $('#add-close');
  dom.addSave = $('#add-save');
  dom.amountText = $('#amount-text');
  dom.numKeyboard = $('#num-keyboard');
  dom.categoryGrid = $('#category-grid');
  dom.subcatRow = $('#subcat-row');
  dom.addDate = $('#add-date');
  dom.addNote = $('#add-note');

  dom.statsMonth = $('#stats-month');
  dom.statsPrev = $('#stats-prev');
  dom.statsNext = $('#stats-next');
  dom.statsTotal = $('#stats-total');
  dom.statsAvg = $('#stats-avg');
  dom.pieChart = $('#pie-chart');
  dom.lineChart = $('#line-chart');
  dom.legendList = $('#legend-list');

  dom.budgetInput = $('#budget-input');
  dom.exportBtn = $('#export-btn');
  dom.clearBtn = $('#clear-btn');

  dom.toast = $('#toast');
  dom.modal = $('#modal-overlay');
  dom.modalTitle = $('#modal-title');
  dom.modalText = $('#modal-text');
  dom.modalCancel = $('#modal-cancel');
  dom.modalConfirm = $('#modal-confirm');

  dom.homeNav = $('#home-nav');
  dom.pageTitle = $('#page-title');
}

// ==================== 工具函数 ====================
function formatMoney(n) {
  return Number(n).toFixed(2);
}

function getWeekday(dateStr) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date(dateStr).getDay()];
}

function isToday(dateStr) {
  const t = new Date();
  const d = new Date(dateStr);
  return t.getFullYear() === d.getFullYear() &&
         t.getMonth() === d.getMonth() &&
         t.getDate() === d.getDate();
}

function isYesterday(dateStr) {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  const d = new Date(dateStr);
  return t.getFullYear() === d.getFullYear() &&
         t.getMonth() === d.getMonth() &&
         t.getDate() === d.getDate();
}

function formatDateLabel(dateStr) {
  if (isToday(dateStr)) return '今天';
  if (isYesterday(dateStr)) return '昨天';
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ==================== 数据管理 ====================
function loadData() {
  try {
    const r = localStorage.getItem('dk_records');
    state.records = r ? JSON.parse(r) : [];
    const s = localStorage.getItem('dk_settings');
    state.settings = s ? JSON.parse(s) : { monthlyBudget: 5000 };
  } catch (e) {
    state.records = [];
    state.settings = { monthlyBudget: 5000 };
  }
}

function saveRecords() {
  try {
    localStorage.setItem('dk_records', JSON.stringify(state.records));
  } catch (e) {
    showToast('存储空间不足');
  }
}

function saveSettings() {
  try {
    localStorage.setItem('dk_settings', JSON.stringify(state.settings));
  } catch (e) {
    showToast('存储失败');
  }
}

function addRecord(data) {
  const record = {
    id: generateId(),
    amount: data.amount,
    category: data.category,
    subCategory: data.subCategory,
    date: data.date,
    note: data.note || '',
    createdAt: Date.now(),
  };
  state.records.push(record);
  saveRecords();
  return record;
}

function deleteRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
  saveRecords();
}

function getMonthRecords(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return state.records
    .filter(r => r.date.startsWith(prefix))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

function groupByDate(records) {
  const map = {};
  records.forEach(r => {
    if (!map[r.date]) map[r.date] = [];
    map[r.date].push(r);
  });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

// ==================== Toast / 弹窗 ====================
let toastTimer = null;

function showToast(msg) {
  clearTimeout(toastTimer);
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 1800);
}

function showModal(title, text, onConfirm) {
  dom.modalTitle.textContent = title;
  dom.modalText.textContent = text;
  dom.modal.classList.add('show');
  dom.modalConfirm.onclick = () => {
    dom.modal.classList.remove('show');
    if (onConfirm) onConfirm();
  };
  dom.modalCancel.onclick = () => dom.modal.classList.remove('show');
}

// ==================== 页面切换 ====================
function switchPage(page) {
  dom.pages.forEach(p => p.classList.remove('active'));
  dom.tabs.forEach(t => t.classList.remove('active'));

  if (page === 'home') {
    dom.homePage.classList.add('active');
    dom.tabs[0].classList.add('active');
    dom.homeNav.style.display = 'flex';
    dom.pageTitle.style.display = 'none';
    renderHome();
  } else if (page === 'stats') {
    dom.statsPage.classList.add('active');
    dom.tabs[1].classList.add('active');
    dom.homeNav.style.display = 'none';
    dom.pageTitle.style.display = 'none';
    renderStats();
  } else if (page === 'settings') {
    dom.settingsPage.classList.add('active');
    dom.tabs[2].classList.add('active');
    dom.homeNav.style.display = 'none';
    dom.pageTitle.style.display = 'block';
    renderSettings();
  }
}

// ==================== 首页渲染 ====================
function renderHome() {
  const { year, month } = state;
  dom.monthYear.textContent = `${year}年${month}月`;

  const records = getMonthRecords(year, month);
  const total = records.reduce((s, r) => s + r.amount, 0);
  const daySet = new Set(records.map(r => r.date));
  const daily = daySet.size > 0 ? total / daySet.size : 0;

  dom.summaryAmount.textContent = formatMoney(total);
  dom.summaryCount.textContent = `${records.length}笔`;
  dom.summaryDaily.textContent = `¥${formatMoney(daily)}`;

  // 预算
  const budget = state.settings.monthlyBudget || 5000;
  const pct = budget > 0 ? Math.min(total / budget * 100, 100) : 0;
  dom.budgetFill.style.width = pct + '%';
  dom.budgetFill.className = 'budget-fill' + (pct >= 100 ? ' danger' : pct >= 80 ? ' warning' : '');
  dom.budgetUsed.textContent = `¥${formatMoney(total)}`;
  dom.budgetTotal.textContent = `/ ¥${formatMoney(budget)}`;

  // 列表
  if (records.length === 0) {
    dom.recordList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">还没有记录</div>
        <div class="empty-hint">点击下方 + 按钮记一笔吧</div>
      </div>`;
    return;
  }

  const groups = groupByDate(records);
  let html = '';
  groups.forEach(([date, items]) => {
    const label = formatDateLabel(date);
    const wd = getWeekday(date);
    const dateStr = isToday(date) || isYesterday(date) ? '' : ` ${date}`;
    html += `<div class="date-group">
      <div class="date-label">${label}<span class="weekday">${dateStr}</span></div>`;
    items.forEach(item => {
      const cat = CATEGORIES.find(c => c.name === item.category);
      const icon = cat ? cat.icon : '📦';
      html += `
        <div class="record-item-wrap" data-id="${item.id}">
          <div class="record-item"
            ontouchstart="Swipe.onTouchStart(event)"
            ontouchmove="Swipe.onTouchMove(event)"
            ontouchend="Swipe.onTouchEnd(event)">
            <div class="record-icon">${icon}</div>
            <div class="record-info">
              <div class="record-category">${item.subCategory}</div>
              ${item.note ? `<div class="record-note">${item.note}</div>` : ''}
            </div>
            <div class="record-amount">¥${formatMoney(item.amount)}</div>
          </div>
          <button class="delete-btn" onclick="Swipe.onDelete('${item.id}')">删除</button>
        </div>`;
    });
    html += '</div>';
  });
  dom.recordList.innerHTML = html;
}

// ==================== 滑动删除 ====================
const Swipe = {
  startX: 0,
  currentEl: null,

  onTouchStart(e) {
    this.startX = e.touches[0].clientX;
    this.currentEl = e.currentTarget.closest('.record-item-wrap');
    document.querySelectorAll('.record-item-wrap.show-delete').forEach(el => {
      if (el !== this.currentEl) el.classList.remove('show-delete');
    });
  },

  onTouchMove(e) {
    if (!this.currentEl) return;
    const dx = this.startX - e.touches[0].clientX;
    if (dx > 40) {
      this.currentEl.classList.add('show-delete');
    } else if (dx < 10) {
      this.currentEl.classList.remove('show-delete');
    }
  },

  onTouchEnd() {
    this.currentEl = null;
  },

  onDelete(id) {
    showModal('删除记录', '确定要删除这条记录吗？', () => {
      deleteRecord(id);
      renderHome();
      showToast('已删除');
    });
  }
};

// ==================== 新增记录 ====================
const AddState = {
  amount: '',
  category: null,
  subCategory: null,
};

function resetAddForm() {
  AddState.amount = '';
  AddState.category = null;
  AddState.subCategory = null;
  dom.amountText.innerHTML = '<span class="amount-currency">¥</span><span class="amount-placeholder">0.00</span>';
  dom.addDate.value = new Date().toISOString().slice(0, 10);
  dom.addNote.value = '';
  dom.addSave.disabled = true;
  renderCategoryGrid();
  dom.subcatRow.innerHTML = '<span style="color:var(--text-light);font-size:13px;">请先选择分类</span>';
}

function openAdd() {
  resetAddForm();
  dom.addOverlay.classList.add('show');
}

function closeAdd() {
  dom.addOverlay.classList.remove('show');
}

function updateAddButton() {
  const hasAmount = AddState.amount && parseFloat(AddState.amount) > 0;
  const hasSub = AddState.subCategory !== null;
  dom.addSave.disabled = !(hasAmount && hasSub);
}

function updateAmountDisplay() {
  const val = AddState.amount || '0';
  if (val === '0') {
    dom.amountText.innerHTML = '<span class="amount-currency">¥</span><span class="amount-placeholder">0.00</span>';
    return;
  }
  const num = parseFloat(val);
  dom.amountText.innerHTML = `<span class="amount-currency">¥</span>${formatMoney(num)}`;
}

function onNumKey(key) {
  if (key === 'delete') {
    AddState.amount = AddState.amount.slice(0, -1);
  } else if (key === '.') {
    if (!AddState.amount.includes('.')) {
      AddState.amount += '.';
    }
  } else {
    const cur = AddState.amount;
    if (cur.includes('.')) {
      const dec = cur.split('.')[1];
      if (dec.length >= 2) return;
    }
    const test = cur + key;
    if (parseFloat(test) > 9999999) return;
    AddState.amount = test;
  }
  updateAmountDisplay();
  updateAddButton();
}

function renderCategoryGrid() {
  let html = '';
  CATEGORIES.forEach(cat => {
    const sel = AddState.category === cat.name ? ' selected' : '';
    html += `<button class="cat-btn${sel}" data-cat="${cat.name}">
      <span class="cat-icon">${cat.icon}</span>
      <span class="cat-name">${cat.name}</span>
    </button>`;
  });
  dom.categoryGrid.innerHTML = html;
}

function renderSubcategories(catName) {
  const cat = CATEGORIES.find(c => c.name === catName);
  if (!cat) {
    dom.subcatRow.innerHTML = '<span style="color:var(--text-light);font-size:13px;">请先选择分类</span>';
    return;
  }
  let html = '';
  cat.subs.forEach(sub => {
    const sel = AddState.subCategory === sub ? ' selected' : '';
    html += `<button class="subcat-btn${sel}" data-sub="${sub}">${sub}</button>`;
  });
  dom.subcatRow.innerHTML = html;
}

function onSave() {
  const amount = parseFloat(AddState.amount);
  if (!amount || amount <= 0) { showToast('请输入金额'); return; }
  if (!AddState.category) { showToast('请选择分类'); return; }
  if (!AddState.subCategory) { showToast('请选择具体类别'); return; }

  addRecord({
    amount: Math.round(amount * 100) / 100,
    category: AddState.category,
    subCategory: AddState.subCategory,
    date: dom.addDate.value,
    note: dom.addNote.value.trim(),
  });

  closeAdd();
  if (state.currentPage === 'home') renderHome();
  showToast('已记录 ✓');
}

// ==================== 月份切换 ====================
function prevMonth() {
  state.month--;
  if (state.month < 1) { state.month = 12; state.year--; }
  renderHome();
}

function nextMonth() {
  state.month++;
  if (state.month > 12) { state.month = 1; state.year++; }
  renderHome();
}

// ==================== 统计页 ====================
let pieChartInstance = null;
let lineChartInstance = null;

function renderStats() {
  const { year, month } = state;
  dom.statsMonth.textContent = `${year}年${month}月`;

  const records = getMonthRecords(year, month);
  const total = records.reduce((s, r) => s + r.amount, 0);
  const daySet = new Set(records.map(r => r.date));
  const daysInMonth = getDaysInMonth(year, month);

  dom.statsTotal.textContent = `¥${formatMoney(total)}`;
  dom.statsAvg.textContent = `¥${formatMoney(daySet.size > 0 ? total / daySet.size : 0)}`;

  if (records.length === 0) {
    dom.legendList.innerHTML = '<div style="color:var(--text-light);text-align:center;padding:20px 0;">本月暂无数据</div>';
    if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
    if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null; }
    return;
  }

  // ---- 分类汇总 ----
  const catMap = {};
  records.forEach(r => {
    catMap[r.category] = (catMap[r.category] || 0) + r.amount;
  });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  // 图例
  let legendHtml = '';
  catEntries.forEach(([name, amt], i) => {
    const pct = total > 0 ? (amt / total * 100) : 0;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    legendHtml += `<div class="legend-item">
      <span class="legend-dot" style="background:${color}"></span>
      ${name} ${pct.toFixed(1)}%
      <span class="legend-amount">¥${formatMoney(amt)}</span>
    </div>`;
  });
  dom.legendList.innerHTML = legendHtml;

  // 饼图
  if (pieChartInstance) { pieChartInstance.destroy(); }
  pieChartInstance = new Chart(dom.pieChart, {
    type: 'doughnut',
    data: {
      labels: catEntries.map(e => e[0]),
      datasets: [{
        data: catEntries.map(e => e[1]),
        backgroundColor: CHART_COLORS.slice(0, catEntries.length),
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw;
              const pct = ((val / total) * 100).toFixed(1);
              return ` ${ctx.label}: ¥${formatMoney(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // ---- 每日趋势折线图 ----
  if (lineChartInstance) { lineChartInstance.destroy(); }
  const dayTotals = {};
  records.forEach(r => {
    const d = parseInt(r.date.split('-')[2]);
    dayTotals[d] = (dayTotals[d] || 0) + r.amount;
  });
  const labels = [];
  const values = [];
  for (let d = 1; d <= daysInMonth; d++) {
    labels.push(d + '日');
    values.push(dayTotals[d] || 0);
  }

  lineChartInstance = new Chart(dom.lineChart, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '每日支出',
        data: values,
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255,107,53,0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#FF6B35',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ¥${formatMoney(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#AEAEB2', maxTicksLimit: 10 }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { size: 10 },
            color: '#AEAEB2',
            callback: (v) => '¥' + v
          }
        }
      }
    }
  });
}

function statsPrevMonth() {
  state.month--;
  if (state.month < 1) { state.month = 12; state.year--; }
  renderStats();
}

function statsNextMonth() {
  state.month++;
  if (state.month > 12) { state.month = 1; state.year++; }
  renderStats();
}

// ==================== 设置页 ====================
function renderSettings() {
  dom.budgetInput.value = state.settings.monthlyBudget || '';
}

function saveBudget() {
  const val = parseFloat(dom.budgetInput.value);
  if (val && val > 0) {
    state.settings.monthlyBudget = val;
    saveSettings();
    showToast('预算已保存');
  } else {
    dom.budgetInput.value = state.settings.monthlyBudget || '';
    showToast('请输入有效金额');
  }
}

function exportData() {
  if (state.records.length === 0) {
    showToast('暂无数据可导出');
    return;
  }

  let csv = '﻿日期,分类,子类,金额,备注\n';
  const sorted = [...state.records].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt
  );
  sorted.forEach(r => {
    const note = r.note ? `"${r.note.replace(/"/g, '""')}"` : '';
    csv += `${r.date},${r.category},${r.subCategory},${r.amount},${note}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DK开销_${state.year}年${state.month}月.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('导出成功');
}

function clearAllData() {
  if (state.records.length === 0) {
    showToast('暂无数据');
    return;
  }
  showModal('清空所有数据', '确定要删除全部记录吗？此操作不可恢复！', () => {
    state.records = [];
    saveRecords();
    renderHome();
    showToast('已清空');
  });
}

// ==================== 绑定事件 ====================
function bindEvents() {
  // Tab 切换
  dom.tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      if (i === 0) switchPage('home');
      else if (i === 1) switchPage('stats');
      else if (i === 2) switchPage('settings');
    });
  });

  // 新增按钮
  dom.tabAdd.addEventListener('click', openAdd);
  dom.addClose.addEventListener('click', closeAdd);

  // 数字键盘
  dom.numKeyboard.addEventListener('click', (e) => {
    const btn = e.target.closest('.num-key');
    if (!btn) return;
    onNumKey(btn.dataset.key);
  });

  // 分类选择（事件委托）
  dom.categoryGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    const catName = btn.dataset.cat;
    if (AddState.category === catName) {
      AddState.category = null;
      AddState.subCategory = null;
    } else {
      AddState.category = catName;
      AddState.subCategory = null;
    }
    renderCategoryGrid();
    renderSubcategories(AddState.category);
    updateAddButton();
  });

  // 子类选择（事件委托）
  dom.subcatRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.subcat-btn');
    if (!btn) return;
    AddState.subCategory = btn.dataset.sub;
    dom.subcatRow.querySelectorAll('.subcat-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    updateAddButton();
  });

  // 保存
  dom.addSave.addEventListener('click', onSave);

  // 月份切换
  dom.monthPrev.addEventListener('click', prevMonth);
  dom.monthNext.addEventListener('click', nextMonth);
  dom.statsPrev.addEventListener('click', statsPrevMonth);
  dom.statsNext.addEventListener('click', statsNextMonth);

  // 设置 - 预算
  dom.budgetInput.addEventListener('change', saveBudget);

  // 设置 - 导出
  dom.exportBtn.addEventListener('click', exportData);

  // 设置 - 清空
  dom.clearBtn.addEventListener('click', clearAllData);

  // 弹窗背景关闭
  dom.modal.addEventListener('click', (e) => {
    if (e.target === dom.modal) dom.modal.classList.remove('show');
  });
}

// ==================== Service Worker ====================
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ==================== 初始化 ====================
function init() {
  cacheDom();
  loadData();
  registerSW();
  bindEvents();
  switchPage('home');
}

document.addEventListener('DOMContentLoaded', init);
