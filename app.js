/* app.js */
// بيانات المستخدمين والمعاملات والمراقب
let currentUser = null;
const users = JSON.parse(localStorage.getItem('users')) || [];
const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const candidates = [
    { id: 1, name: 'مرشح 1', votes: 0 },
    { id: 2, name: 'مرشح 2', votes: 0 },
    { id: 3, name: 'مرشح 3', votes: 0 }
];
const currencies = ['TRX','USDT','USDD','BTC','ETH','BNB','ADA'];
// تهيئة القوائم المنسدلة للعملات
function initCurrencySelects() {
    const sendSelect = document.getElementById('sendCurrency');
    const adminSelect = document.getElementById('adminCurrency');
    currencies.forEach(c => {
        sendSelect.add(new Option(c, c));
        adminSelect.add(new Option(c, c));
    });
}

// التنقل بين الصفحات
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    updateNavTabs(pageId);
    if(pageId === 'walletPage') updateWalletDisplay();
    if(pageId === 'transactionsPage') loadTransactions();
    if(pageId === 'profilePage') updateProfile();
    if(pageId === 'votePage') loadCandidates();
    if(pageId === 'adminPage') loadAdmin();
}
function updateNavTabs(activePage) {
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    const map = { walletPage:0, transactionsPage:1, votePage:2, profilePage:3 };
    document.querySelectorAll('.tab-item')[map[activePage]]?.classList.add('active');
}

// تسجيل وحساب المراقب
function register() {
    const user = {
        id: Date.now(),
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value,
        walletAddress: 'TRX' + Math.random().toString(36).substr(2,9).toUpperCase(),
        balance: currencies.reduce((acc,c) => (acc[c]=0,acc), {}),
        energy: 350,
        bandwidth: 500,
        transactions: [],
        notifications: []
    };
    user.balance.TRX = 1000;
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    alert('تم إنشاء الحساب بنجاح!');
    currentUser = user;
    showPage('walletPage');
}
function login() {
    const id = document.getElementById('loginId').value;
    const pw = document.getElementById('loginPassword').value;
    // تحقق من المراقب
    if(id === 'admin' && pw === '12345') {
        currentUser = {
            id: 'admin', name: 'المراقب', role: 'admin',
            walletAddress:'ADMIN', balance: {}, transactions: []
        };
        currencies.forEach(c => currentUser.balance[c]=10000);
        showPage('adminPage');
        return;
    }
    // مستخدم عادي
    currentUser = users.find(u => (u.email===id||u.phone===id||u.name===id) && u.password===pw);
    if(currentUser) {
        showPage('walletPage');
    } else alert('بيانات الدخول غير صحيحة');
}
function logout() {
    currentUser = null;
    showPage('loginPage');
}

// عرض المحفظة
function updateWalletDisplay() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('walletAddress').textContent = currentUser.walletAddress;
    const bal = currentUser.balance;
    document.getElementById('balanceTRX').textContent = bal.TRX + ' TRX';
    document.getElementById('balanceUSD').textContent = '$' + (bal.TRX*0.07).toFixed(2);
    // الأصول مع مؤشرات
    const list = document.getElementById('assetsList'); list.innerHTML='';
    currencies.forEach(c => {
        const up = Math.random()>0.5;
        list.innerHTML += `<div class="asset-item">`+
            `<span>${c}: ${bal[c]} <i class="fas fa-arrow-`+(up?'up':'down')+`"></i></span>`+
        `</div>`;
    });
}

// التحويلات
function sendFunds() {
    const recv = document.getElementById('receiverAddress').value;
    const amt = parseFloat(document.getElementById('sendAmount').value);
    const cur = document.getElementById('sendCurrency').value;
    if(!recv||!amt) return alert('املى الحقول');
    const receiver = users.find(u=>u.walletAddress===recv);
    if(!receiver) return alert('عنوان غير صحيح');
    if(currentUser.balance[cur]<amt) return alert('رصيد غير كافي');
    currentUser.balance[cur]-=amt; receiver.balance[cur]+=amt;
    const tx = { id:Date.now(),from:currentUser.walletAddress,to:recv,amount:amt,currency:cur,date:new Date().toISOString() };
    transactions.push(tx);
    currentUser.transactions.push(tx.id);
    receiver.transactions.push(tx.id);
    localStorage.setItem('users',JSON.stringify(users));
    localStorage.setItem('transactions',JSON.stringify(transactions));
    alert('تم الإرسال!'); showPage('walletPage');
}
function filterTransactions(f='all') { loadTransactions(f); }
function loadTransactions(filter='all') {
    const cont = document.getElementById('transactionsContainer'); cont.innerHTML='';
    transactions.filter(t=>
        (currentUser.transactions||[]).includes(t.id) &&
        (filter==='all'||(filter==='sent'&&t.from===currentUser.walletAddress)||(filter==='received'&&t.to===currentUser.walletAddress))
    ).forEach(t=>{
        const sent = t.from===currentUser.walletAddress;
        cont.innerHTML += `<div class="transaction-item">`+
            `<div><i class="fas fa-${sent?'arrow-up':'arrow-down'}"></i> ${sent?'إرسال':'استلام'}<br><small>${t.date}</small></div>`+
            `<div>${sent?'-':'+'}${t.amount} ${t.currency}</div>`+
        `</div>`;
    });
}

// التصويت
function loadCandidates() {
    document.getElementById('candidatesList').innerHTML = candidates.map(c=>
        `<div class="vote-item"><span>${c.name}</span><button class="btn btn-primary" onclick="voteFor(${c.id})">تصويت (10 TRX)</button></div>`
    ).join('');
}
function voteFor(id) {
    if(currentUser.balance.TRX<10) return alert('رصيد غير كافٍ');
    currentUser.balance.TRX-=10;
    candidates.find(c=>c.id===id).votes++;
    alert('تم التصويت'); updateWalletDisplay();
}

// صفحة المراقب
function loadAdmin() {
    // عرض المستخدمين
    const uDiv = document.getElementById('adminUsers'); uDiv.innerHTML='';
    users.forEach(u=> uDiv.innerHTML+= `<p>${u.name} - ${u.walletAddress}</p>`);
    // عرض المعاملات
    const tDiv = document.getElementById('adminTransactions'); tDiv.innerHTML='';
    transactions.forEach(t=> tDiv.innerHTML+= `<p>${t.date}: ${t.from} → ${t.to} ${t.amount} ${t.currency}</p>`);
}
function adminSend() {
    const recv = document.getElementById('adminReceiver').value;
    const amt = parseFloat(document.getElementById('adminAmount').value);
    const cur = document.getElementById('adminCurrency').value;
    const receiver = users.find(u=>u.walletAddress===recv);
    if(!receiver) return alert('مستخدم غير موجود');
    if(currentUser.balance[cur]<amt) return alert('الرصيد لا يكفي');
    currentUser.balance[cur]-=amt; receiver.balance[cur]+=amt;
    const tx = { id:Date.now(),from:'ADMIN',to:recv,amount:amt,currency:cur,date:new Date().toISOString() };
    transactions.push(tx);
    receiver.transactions.push(tx.id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    alert('تم التحويل من المراقب'); loadAdmin();
}

// تهيئة التطبيق
initCurrencySelects();
showPage('loginPage');
