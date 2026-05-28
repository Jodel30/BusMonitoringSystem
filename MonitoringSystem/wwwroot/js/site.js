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
    // 1. Reset UI and show Loading state
    const historyBody = document.getElementById('boarding-history-body');
    const totalTripsEl = document.getElementById('info-total-trips');
    const manualCountEl = document.getElementById('info-manual-scans'); // NEW

    if (historyBody) historyBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Fetching logs...</td></tr>';
    if (totalTripsEl) totalTripsEl.innerText = "0";
    if (manualCountEl) manualCountEl.innerText = "0"; // Reset manual count

    // 2. SET BASIC INFO IMMEDIATELY
    document.getElementById('info-name').innerText = name;
    document.getElementById('info-lrn').innerText = lrn;
    document.getElementById('info-grade').innerText = grade;
    document.getElementById('info-section').innerText = section;
    document.getElementById('info-address').innerText = address || "N/A";
    document.getElementById('info-parent').innerText = parent || "N/A";
    document.getElementById('info-contact').innerText = contact || "N/A";
    document.getElementById('info-id').innerText = sid || "N/A";

    // 3. SET PHOTO
    const photoEl = document.getElementById('info-photo');
    if (photoEl) {
        photoEl.src = (photo && photo !== '') ? photo : '/lib/default-avatar.png';
    }

    // 4. Show the modal
    document.getElementById('studentInfoOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';

    // 5. FETCH DATA FROM BACKEND
    fetch(`/SchoolDashboard/GetStudentData?lrn=${lrn}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // --- UPDATE DYNAMIC COUNTERS ---
                if (totalTripsEl) totalTripsEl.innerText = data.totalTrips;
                if (manualCountEl) manualCountEl.innerText = data.manualCount; // UPDATED

                // --- POPULATE HISTORY TABLE ---
                if (historyBody) {
                    historyBody.innerHTML = "";
                    if (data.tripHistory && data.tripHistory.length > 0) {
                        data.tripHistory.forEach(log => {
                            // Check if log is manual to color code the status
                            const isManual = log.status.includes("Manual");
                            const statusColor = isManual ? "background:#fffbeb; color:#d97706;" : "background:#dcfce7; color:#15803d;";

                            historyBody.innerHTML += `
                                <tr>
                                    <td>${log.date}</td>
                                    <td><span class="id-tag">${log.tripId}</span></td>
                                    <td style="font-weight:700; color:#0077b6;">${log.scanTime}</td>
                                    <td>
                                        <span class="status" style="font-size:10px; padding:4px 10px; border-radius:50px; font-weight:800; ${statusColor}">
                                            ${log.status}
                                        </span>
                                    </td>
                                </tr>`;
                        });
                    } else {
                        historyBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#94a3b8;">No records found.</td></tr>';
                    }
                }

                // Save for local filtering
                currentStudentLogs = data.tripHistory;
            }
        })
        .catch(err => console.error("Error fetching data:", err));
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

function lgu_switchReport(type, clickedBtn) {
    const dailyBox = document.getElementById('rp-daily-box');
    const monthlyBox = document.getElementById('rp-monthly-box');

    // 1. Find the parent container of the button you clicked
    const parentContainer = clickedBtn.parentElement;

    // 2. Find all buttons ONLY inside that specific container
    const btns = parentContainer.querySelectorAll('.toggle-btn');

    // 3. Remove 'active' from all buttons in THIS group
    btns.forEach(btn => btn.classList.remove('active'));

    // 4. Add 'active' to the button you physically clicked
    clickedBtn.classList.add('active');

    // 5. Toggle the input boxes (This part you said was already working)
    if (type === 'daily') {
        if (dailyBox) dailyBox.style.display = 'block';
        if (monthlyBox) monthlyBox.style.display = 'none';
    } else {
        if (dailyBox) dailyBox.style.display = 'none';
        if (monthlyBox) monthlyBox.style.display = 'block';
    }
}
// --- TRIP DETAILS MODAL & MANIFEST ---
function viewTripDetails(id, date, driver, start, end, count , shift) {
    document.getElementById('det-trip-id').innerText = id;
    document.getElementById('det-date').innerText = date;
    document.getElementById('det-driver').innerText = driver;
    document.getElementById('det-start').innerText = start || "N/A";
    document.getElementById('det-end').innerText = end || "N/A";
    document.getElementById('det-count').innerText = count;
    document.getElementById('det-trip-id').innerText = id + " (" + shift + ")";

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
function viewAccountDetails(name, user, role, address, schoolId, license, bus, contact, email, password) {
    // 1. Fill Common Fields
    document.getElementById('acc-display-name').innerText = name;
    document.getElementById('acc-username').innerText = "@" + user;
    document.getElementById('acc-password').innerText = password;
    document.getElementById('acc-contact').innerText = contact || "N/A";
    document.getElementById('acc-email').innerText = email || "N/A";
    document.getElementById('acc-address').innerText = address || "N/A";

    // 2. Hide all role-specific containers first
    const containers = [
        'acc-email-container', 'acc-address-container',
        'acc-school-id-container', 'acc-license-container', 'acc-bus-container'
    ];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 3. Logic to show fields based on Role
    const roleBadge = document.getElementById('acc-display-role');

    if (role === 'lgu') {
        roleBadge.innerText = "LGU Supervisor";
        document.getElementById('acc-address-container').style.display = 'block';
    }
    else if (role === 'school') {
        roleBadge.innerText = "School Aide";
        document.getElementById('acc-address-container').style.display = 'block';
        document.getElementById('acc-school-id-container').style.display = 'block';
        document.getElementById('acc-school-id').innerText = schoolId;
        document.getElementById('acc-email-container').style.display = 'block';
    }
    else if (role === 'driver') {
        roleBadge.innerText = "Bus Aide / Driver";
        document.getElementById('acc-license-container').style.display = 'block';
        document.getElementById('acc-license').innerText = license;
        document.getElementById('acc-bus-container').style.display = 'block';
        document.getElementById('acc-bus').innerText = bus;
    }

    // 4. Open Modal
    document.getElementById('accountInfoOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAccountInfo() {
    document.getElementById('accountInfoOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// --- SCROLL SPY LOGIC ---
window.addEventListener('scroll', () => {
    let current = "";
    // 1. Get all your sections
    const sections = document.querySelectorAll('section.main-content');
    const navLinks = document.querySelectorAll('.top-nav a');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        // Check if the scroll position is within the section
        // (We subtract 200px to trigger the change slightly before reaching the top)
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    // 2. Update the navbar links
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});