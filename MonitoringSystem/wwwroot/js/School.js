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
function viewStudentInfo(photo, name, lrn, grade, section, address, parent, contact, sid) {
    // Set Profile Picture (fallback to default avatar if photo path is empty)
    document.getElementById('info-photo').src = photo ? photo : '/lib/default-avatar.png';

    // Fill in Student details
    document.getElementById('info-name').innerText = name;
    document.getElementById('info-lrn').innerText = lrn;
    document.getElementById('info-id').innerText = sid || "Not Assigned";
    document.getElementById('info-grade').innerText = grade;
    document.getElementById('info-section').innerText = section;
    document.getElementById('info-address').innerText = address;
    document.getElementById('info-parent').innerText = parent;
    document.getElementById('info-contact').innerText = contact;

    // Show the modal
    document.getElementById('studentInfoOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeInfoView() {
    document.getElementById('studentInfoOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
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