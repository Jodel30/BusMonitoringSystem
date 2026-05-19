/* ==========================================
   1. NAVIGATION & GENERAL UI
   ========================================== */
const navLinks = document.querySelectorAll(".top-nav a");
navLinks.forEach(link => {
    link.addEventListener("click", function () {
        navLinks.forEach(l => l.classList.remove("active"));
        this.classList.add("active");
    });
});

/* ==========================================
   2. ACCOUNT / USER MANAGEMENT
   ========================================== */
function openAccountModal() {
    document.getElementById('accountModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAccountModal() {
    document.getElementById('accountModalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeAccountModalOutside(e) {
    if (e.target.id === "accountModalOverlay") closeAccountModal();
}

function updateRoleFields() {
    const role = document.getElementById('roleSelector').value;
    const sections = document.querySelectorAll('.role-specific-fields');
    sections.forEach(s => s.style.display = 'none');

    if (role === 'lgu') document.getElementById('fields-lgu').style.display = 'block';
    else if (role === 'school') document.getElementById('fields-school').style.display = 'block';
    else if (role === 'driver') document.getElementById('fields-driver').style.display = 'block';
}

/* ==========================================
   3. STUDENT REGISTRY MODULE (WITH MODAL FILTERS)
   ========================================== */
let currentStudentLogs = []; // Stores logs of the currently opened student for filtering

function toggleStudentReports() {
    const container = document.getElementById('stu-filter-area');
    const btn = document.getElementById('stu-toggle-btn');
    const badge = document.getElementById('stu-badge-wrapper');

    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'flex';
        if (badge) badge.style.display = 'none';
        btn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        btn.style.background = '#102a43';
    } else {
        container.style.display = 'none';
        if (badge) badge.style.display = 'flex';
        btn.innerHTML = 'View Trip Summary <i class="fa-solid fa-arrow-right"></i>';
        btn.style.background = '';
    }
}

function filterLguTable() {
    const input = document.getElementById("lguStudentSearch").value.toUpperCase();
    const rows = document.querySelectorAll("#lguStudentTable tbody tr");
    rows.forEach(row => {
        row.style.display = row.innerText.toUpperCase().includes(input) ? "" : "none";
    });
}

// --- STUDENT PROFILE MODAL ---
function viewStudentInfo(photo, name, lrn, grade, section, address, parent, contact, sid) {
    // RESET MODAL FILTER UI
    const weeklyBox = document.getElementById('stu-weekly-box');
    const monthlyBox = document.getElementById('stu-monthly-box');
    if (weeklyBox) weeklyBox.style.display = 'none';
    if (monthlyBox) monthlyBox.style.display = 'none';

    // Reset toggle buttons to "All"
    const filterBtns = document.querySelectorAll('.stu-filter-btn');
    filterBtns.forEach(b => b.classList.remove('active'));
    if (filterBtns[0]) filterBtns[0].classList.add('active');

    const historyBody = document.getElementById('boarding-history-body');
    historyBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Fetching logs...</td></tr>';

    // Set basic info
    document.getElementById('info-name').innerText = name;
    document.getElementById('info-photo').src = photo || '/lib/default-avatar.png';
    document.getElementById('studentInfoOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';

    fetch(`/SchoolDashboard/GetStudentData?lrn=${lrn}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('info-lrn').innerText = data.lrn;
                document.getElementById('info-id').innerText = data.id || "N/A";
                document.getElementById('info-grade').innerText = data.level;
                document.getElementById('info-section').innerText = data.section;
                document.getElementById('info-address').innerText = data.address;
                document.getElementById('info-parent').innerText = data.parent;
                document.getElementById('info-contact').innerText = data.contact;
                document.getElementById('info-total-trips').innerText = data.totalTrips;

                // Save data for local filtering
                currentStudentLogs = data.tripHistory;
                renderStudentHistoryTable(currentStudentLogs);
            }
        });
}

// --- NEW: MODAL FILTER LOGIC ---

// 1. Toggle visibility of inputs (Date/Month)
function toggleStuInput(mode, btn) {
    document.querySelectorAll('.stu-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const weeklyBox = document.getElementById('stu-weekly-box');
    const monthlyBox = document.getElementById('stu-monthly-box');

    if (mode === 'weekly') {
        weeklyBox.style.display = 'block';
        monthlyBox.style.display = 'none';
    } else if (mode === 'monthly') {
        weeklyBox.style.display = 'none';
        monthlyBox.style.display = 'block';
    } else {
        // "All" mode
        weeklyBox.style.display = 'none';
        monthlyBox.style.display = 'none';
        renderStudentHistoryTable(currentStudentLogs);
        document.getElementById('info-total-trips').innerText = currentStudentLogs.length;
    }
}

// 2. Filter the data based on selection
function applyStuFilter(mode) {
    let filtered = [];

    if (mode === 'weekly') {
        const selectedDate = document.getElementById('stu-date-input').value;
        if (!selectedDate) return;

        // Convert YYYY-MM-DD to MMM DD, YYYY to match backend format
        const dateObj = new Date(selectedDate);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        filtered = currentStudentLogs.filter(log => log.date === formattedDate);
    }
    else if (mode === 'monthly') {
        const selectedMonth = document.getElementById('stu-month-input').value; // Format: YYYY-MM
        if (!selectedMonth) return;

        const dateObj = new Date(selectedMonth + "-01");
        const monthYear = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        filtered = currentStudentLogs.filter(log => log.date.includes(monthYear));
    }

    renderStudentHistoryTable(filtered);
    document.getElementById('info-total-trips').innerText = filtered.length;
}

function renderStudentHistoryTable(logs) {
    const historyBody = document.getElementById('boarding-history-body');
    historyBody.innerHTML = "";
    if (logs && logs.length > 0) {
        logs.forEach(log => {
            historyBody.innerHTML += `<tr><td>${log.date}</td><td><span class="id-tag">${log.tripId}</span></td><td>${log.scanTime}</td><td><span class="status success">${log.status}</span></td></tr>`;
        });
    } else {
        historyBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No records found.</td></tr>';
    }
}

function closeInfoView() {
    document.getElementById('studentInfoOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

/* ==========================================
   4. TRANSPORT ACTIVITY (REPORTS) MODULE
   ========================================== */
function rp_handleMainToggle() {
    const filterArea = document.getElementById('rp-filter-area');
    const actionBtn = document.getElementById('rp-toggle-btn');
    const badge = document.getElementById('rp-visual-badge');

    if (filterArea.style.display === 'none' || filterArea.style.display === '') {
        filterArea.style.display = 'flex';
        if (badge) badge.style.display = 'none';
        actionBtn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        actionBtn.style.background = '#102a43';
    } else {
        filterArea.style.display = 'none';
        if (badge) badge.style.display = 'flex';
        actionBtn.innerHTML = 'View Transport Activity <i class="fa-solid fa-arrow-right"></i>';
        actionBtn.style.background = '';
    }
}

function rp_switchSubView(type) {
    const daily = document.getElementById('rp-daily-box');
    const monthly = document.getElementById('rp-monthly-box');
    if (type === 'daily') {
        daily.style.display = 'block';
        monthly.style.display = 'none';
    } else {
        daily.style.display = 'none';
        monthly.style.display = 'block';
    }
}

// --- TRIP DETAILS MODAL & MANIFEST ---
function viewTripDetails(id, date, driver, start, end, count) {
    document.getElementById('det-trip-id').innerText = id;
    document.getElementById('det-date').innerText = date;
    document.getElementById('det-driver').innerText = driver;
    document.getElementById('det-start').innerText = start || "N/A";
    document.getElementById('det-end').innerText = end || "N/A";
    document.getElementById('det-count').innerText = count;

    const tbody = document.querySelector('#tripManifestTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Loading manifest...</td></tr>';

    fetch(`/SchoolDashboard/GetTripManifest?tripId=${id}`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = "";
            if (data.students && data.students.length > 0) {
                data.students.forEach(stu => {
                    tbody.innerHTML += `<tr><td style="padding:15px;"><strong>${stu.name}</strong></td><td>${stu.level} - ${stu.section}</td><td>${stu.address}</td><td>${stu.time}</td><td style="text-align:center;"><span class="status success">${stu.status}</span></td></tr>`;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">No students scanned.</td></tr>';
            }
        });

    document.getElementById('tripDetailOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTripView() {
    document.getElementById('tripDetailOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}
function toggleNotifModal() {
    const modal = document.getElementById('notifModal');
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
        // Animation trigger
        modal.style.animation = "notifFadeDown 0.3s ease-out forwards";
    }
}

// Close when clicking anywhere outside the modal
window.addEventListener('click', function (e) {
    const modal = document.getElementById('notifModal');
    const wrapper = document.querySelector('.notif-wrapper');
    if (!wrapper.contains(e.target) && !modal.contains(e.target)) {
        modal.style.display = 'none';
    }
});

function openLowUsageModal() {
    document.getElementById('lowUsageModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLowUsageModal() {
    document.getElementById('lowUsageModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function reviewLowUsage(lrn) {
    // 1. Resolve alert in backend
    fetch(`/SchoolDashboard/ResolveLowUsageAlert?lrn=${lrn}`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeLowUsageModal();
                // 2. Navigate and Open profile
                window.location.hash = 'students';
                setTimeout(() => {
                    const rows = document.querySelectorAll('#lguStudentTable tbody tr');
                    rows.forEach(row => {
                        if (row.innerText.includes(lrn)) {
                            const infoBtn = row.querySelector('.btn-view-info');
                            if (infoBtn) infoBtn.click();
                        }
                    });
                }, 600);
            }
        });
}