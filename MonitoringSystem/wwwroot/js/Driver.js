function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function switchSection(id) {
    let sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');


    let titles = { 'scan': 'Scanner', 'register': 'Manual Check-in', 'onboard': 'On-Board', 'profile': 'Profile' };
    document.getElementById('header-title').innerText = titles[id];

    toggleMenu();
}

// Search Functionality
function filterStudents() {
    let input = document.getElementById('studentSearch').value.toLowerCase();
    let items = document.querySelectorAll('.student-item');

    items.forEach(item => {
        let name = item.getAttribute('data-name').toLowerCase();
        let lrn = item.getAttribute('data-lrn').toLowerCase();
        if (name.includes(input) || lrn.includes(input)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

// Boarding Logic (Simulated)
function boardStudent(btn) {
    btn.innerText = "Boarded ✓";
    btn.classList.add('boarded');
    btn.disabled = true;

    let studentName = btn.parentElement.querySelector('h4').innerText;
    alert(studentName + " has been manually boarded.");
}
let html5QrCode; 

async function startScanner() {
    
    document.getElementById('static-frame').style.display = 'none'; // Hide static icon
    document.getElementById('start-btn').style.display = 'none';   // Hide "Tap to Scan"
    document.getElementById('reader').style.display = 'block';     // Show camera feed container
    document.getElementById('stop-btn').style.display = 'block';   // Show "Stop Scanner"

    // Initialize Scanner
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
        await html5QrCode.start(
            { facingMode: "environment" }, // Uses back camera
            config,
            (decodedText, decodedResult) => {
                // SUCCESS: When a QR is scanned
                onScanSuccess(decodedText);
            }
        );
    } catch (err) {
        alert("Camera permission denied or not found. Please ensure you allow camera access and try again.");
        resetScanner(); // Go back to initial state on error
    }
}


function onScanSuccess(decodedText) {
    stopScanner();

    let lrn = decodedText.includes('LRN:') ? decodedText.split('LRN:')[1].split('|')[0] : decodedText;

    fetch(`/SchoolDashboard/GetStudentData?lrn=${lrn}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 1. UPDATE THE UI ELEMENTS
                const nameEl = document.getElementById('scanned-name');
                const photoEl = document.getElementById('scanned-photo');
                const levelEl = document.getElementById('scanned-level');

                if (nameEl) nameEl.innerText = data.name;
                if (photoEl) photoEl.src = data.photo || '/lib/default-avatar.png';
                if (levelEl) levelEl.innerText = "Grade: " + data.level;

                // 2. SWITCH THE SCREEN VIEW
                // Hide the scanner UI
                document.getElementById('scanner-ui').style.display = 'none';
                // Show the success screen
                document.getElementById('scan-success').style.display = 'block';

                // 3. RECORD TO LIST (This part is already working for you)
                addToOnBoardList(data);
            } else {
                alert("Student not found!");
                resetScanner();
            }
        });
}

// THIS ADDS THE SCANNED STUDENT TO THE LOG SECTION
function addToOnBoardList(student) {
    const list = document.getElementById('onboardList');

    // Remove the "No students scanned yet" message if it's there
    if (list.innerText.includes("No students")) {
        list.innerHTML = "";
    }

    // Create the item HTML
    const newItem = `
        <div class="student-item" style="border-left: 5px solid #2ecc71; animation: slideInLeft 0.3s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${student.photo || '/lib/default-avatar.png'}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid #eee;">
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p><i class="far fa-clock"></i> Boarded: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
            <i class="fas fa-check-circle" style="color: #2ecc71; font-size: 18px;"></i>
        </div>
    `;

    // Add new student to the top of the list
    list.insertAdjacentHTML('afterbegin', newItem);
}

async function stopScanner() {
    if (html5QrCode) {
        await html5QrCode.stop(); // Stop the camera feed
        html5QrCode = null; // Clear the scanner instance
    }
    resetScanner(); 
}

// This function resets the UI to the initial "Tap to Scan" state
function resetScanner() {
    // Hide success message if it's visible
    document.getElementById('scan-success').style.display = 'none';

    // Show the main scanner UI (static frame + start button)
    document.getElementById('scanner-ui').style.display = 'block';
    document.getElementById('static-frame').style.display = 'flex'; // Show static icon frame
    document.getElementById('start-btn').style.display = 'block';   // Show "Tap to Scan" button

    // Hide camera feed and stop button
    document.getElementById('reader').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'none';
}
function endTrip() {
    if (confirm(`Finish current trip? Total students boarded: ${currentBoardedCount}`)) {
        // Reset everything for the next trip
        currentBoardedCount = 0;
        document.getElementById('live-count').innerText = "0";
        document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">No students scanned yet.</p>';

        alert("Trip Logged successfully. All lists have been reset.");

        // Go back to the scanner start
        switchSection('scan');
        resetScanner();
    }
}