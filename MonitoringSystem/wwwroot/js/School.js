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

// 1. OPEN THE LIST MODAL
function openFrequentManualModal() {
    const modal = document.getElementById('frequentManualModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeFrequentModal() {
    document.getElementById('frequentManualModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 2. THE "REVIEW" LOGIC
function reviewStudentQR(lrn) {
    // 1. Tell backend to clear the alert
    fetch(`/SchoolDashboard/ResolveManualAlert?lrn=${lrn}`, {
        method: 'POST'
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // 2. Close the alert list modal
                closeFrequentModal();

                // 3. Smooth scroll to the Student Records section
                window.location.hash = 'students';

                // 4. Find the student and pop up their QR CODE automatically
                setTimeout(() => {
                    const rows = document.querySelectorAll('#lguStudentTable tbody tr');
                    rows.forEach(row => {
                        // Check if this row belongs to the student
                        if (row.innerText.includes(lrn)) {
                            // Find the QR icon button and click it
                            const qrBtn = row.querySelector('.icon-qr-trigger');
                            if (qrBtn) {
                                qrBtn.click(); // This opens your existing QR View Modal
                            }
                        }
                    });
                }, 600);
            }
        });
}
// 1. MODAL CONTROLS
function openNeedsUpdateModal() {
    const modal = document.getElementById('needsUpdateModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeUpdateAlertModal() {
    document.getElementById('needsUpdateModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}


function reviewForUpdate(lrn) {
    
    fetch(`/SchoolDashboard/MarkAsPending?lrn=${lrn}`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Notification cleared. Proceeding to update...");

                // A. Close the alert list modal
                closeUpdateAlertModal();

                // B. Smooth scroll to the Student Records section
                window.location.hash = 'students';

               
                setTimeout(() => {
                    const rows = document.querySelectorAll('#lguStudentTable tbody tr');
                    rows.forEach(row => {
                        if (row.innerText.includes(lrn)) {
                            // Find the button that contains the pen-to-square icon
                            const updateBtn = row.querySelector('.fa-pen-to-square')?.parentElement;

                            if (updateBtn) {
                                updateBtn.click(); // This opens your Update Student Modal
                            }
                        }
                    });
                }, 600);
            } else {
                console.error("Failed to clear notification.");
                // Fallback: still try to open the modal if the status update fails
                closeUpdateAlertModal();
                window.location.hash = 'students';
            }
        })
        .catch(err => {
            console.error("Connection error:", err);
        });
}
function openAbsenceModal() {
    document.getElementById('absenceModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAbsenceModal() {
    document.getElementById('absenceModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function reviewAbsence(lrn) {
    // 1. Clear alert from backend
    fetch(`/SchoolDashboard/ResolveAbsenceAlert?lrn=${lrn}`, { method: 'POST' })
        .then(() => {
            closeAbsenceModal();
            // 2. Navigate to student list
            window.location.hash = 'students';
            // 3. Auto-open the profile so admin can choose to make them 'Inactive'
            setTimeout(() => {
                const rows = document.querySelectorAll('#lguStudentTable tbody tr');
                rows.forEach(row => {
                    if (row.innerText.includes(lrn)) {
                        const infoBtn = row.querySelector('.btn-view-info');
                        if (infoBtn) infoBtn.click();
                    }
                });
            }, 600);
        });
}