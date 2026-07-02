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

    // 1. Get all containers
    const sections = {
        'lgu': document.getElementById('fields-lgu'),
        'school': document.getElementById('fields-school'),
        'driver': document.getElementById('fields-driver')
    };

    // 2. Hide everything and DISABLE all internal inputs
    for (let key in sections) {
        if (sections[key]) {
            sections[key].style.display = 'none';
            // Disable all inputs inside this section so they don't send empty data
            const inputs = sections[key].querySelectorAll('input');
            inputs.forEach(input => input.disabled = true);
        }
    }

    // 3. Show the selected section and ENABLE its inputs
    if (sections[role]) {
        sections[role].style.display = 'block';
        const activeInputs = sections[role].querySelectorAll('input');
        activeInputs.forEach(input => input.disabled = false);
    }
}

let currentStudentLogs = []; // Stores logs of the currently opened student for filtering

/* ==========================================
   STUDENT REGISTRY MODULE (WITH ALERTS)
   ========================================== */

function toggleStudentReports() {
    const container = document.getElementById('stu-filter-area');
    const btn = document.getElementById('stu-toggle-btn');
    const badge = document.getElementById('stu-badge-wrapper');

    if (container.style.display === 'none' || container.style.display === '') {
        // 1. OPEN MODE: Show filters
        container.style.display = 'flex';
        if (badge) badge.style.display = 'none';

        btn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        btn.style.background = '#102a43'; // Navy Blue
    }
    else {
        // 2. GENERATE MODE: 
        // Run the filter logic. It returns the number of students found.
        const foundCount = applyStudentTableFilters();

        if (foundCount > 0) {
            // SUCCESS: Students found, close the bar
            container.style.display = 'none';
            if (badge) badge.style.display = 'flex';
            btn.innerHTML = 'View Trip Summary <i class="fa-solid fa-arrow-right"></i>';
            btn.style.background = ''; // Reverts to CSS gradient
            console.log(`Success: Found ${foundCount} students.`);
        }
        else {
            // ERROR: No students found, show modal and KEEP bar open
            stu_showSystemAlert("No Records Found", "No students match the selected Address and Grade. Try a different combination.");

            // Optional: Reset table to show everyone again so it's not blank
            const rows = document.querySelectorAll("#lguStudentTable tbody tr");
            rows.forEach(row => row.style.display = "");
        }
    }
}

// THE FILTER LOGIC (Returns the count of matches)
function applyStudentTableFilters() {
    const addrEl = document.getElementById('stu-addr-filter');
    const gradeEl = document.getElementById('stu-grade-filter');

    // Check if elements exist to prevent errors
    if (!addrEl || !gradeEl) return 0;

    const selectedAddr = addrEl.value.toUpperCase();
    const selectedGrade = gradeEl.value.toUpperCase();
    const rows = document.querySelectorAll("#lguStudentTable tbody tr");
    let matchCount = 0;

    rows.forEach(row => {
        // Assuming Grade/Section is Index 2 and Address is Index 3
        const rowGradeText = row.cells[2].innerText.toUpperCase();
        const rowAddrText = row.cells[3].innerText.toUpperCase();

        const matchesGrade = (selectedGrade === "ALL" || rowGradeText.includes(selectedGrade));
        const matchesAddr = (selectedAddr === "ALL" || rowAddrText.includes(selectedAddr));

        if (matchesGrade && matchesAddr) {
            row.style.display = "";
            matchCount++;
        } else {
            row.style.display = "none";
        }
    });

    return matchCount;
}

/* --- STUDENT ALERT MODAL HELPERS --- */
function stu_showSystemAlert(title, message) {
    const modal = document.getElementById('stuAlertOverlay');
    if (document.getElementById('stu-alert-title')) document.getElementById('stu-alert-title').innerText = title;
    if (document.getElementById('stu-alert-message')) document.getElementById('stu-alert-message').innerText = message;

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop background scroll
    }
}

function stu_closeAlert() {
    const modal = document.getElementById('stuAlertOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scroll
    }
}

