// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
const navLinks = document.querySelectorAll(".top-nav a");

navLinks.forEach(link => {
    link.addEventListener("click", function () {
        // remove active from all
        navLinks.forEach(l => l.classList.remove("active"));

        // add active to clicked
        this.classList.add("active");
    });
});
function setReportView(view) {
    // 1. Update buttons
    const btns = document.querySelectorAll('.toggle-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 2. Switch Filter inputs
    if (view === 'daily') {
        document.getElementById('daily-filter').style.display = 'flex';
        document.getElementById('monthly-filter').style.display = 'none';
    } else {
        document.getElementById('daily-filter').style.display = 'none';
        document.getElementById('monthly-filter').style.display = 'flex';
    }
}
function setStudentView(view) {
    // 1. Update buttons
    const btns = document.querySelectorAll('.toggle-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 2. Switch Filter inputs
    if (view === 'daily') {
        document.getElementById('weekly-filter').style.display = 'flex';
        document.getElementById('monthly-filter').style.display = 'none';
    } else {
        document.getElementById('weekly-filter').style.display = 'none';
        document.getElementById('monthly-filter').style.display = 'flex';
    }
}
// OPEN ACCOUNT MODAL
function openAccountModal() {
    document.getElementById('accountModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// CLOSE ACCOUNT MODAL
function closeAccountModal() {
    document.getElementById('accountModalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// DYNAMIC FIELDS LOGIC
function updateRoleFields() {
    const role = document.getElementById('roleSelector').value;

    // Hide all sections first
    const sections = document.querySelectorAll('.role-specific-fields');
    sections.forEach(s => s.style.display = 'none');

    // Show the relevant section
    if (role === 'lgu') {
        document.getElementById('fields-lgu').style.display = 'block';
    } else if (role === 'school') {
        document.getElementById('fields-school').style.display = 'block';
    } else if (role === 'driver') {
        document.getElementById('fields-driver').style.display = 'block';
    }
}

// Close when clicking outside
function closeAccountModalOutside(e) {
    if (e.target.id === "accountModalOverlay") {
        closeAccountModal();
    }
}
function toggleStudentReports() {
    // 1. Correct the IDs to match your HTML (added the 'stu-' prefix)
    const container = document.getElementById('stu-filter-area');
    const btn = document.getElementById('stu-toggle-btn');
    const badge = document.getElementById('stu-badge-wrapper');

    // We target the specific parent for the students section
    const parent = document.querySelector('#students .report-filters');

    // 2. LOGIC
    if (container.style.display === 'none' || container.style.display === '') {
        // SHOW filters
        container.style.display = 'flex';

        // HIDE badge
        if (badge) badge.style.display = 'none';

        // Update Button Appearance
        btn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        btn.classList.add('active');
        btn.style.background = '#102a43'; // Navy Blue
    }
    else {
        // HIDE filters (GO BACK)
        container.style.display = 'none';

        // SHOW badge again
        if (badge) badge.style.display = 'flex';

        // Reset Button
        btn.innerHTML = 'View Trip Summary <i class="fa-solid fa-arrow-right"></i>';
        btn.classList.remove('active');
        btn.style.background = ''; // Reverts to CSS gradient

        console.log("Student report generated.");
    }
}

function filterLguTable() {
    const input = document.getElementById("lguStudentSearch");
    const filter = input.value.toUpperCase();
    const table = document.getElementById("lguStudentTable");
    const tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) { // Start at 1 to skip header
        let tdName = tr[i].getElementsByTagName("td")[0];
        let tdLrn = tr[i].getElementsByTagName("td")[1];

        if (tdName || tdLrn) {
            let txtValueName = tdName.textContent || tdName.innerText;
            let txtValueLrn = tdLrn.textContent || tdLrn.innerText;

            if (txtValueName.toUpperCase().indexOf(filter) > -1 || txtValueLrn.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
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


function rp_handleMainToggle() {
    const filterArea = document.getElementById('rp-filter-area');
    const actionBtn = document.getElementById('rp-toggle-btn');
    const badge = document.getElementById('rp-visual-badge');
    const parentRow = document.querySelector('#reports .report-filters');

    // 1. IF HIDDEN -> SHOW FILTERS
    if (filterArea.style.display === 'none' || filterArea.style.display === '') {
        filterArea.style.display = 'flex';
        if (badge) badge.style.display = 'none'; // Hide PNHS Badge

        actionBtn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
        actionBtn.style.background = '#102a43'; // Dark Navy
    }
    // 2. IF VISIBLE -> HIDE FILTERS (GO BACK)
    else {
        filterArea.style.display = 'none';
        if (badge) badge.style.display = 'flex'; // Bring back PNHS Badge

        actionBtn.innerHTML = 'View Transport Activity <i class="fa-solid fa-arrow-right"></i>';
        actionBtn.style.background = ''; // Reverts to your CSS Gradient

        console.log("Report Processed");
    }
}

function rp_switchSubView(type) {
    const daily = document.getElementById('rp-daily-box');
    const monthly = document.getElementById('rp-monthly-box');
    const btns = document.querySelectorAll('#reports .report-view-toggle .toggle-btn');

    btns.forEach(b => b.classList.remove('active'));

    if (type === 'daily') {
        daily.style.display = 'block';
        monthly.style.display = 'none';
        btns[0].classList.add('active');
    } else {
        daily.style.display = 'none';
        monthly.style.display = 'block';
        btns[1].classList.add('active');
    }
}

// scan students
function viewTripDetails(id, date, driver, start, end, count) {
  
    document.getElementById('det-trip-id').innerText = id;
    document.getElementById('det-date').innerText = date;
    document.getElementById('det-driver').innerText = driver;
    document.getElementById('det-start').innerText = start || "N/A";
    document.getElementById('det-end').innerText = end || "N/A";
    document.getElementById('det-count').innerText = count;

    
    document.getElementById('tripDetailOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTripView() {
    document.getElementById('tripDetailOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function viewTripDetails(id, date, driver, start, end, count) {
    // 1. Map top-level data
    document.getElementById('det-trip-id').innerText = id;
    document.getElementById('det-date').innerText = date;
    document.getElementById('det-driver').innerText = driver;
    document.getElementById('det-start').innerText = start || "N/A";
    document.getElementById('det-end').innerText = end || "N/A";
    document.getElementById('det-count').innerText = count;

    // 2. Fetch Passenger Data
    const tbody = document.querySelector('#tripManifestTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Loading Passenger List...</td></tr>';

    fetch(`/SchoolDashboard/GetTripManifest?tripId=${id}`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = ""; // Clear loader

            if (data.students && data.students.length > 0) {
                data.students.forEach(stu => {
                    tbody.innerHTML += `
                    <tr>
                        <td style="padding: 15px;"><strong>${stu.name}</strong></td>
                        <td style="font-size: 13px;">${stu.level} - ${stu.section}</td>
                        <td style="font-size: 11px; color: #64748b; max-width: 200px;">${stu.address}</td>
                        <td style="font-weight: 700; color: #0077b6;">${stu.time}</td>
                        <td style="text-align:center;">
                            <span class="status success" style="font-size: 10px; padding: 4px 10px;">${stu.status}</span>
                        </td>
                    </tr>
                `;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#94a3b8;">No records found for this trip.</td></tr>';
            }
        });

    // 3. Show Modal
    document.getElementById('tripDetailOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTripView() {
    document.getElementById('tripDetailOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}