let html5QrCode;
let currentBoardedCount = 0;
let tripStartTime = "";
let tripIdCounter = 1;

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function switchSection(id) {
    let sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    let titles = {
        'scan': 'Scanner',
        'register': 'Manual Check-in',
        'onboard': 'On-Board Students',
        'active-trip': 'Trip History'
    };
    document.getElementById('header-title').innerText = titles[id];
    toggleMenu();
}

// --- 1. START TRIP LOGIC ---
function handleStart() {
    currentTripId = "TRP-" + String(tripIdCounter).padStart(3, '0');
    tripStartTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const banner = document.getElementById('main-title');
    const idleState = document.getElementById('trip-idle-state');
    const activeUI = document.getElementById('active-scanner-ui');

    if (banner) banner.classList.add('hide-banner');
    if (idleState) idleState.style.display = 'none';
    if (activeUI) activeUI.style.display = 'block';

    currentBoardedCount = 0;
    const liveCountEl = document.getElementById('live-count');
    if (liveCountEl) liveCountEl.innerText = "0";
}

// --- 2. SCANNER LOGIC ---
async function startScanner() {
    const banner = document.getElementById('main-title');
    if (banner) banner.classList.add('hide-banner');

    document.getElementById('static-frame').style.display = 'none';
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('reader').style.display = 'block';
    document.getElementById('stop-btn').style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
        await html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => { onScanSuccess(decodedText); });
    } catch (err) {
        alert("Camera error: " + err);
        resetScanner();
    }
}