// EXISTING SEARCH BAR LOGIC
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
function showAdminAlert(title, message, isError = true) {
    const modal = document.getElementById('adminAlertOverlay');
    const iconBox = document.getElementById('admin-alert-icon-box');
    const icon = document.getElementById('admin-alert-icon');

    document.getElementById('admin-alert-title').innerText = title;
    document.getElementById('admin-alert-message').innerText = message;

    // Change color based on success or error
    if (isError) {
        iconBox.style.background = "#fee2e2";
        iconBox.style.color = "#ef4444";
        icon.className = "fa-solid fa-circle-xmark";
    } else {
        iconBox.style.background = "#dcfce7";
        iconBox.style.color = "#15803d";
        icon.className = "fa-solid fa-circle-check";
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdminAlert() {
    document.getElementById('adminAlertOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}
function rp_handleMainToggle() {
    const area = document.getElementById('rp-filter-area');
    const badge = document.getElementById('rp-visual-badge');
    const btn = document.getElementById('rp-toggle-btn');

    // 1. IF HIDDEN -> SHOW FILTERS
    if (area.style.display === 'none' || area.style.display === '') {
        area.style.display = 'flex';
        if (badge) badge.style.display = 'none';
        btn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        btn.style.background = '#102a43'; // Dark Navy
    }
    // 2. IF VISIBLE -> RUN FILTER AND GO BACK
    else {
        if (runTripFilter()) {
            area.style.display = 'none';
            if (badge) badge.style.display = 'flex';
            btn.innerHTML = 'View Transport Activity <i class="fa-solid fa-arrow-right"></i>';
            btn.style.background = '';
        }
    }
}

function runTripFilter() {
    // A. Check which mode is active (Daily or Monthly)
    const isDaily = document.getElementById('rp-daily-box').style.display !== 'none';
    const dateVal = document.getElementById('rp-date-input').value; // YYYY-MM-DD
    const monthVal = document.getElementById('rp-month-input').value; // YYYY-MM

    if (isDaily && !dateVal) {
        showAdminAlert("Missing Date", "Please select a specific day to generate the report.");
        return false;
    }
    if (!isDaily && !monthVal) {
        showAdminAlert("Missing Month", "Please select a month to view the summary.");
        return false;
    }

    let filterText = "";

    // B. Convert input format to match table date format (e.g. 6/16/2026)
    if (isDaily) {
        const d = new Date(dateVal);
        filterText = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    } else {
        const d = new Date(monthVal + "-01");
        // For monthly, we just want to match "Month/Year" (e.g. "6/2026")
        filterText = (d.getMonth() + 1) + "/" + d.getFullYear();
    }

    console.log("Filtering Trips for: " + filterText);

    // C. Loop through the rows in the Transport Activity table
    // We target the rows inside the .report-results container
    const rows = document.querySelectorAll('.report-results tbody tr');
    let foundCount = 0;

    rows.forEach(row => {
        const dateCell = row.cells[2].innerText; // Index 2 is the 'DATE' column
        if (dateCell.includes(filterText)) {
            row.style.display = ""; // Show
            foundCount++;
        } else {
            row.style.display = "none"; // Hide
        }
    });

    if (foundCount === 0) {
        showAdminAlert("No Data Found", `There are no transport logs recorded for ${filterText}.`);
        rows.forEach(r => r.style.display = ""); // Show all again
        return false;
    }

    return true;
}

/* --- SUB-TOGGLE: Daily vs Monthly --- */
function lgu_switchReport(type, clickedBtn) {
    const dailyBox = document.getElementById('rp-daily-box');
    const monthlyBox = document.getElementById('rp-monthly-box');
    const parentContainer = clickedBtn.parentElement;
    const btns = parentContainer.querySelectorAll('.toggle-btn');

    btns.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');

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
    document.getElementById('det-date').innerText = date;
    document.getElementById('det-driver').innerText = driver;
    document.getElementById('det-start').innerText = start || "N/A";
    document.getElementById('det-end').innerText = end || "N/A";
    document.getElementById('det-count').innerText = count;
    document.getElementById('det-trip-id').innerText = id;

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
/* --- UPDATED VIEW ACCOUNT DETAILS (8 Parameters) --- */
function viewAccountDetails(name, user, role, address, schoolId, contact, email, password) {
    // 1. Debugging: Press F12 in browser to see if data arrives
    console.log("Opening details for:", name);

    // 2. Map the 8 parameters to the HTML IDs
    // We use (val || "N/A") to prevent the 'undefined' error
    document.getElementById('acc-display-name').innerText = name || "User";
    document.getElementById('acc-username').innerText = "@" + (user || "unknown");
    document.getElementById('acc-password').innerText = password || "********";
    document.getElementById('acc-contact').innerText = contact || "N/A";
    document.getElementById('acc-email').innerText = email || "N/A";
    document.getElementById('acc-address').innerText = address || "N/A";

    // 3. Target the conditional containers
    const schoolIdContainer = document.getElementById('acc-school-id-container');
    const emailContainer = document.getElementById('acc-email-container');
    const addressContainer = document.getElementById('acc-address-container');
    const roleBadge = document.getElementById('acc-display-role');

    // 4. Reset visibility before applying logic
    if (schoolIdContainer) schoolIdContainer.style.display = 'none';
    if (emailContainer) emailContainer.style.display = 'none';
    if (addressContainer) addressContainer.style.display = 'block';

    // 5. Logic based on Role
    if (role === 'lgu') {
        roleBadge.innerText = "LGU SUPERVISOR";
        roleBadge.style.background = "#fee2e2";
        roleBadge.style.color = "#991b1b";
    }
    else if (role === 'school') {
        roleBadge.innerText = "SCHOOL AIDE";
        roleBadge.style.background = "#e0f2fe";
        roleBadge.style.color = "#075985";

        if (schoolIdContainer) {
            schoolIdContainer.style.display = 'block';
            document.getElementById('acc-school-id').innerText = schoolId || "N/A";
        }
        if (emailContainer) emailContainer.style.display = 'block';
    }
    else if (role === 'driver') {
        roleBadge.innerText = "BUS AIDE";
        roleBadge.style.background = "#f1f5f9";
        roleBadge.style.color = "#475569";
    }

    // 6. Open Modal
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

function toggleUserModal() {
    const modal = document.getElementById('userModal');
    const notifModal = document.getElementById('notifModal');

    // 1. If notification modal is open, close it first
    if (notifModal) notifModal.style.display = 'none';

    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        // 2. Fetch fresh data from AccountController
        fetch('/Account/GetMyProfile')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('my-prof-name').innerText = data.name;
                    document.getElementById('my-prof-role').innerText = data.role;
                    document.getElementById('my-prof-user').innerText = "@" + data.username;
                    
                    document.getElementById('my-prof-contact').innerText = data.contact;
                    // 3. Show the modal
                    modal.style.display = 'block';
                }
            });
    }
}

// Close when clicking outside
window.addEventListener('click', function (e) {
    const modal = document.getElementById('userModal');
    const trigger = document.querySelector('.user-icon-wrapper');
    if (!trigger.contains(e.target) && !modal.contains(e.target)) {
        modal.style.display = 'none';
    }
});