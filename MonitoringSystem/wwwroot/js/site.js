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
function toggleReportFilters() {
    const container = document.getElementById('filter-container');
    const btn = document.getElementById('filter-toggle-btn');
    const parent = document.querySelector('.report-filters');
    const image = document.getElementById('report-image'); // Target the picture

    // 1. If hidden: SHOW filters, HIDE picture
    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'flex';
        if (image) image.style.display = 'none'; // Picture disappears

        parent.style.justifyContent = 'space-between';
        btn.classList.add('active');

        // Change button text
        btn.innerHTML = 'Generate Report <i class="fa-solid fa-check"></i>';
    }
    // 2. If visible: HIDE filters, SHOW picture (Go back)
    else {
        // Logic for "Generating"
        container.style.display = 'none';
        if (image) image.style.display = 'block'; // Picture comes back

        parent.style.justifyContent = 'space-between';
        btn.classList.remove('active');

        // Reset button text
        btn.innerHTML = 'View Trip Summary <i class="fa-solid fa-arrow-right"></i>';

        // Optional logic to trigger the report processing
        console.log("Report generated!");
    }
}