function onScanSuccess(decodedText) {
    stopScanner();

    let lrn = decodedText.includes('LRN:') ? decodedText.split('LRN:')[1].split('|')[0] : decodedText;
    lrn = lrn.trim();

    // 1. Fetch student info to show on the Driver's screen
    fetch(`/SchoolDashboard/GetStudentData?lrn=${lrn}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {

                // --- NEW: SYNC WITH BACKEND MANIFEST ---
                // This records the scan so it appears in the LGU 'View Details' modal
                recordScanToBackend(lrn, currentTripId);
                // ---------------------------------------

                // Update UI Success Screen
                document.getElementById('scanned-name').innerText = data.name;
                document.getElementById('scanned-photo').src = data.photo || '/lib/default-avatar.png';
                document.getElementById('scanned-level').innerText = "Grade: " + data.level;

                // Update Counter
                currentBoardedCount++;
                const liveCountEl = document.getElementById('live-count');
                if (liveCountEl) liveCountEl.innerText = currentBoardedCount;

                // Switch UI visibility
                document.getElementById('active-scanner-ui').style.display = 'none';
                document.getElementById('scan-success').style.display = 'block';

                // Add to the local scrollable list on the phone
                addToOnBoardList(data);
            } else {
                alert("Student not found!");
                resetScanner();
            }
        });
}

// HELPER FUNCTION: Sends the scan data to the Server
function recordScanToBackend(lrn, tripId) {
    // If tripId hasn't been set yet, use a fallback
    const id = tripId || "MANUAL-LOG";

    fetch('/DriverDashboard/RecordScan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `lrn=${encodeURIComponent(lrn)}&tripId=${encodeURIComponent(id)}`
    })
        .then(res => res.json())
        .then(result => {
            console.log("Backend Manifest Updated:", result);
        })
        .catch(err => console.error("Manifest sync failed:", err));
}
// --- NEW: UPDATED ON-BOARD LIST (DETAILED CARDS) ---
function addToOnBoardList(data) {
    const list = document.getElementById('onboardList');
    if (list.innerText.includes("No students")) {
        list.innerHTML = "";
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Create a detailed mobile card
    const newItem = `
        <div class="onboard-student-card" style="background: white; border-radius: 15px; padding: 15px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 5px solid #2ecc71; display: flex; align-items: center; gap: 15px;">
            <img src="${data.photo || '/lib/default-avatar.png'}" style="width: 55px; height: 55px; border-radius: 12px; object-fit: cover; border: 1px solid #eee;">
            
            <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 14px; color: #102a43;">${data.name}</h4>
                <p style="margin: 2px 0; font-size: 11px; color: #0077b6; font-weight: 700; text-transform: uppercase;">${data.level} - ${data.section || 'N/A'}</p>
                <p style="margin: 0; font-size: 10px; color: #94a3b8;"><i class="fas fa-location-dot"></i> ${data.address || 'Bantayan Island'}</p>
            </div>

            <div style="text-align: right;">
                <span style="background: #dcfce7; color: #15803d; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 50px; text-transform: uppercase;">${data.status || 'BOARDED'}</span>
                <p style="margin: 5px 0 0; font-size: 10px; color: #94a3b8; font-weight: 600;">${time}</p>
            </div>
        </div>
    `;
    list.insertAdjacentHTML('afterbegin', newItem);
}

// --- 3. END TRIP LOGIC ---
function endTrip() {
    if (confirm(`Finish current trip? Total students boarded: ${currentBoardedCount}`)) {
        stopScanner();

        const tripData = {
            tripId: "TRP-" + String(tripIdCounter++).padStart(3, '0'),
            date: new Date().toLocaleDateString(),
            startTime: tripStartTime,
            endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            boardedCount: currentBoardedCount,
            driverName: "Ricardo Dalisay"
        };

        fetch('/DriverDashboard/SaveTrip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tripData)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    addTripToHistoryTable(tripData.tripId, tripData.date, tripData.startTime, tripData.endTime, tripData.boardedCount);

                    currentBoardedCount = 0;
                    if (document.getElementById('live-count')) document.getElementById('live-count').innerText = "0";
                    document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">No students scanned yet.</p>';

                    const banner = document.getElementById('main-title');
                    if (banner) {
                        banner.classList.remove('hide-banner');
                        banner.style.removeProperty('display');
                    }

                    alert("Trip Logged successfully.");
                    document.getElementById('active-scanner-ui').style.display = 'none';
                    document.getElementById('scan-success').style.display = 'none';
                    document.getElementById('trip-idle-state').style.display = 'block';
                }
            });
    }
}

function addTripToHistoryTable(id, date, start, end, count) {
    const tbody = document.getElementById('historyBody');
    const noData = document.getElementById('no-data-row');
    if (noData) noData.remove();

    const row = `
        <tr>
            <td><span class="trip-id-tag">${id}</span></td>
            <td>${date}</td>
            <td style="font-size:10px; color:#64748b;">In: ${start}<br>Out: ${end}</td>
            <td style="text-align:center;"><span class="count-pill">${count}</span></td>
        </tr>`;
    tbody.insertAdjacentHTML('afterbegin', row);
}

async function stopScanner() {
    if (html5QrCode) {
        await html5QrCode.stop();
        html5QrCode = null;
    }
}

function resetScanner() {
    const banner = document.getElementById('main-title');
    if (banner) banner.classList.add('hide-banner');

    document.getElementById('scan-success').style.display = 'none';
    document.getElementById('active-scanner-ui').style.display = 'block';
    document.getElementById('scanner-ui').style.display = 'block';
    document.getElementById('static-frame').style.display = 'flex';
    document.getElementById('start-btn').style.display = 'block';
    document.getElementById('reader').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'none';
}

function boardStudent(btn) {
    btn.innerText = "Boarded ✓";
    btn.classList.add('boarded');
    btn.disabled = true;

    currentBoardedCount++;
    if (document.getElementById('live-count')) document.getElementById('live-count').innerText = currentBoardedCount;

    let studentName = btn.parentElement.querySelector('h4').innerText;
    alert(studentName + " has been manually boarded.");
}

function filterStudents() {
    let input = document.getElementById('studentSearch').value.toLowerCase();
    let items = document.querySelectorAll('.student-item');
    items.forEach(item => {
        let name = (item.getAttribute('data-name') || "").toLowerCase();
        let lrn = (item.getAttribute('data-lrn') || "").toLowerCase();
        item.style.display = (name.includes(input) || lrn.includes(input)) ? "flex" : "none";
    });
}