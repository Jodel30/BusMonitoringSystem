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