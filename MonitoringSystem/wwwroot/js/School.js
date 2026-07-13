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
function viewQRCode(base64Data, studentName) {
    const qrImg = document.getElementById('fullSizeQR');
    qrImg.src = "data:image/png;base64," + base64Data;

    // Set the name in the modal so the admin knows whose QR it is
    const nameEl = document.getElementById('qr-modal-name');
    if (nameEl) nameEl.innerText = studentName;

    document.getElementById('qrModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 1. SAVE AS IMAGE FUNCTION
function downloadQR() {
    const qrImage = document.getElementById('fullSizeQR').src;
    const name = document.getElementById('qr-modal-name').innerText;

    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `QR_${name}.png`; // Saves file as QR_StudentName.png
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 2. PRINT FUNCTION
function printQRCard() {
    window.print();
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
    document.getElementById('upd-id').value = id;
    document.getElementById('upd-fname').value = fname;
    document.getElementById('upd-mname').value = mname;
    document.getElementById('upd-lname').value = lname;
    document.getElementById('upd-grade').value = grade;
    document.getElementById('upd-section').value = section;
    document.getElementById('upd-contact').value = contact;

    // --- FIX FOR BLANK DROPDOWN ---
    const statusSelect = document.getElementById('upd-status');

    // Convert 1/0 or True/False to the words "Active"/"Inactive" if necessary
    let displayStatus = status;
    if (status === "True" || status === "1" || status === true) displayStatus = "Active";
    if (status === "False" || status === "0" || status === false) displayStatus = "Inactive";

    if (statusSelect) {
        statusSelect.value = displayStatus;
    }

    // Update the visual badge color
    const badge = document.querySelector('#updateStudentOverlay .badge-role');
    if (displayStatus === "Inactive") {
        badge.innerText = "INACTIVE";
        badge.style.background = "#fee2e2";
        badge.style.color = "#991b1b";
    } else {
        badge.innerText = "ACTIVE";
        badge.style.background = "#A3DE83";
        badge.style.color = "black";
    }

    document.getElementById('updateStudentOverlay').classList.add('active');
}
function closeUpdateModal() {
    document.getElementById('updateStudentOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeUpdateModalOutside(e) {
    if (e.target.id === "updateStudentOverlay") closeUpdateModal();
}
// scan students
function viewTripDetails(id, date, driver, start, end, count, shift) {
    document.getElementById('det-trip-id').innerText = id;
    document.getElementById('det-date').innerText = date;
    document.getElementById('det-driver').innerText = driver;
    document.getElementById('det-start').innerText = start || "N/A";
    document.getElementById('det-end').innerText = end || "N/A";
    document.getElementById('det-count').innerText = count;
    document.getElementById('det-trip-id').innerText = id + " (" + shift + ")";

    
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

/* ==========================================
   SCHOOL TRANSPORT ACTIVITY LOGIC
   ========================================== */

function sch_handleReportToggle() {
    const area = document.getElementById('sch-rp-filter-area');
    const badge = document.getElementById('sch-rp-visual-badge');
    const btn = document.getElementById('sch-rp-toggle-btn');

    if (area.style.display === 'none' || area.style.display === '') {
        area.style.display = 'flex';
        if (badge) badge.style.display = 'none';
        btn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        btn.style.background = '#102a43';
    }
    else {
        // Run the filter logic
        if (sch_runTripFilter()) {
            area.style.display = 'none';
            if (badge) badge.style.display = 'flex';
            btn.innerHTML = 'View Transport Activity <i class="fa-solid fa-arrow-right"></i>';
            btn.style.background = '';
        }
    }
}

function sch_runTripFilter() {
    // Corrected IDs to match the HTML sch- prefix
    const dailyBox = document.getElementById('sch-rp-daily-box');
    const dateInput = document.getElementById('sch-rp-date-input');
    const monthInput = document.getElementById('sch-rp-month-input');

    const isDaily = dailyBox.style.display !== 'none';
    const dateVal = dateInput.value;
    const monthVal = monthInput.value;

    // 1. Validation
    if (isDaily && !dateVal) {
        sch_showSystemAlert("Selection Required", "Please select a date.");
        return false;
    }
    if (!isDaily && !monthVal) {
        sch_showSystemAlert("Selection Required", "Please select a month.");
        return false;
    }

    let filterText = "";
    if (isDaily) {
        const d = new Date(dateVal);
        filterText = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    } else {
        const d = new Date(monthVal + "-01");
        filterText = (d.getMonth() + 1) + "/" + d.getFullYear();
    }

    // 2. Loop through table (Matches your table ID if it exists, or use class)
    const rows = document.querySelectorAll('.report-results tbody tr');
    let found = 0;

    rows.forEach(row => {
        const dateCell = row.cells[1].innerText; // Assuming Date is the 2nd column
        if (dateCell.includes(filterText)) {
            row.style.display = "";
            found++;
        } else {
            row.style.display = "none";
        }
    });

    if (found === 0) {
        sch_showSystemAlert("No Data Found", `No recorded trips for ${filterText}.`);
        rows.forEach(r => r.style.display = "");
        return false;
    }

    return true;
}

/* --- THE ALERT MODAL HELPER --- */
function sch_showSystemAlert(title, message) {
    const modal = document.getElementById('schAlertOverlay');
    const titleEl = document.getElementById('sch-alert-title');
    const messageEl = document.getElementById('sch-alert-message');

    if (modal && titleEl && messageEl) {
        titleEl.innerText = title;
        messageEl.innerText = message;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function sch_closeAlert() {
    const modal = document.getElementById('schAlertOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/* --- THE SUB-TOGGLE (Daily/Monthly) --- */
function sch_switchReport(type, clickedBtn) {
    const daily = document.getElementById('sch-rp-daily-box');
    const monthly = document.getElementById('sch-rp-monthly-box');

    // Toggle active button highlight
    const parent = clickedBtn.parentElement;
    const btns = parent.querySelectorAll('.toggle-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');

    // FIXED: Corrected variable names in the if/else
    if (type === 'daily') {
        if (daily) daily.style.display = 'block';
        if (monthly) monthly.style.display = 'none';
    } else {
        if (daily) daily.style.display = 'none';
        if (monthly) monthly.style.display = 'block';
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
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        // Optional: clear the URL hash
        window.location.hash = "students";
    }
}

let pendingAction = null;

function askConfirm(type, id, name) {
    const modal = document.getElementById('customConfirmModal');
    const title = document.getElementById('confirm-title');
    const msg = document.getElementById('confirm-message');
    const iconBox = document.getElementById('confirm-icon-box');
    const icon = document.getElementById('confirm-icon-i');
    const yesBtn = document.getElementById('confirm-yes-btn');

    if (type === 'delete') {
        title.innerText = "Delete Student?";
        msg.innerHTML = `Are you sure you want to PERMANENTLY delete <strong>${name}</strong>? This cannot be undone.`;
        iconBox.style.background = "#fee2e2";
        iconBox.style.color = "#ef4444";
        icon.className = "fa-solid fa-trash-can";
        yesBtn.style.background = "#ef4444";

        // Action: Submit the hidden form
        pendingAction = () => document.getElementById('delete-form-' + id).submit();
    }
    else if (type === 'restore') {
        title.innerText = "Restore Student?";
        msg.innerHTML = `Do you want to move <strong>${name}</strong> back to the Active Registry?`;
        iconBox.style.background = "#eef6fc";
        iconBox.style.color = "#0077b6";
        icon.className = "fa-solid fa-rotate-left";
        yesBtn.style.background = "#0077b6";

        // Action: Trigger your existing status update logic
        // We'll call a simple fetch to update status to 'Active'
        pendingAction = () => {
            fetch(`/SchoolDashboard/MarkAsActive?studentId=${id}`, { method: 'POST' })
                .then(() => window.location.reload());
        };
    }

    modal.classList.add('active');
    yesBtn.onclick = pendingAction;
}

function closeConfirmModal() {
    document.getElementById('customConfirmModal').classList.remove('active');
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
function checkAddress(select) {
    const otherWrapper = document.getElementById('otherAddressWrapper');
    const otherInput = document.getElementById('otherAddressInput');

    if (select.value === "Others") {
        otherWrapper.style.display = 'block';
        otherInput.required = true;
        otherInput.focus();
    } else {
        otherWrapper.style.display = 'none';
        otherInput.required = false;
        otherInput.value = ""; // Clear input if they change their mind
    }
}

/* --- LGU DASHBOARD UNIQUE PROFILE LOGIC --- */
function lgu_toggleProfile() {
    const lguBox = document.getElementById('lgu_profileBox');
    const notif = document.getElementById('notifModal');

    // Close notifications if they are open
    if (notif) notif.style.display = 'none';

    if (lguBox.style.display === 'block') {
        lguBox.style.display = 'none';
    } else {
        // Fetch data from the Controller
        fetch('/Account/GetMyProfile')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Update the unique LGU fields
                    document.getElementById('lgu-prof-name').innerText = data.name;
                    document.getElementById('lgu-prof-role').innerText = data.role;
                    document.getElementById('lgu-prof-user').innerText = "@" + data.username;
                    document.getElementById('lgu-prof-email').innerText = data.email;

                    lguBox.style.display = 'block';
                }
            });
    }
}

// Global click listener to close the LGU modal if clicking outside
window.addEventListener('click', function (e) {
    const lguBox = document.getElementById('lgu_profileBox');
    const trigger = document.querySelector('.lgu-user-trigger');

    if (lguBox && trigger) {
        if (!trigger.contains(e.target) && !lguBox.contains(e.target)) {
            lguBox.style.display = 'none';
        }
    }
});

function exportTransportReport() {
    // 1. Initialize jsPDF (Landscape orientation)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // 2. Add a professional Header
    doc.setFontSize(18);
    doc.setTextColor(0, 119, 182); // Your brand blue
    doc.text("Student Transport Monitoring System", 14, 15);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Official Transport Activity Log - ${new Date().toLocaleDateString()}`, 14, 22);

    // 3. Get the table data
    // We target your modern-table class
    const table = document.querySelector('.report-results table');

    if (!table || table.rows.length <= 1) {
        alert("No data found to export.");
        return;
    }

    // 4. Use AutoTable to build the PDF
    doc.autoTable({
        html: table,
        startY: 30, // Start after the header text
        theme: 'striped', // Clean, professional look
        headStyles: { fillColor: [16, 42, 67] }, // Dark Navy header
        styles: { fontSize: 10, cellPadding: 4 },
        // EXCLUDE THE ACTION COLUMN (The 'View Details' button)
        didParseCell: function (data) {
            // If the column header is "Action" or "Status", we can hide it or format it
            if (data.column.index === 5) { // Assuming index 5 is the 'Action' column
                data.cell.text = ""; // Don't print the button text
            }
        }
    });

    // 5. Download the file
    doc.save(`STMS_Report_${new Date().getTime()}.pdf`);
}