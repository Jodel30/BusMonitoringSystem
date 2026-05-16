// --- 1. REGISTRATION MODAL CONTROLS ---
function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close registration modal when clicking on the dark background
function closeModalOutside(event) {
    if (event.target.id === 'modalOverlay') {
        closeModal();
    }
}

// --- 2. IMAGE PREVIEW LOGIC ---
function previewFile() {
    const preview = document.getElementById('previewImg');
    const icon = document.getElementById('placeholderIcon');
    const fileInput = document.getElementById('studentPhoto');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        const file = fileInput.files[0];

        reader.onloadend = function () {
            preview.src = reader.result;
            preview.style.display = "block"; // Show image
            if (icon) icon.style.display = "none"; // Hide placeholder icon
        }

        reader.readAsDataURL(file);
    } else {
        preview.src = "";
        preview.style.display = "none";
        if (icon) icon.style.display = "block";
    }
}

// --- 3. QR CODE VIEW MODAL ---
function viewQRCode(base64Data) {
    const qrImg = document.getElementById('fullSizeQR');
    // Ensure the data prefix is added
    qrImg.src = "data:image/png;base64," + base64Data;

    document.getElementById('qrModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQRView() {
    document.getElementById('qrModalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// --- 4. STUDENT INFO (PROFILE) MODAL ---

function viewSchStudentInfo(photo, name, lrn, grade, section, address, parent, contact, sid, regDate) {
    const modal = document.getElementById('schStudentInfoOverlay');
    const alertBox = document.getElementById('sch-info-update-alert'); // Target the alert div
    if (!modal) return;

    // 1. Map basic data
    const photoEl = document.getElementById('sch-info-photo');
    if (photoEl) photoEl.src = photo || '/lib/default-avatar.png';

    const setSchField = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value || "N/A";
    };

    setSchField('sch-info-name', name);
    setSchField('sch-info-lrn', lrn);
    setSchField('sch-info-id', sid);
    setSchField('sch-info-grade', grade);
    setSchField('sch-info-section', section);
    setSchField('sch-info-address', address);
    setSchField('sch-info-parent', parent);
    setSchField('sch-info-contact', contact);

    // 2. Set Registered Date
    const dateEl = document.getElementById('sch-info-registered-date');
    if (dateEl) {
        dateEl.innerText = regDate && regDate !== "" ? regDate : "Not Recorded";
    }

    // --- 3. NEW: 1-YEAR REVIEW PERIOD LOGIC ---
    if (regDate && regDate !== "" && alertBox) {
        const registrationDate = new Date(regDate);
        const today = new Date();

        // Calculate difference in days
        const diffTime = Math.abs(today - registrationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 365) {
            // Show the notification if 1 year has passed
            alertBox.style.display = 'flex';
        } else {
            // Hide it if student is still within the first year
            alertBox.style.display = 'none';
        }
    } else if (alertBox) {
        alertBox.style.display = 'none';
    }

    // 4. Open Modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSchInfoView() {
    const modal = document.getElementById('schStudentInfoOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/* --- UPDATE STUDENT MODAL LOGIC --- */
function openUpdateModal(id, fname, mname, lname, grade, section, contact, status) {
    // 1. Fill the form fields with current data
    document.getElementById('upd-id').value = id;
    document.getElementById('upd-fname').value = fname;
    document.getElementById('upd-mname').value = mname;
    document.getElementById('upd-lname').value = lname;
    document.getElementById('upd-grade').value = grade;
    document.getElementById('upd-section').value = section;
    document.getElementById('upd-contact').value = contact;
    document.getElementById('upd-status').value = status || "Active";

    const badge = document.querySelector('#updateStudentOverlay .badge-role');
    if (status === "Inactive") {
        badge.innerText = "Inactive";
        badge.style.background = "#fee2e2";
        badge.style.color = "#991b1b";
    } else {
        badge.innerText = "Active";
        badge.style.background = "#A3DE83";
        badge.style.color = "black";
    }
    // 2. Open the Modal
    document.getElementById('updateStudentOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUpdateModal() {
    document.getElementById('updateStudentOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeUpdateModalOutside(e) {
    if (e.target.id === "updateStudentOverlay") closeUpdateModal();
}
// scan students
function viewTripDetails(id, date, driver, start, end, count) {
    document.getElementById('det-trip-id').innerText = id;
    document.getElementById('det-date').innerText = date;
    document.getElementById('det-driver').innerText = driver;
    document.getElementById('det-start').innerText = start || "N/A";
    document.getElementById('det-end').innerText = end || "N/A";
    document.getElementById('det-count').innerText = count;

    
    const tbody = document.querySelector('#tripManifestTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Loading...</td></tr>';

    fetch(`/SchoolDashboard/GetTripManifest?tripId=${id}`)
        .then(res => res.text())
        .then(html => { tbody.innerHTML = html; });

    document.getElementById('tripDetailOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTripView() {
    document.getElementById('tripDetailOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function rp_handleMainToggle() {
    const area = document.getElementById('rp-filter-area');
    const badge = document.getElementById('rp-visual-badge');
    const btn = document.getElementById('rp-toggle-btn');

    if (area.style.display === 'none' || area.style.display === '') {
        area.style.display = 'flex';
        if (badge) badge.style.display = 'none';
        btn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        btn.style.background = '#102a43';
    } else {
        area.style.display = 'none';
        if (badge) badge.style.display = 'flex';
        btn.innerHTML = 'View Transport Activity <i class="fa-solid fa-arrow-right"></i>';
        btn.style.background = '';
    }
}
function filterArchiveTable() {
    let input = document.getElementById("archiveSearch").value.toUpperCase();
    let rows = document.querySelectorAll("#archiveTable tbody tr.archived-row");

    rows.forEach(row => {
        let text = row.innerText.toUpperCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}
function toggleNotifModal() {
    const modal = document.getElementById('notifModal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
    }
}

// Close notifications if clicking anywhere else on the screen
window.onclick = function (event) {
    const modal = document.getElementById('notifModal');
    const bell = document.querySelector('.notif-wrapper');
    if (!bell.contains(event.target) && !modal.contains(event.target)) {
        modal.style.display = 'none';
    }
}