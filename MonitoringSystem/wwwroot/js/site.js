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