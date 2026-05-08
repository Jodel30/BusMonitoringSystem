let html5QrCode;
let currentBoardedCount = 0;
let tripStartTime = "";
let tripIdCounter = 1;
let currentTripId = "";

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

    // Clear list and reset count
    currentBoardedCount = 0;
    document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">No students scanned yet.</p>';
    updateCounterUI(0);
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

    fetch(`/SchoolDashboard/GetStudentData?lrn=${lrn}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 1. Add student card to the list first
                addToOnBoardList(data);

                // 2. Sync with Backend and get the REAL count from the database
                recordScanToBackend(lrn, currentTripId);

                // 3. Update Success Screen Info
                document.getElementById('scanned-name').innerText = data.name;
                document.getElementById('scanned-photo').src = data.photo || '/lib/default-avatar.png';
                document.getElementById('scanned-level').innerText = "Grade: " + data.level;

                // 4. Switch visibility
                document.getElementById('active-scanner-ui').style.display = 'none';
                document.getElementById('scan-success').style.display = 'block';
            } else {
                alert("Student not found!");
                resetScanner();
            }
        });
}

// --- COUNTER LOGIC: SYNC WITH BACKEND ---
function recordScanToBackend(lrn, tripId) {
    const id = tripId || "MANUAL-LOG";
    fetch('/DriverDashboard/RecordScan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `lrn=${encodeURIComponent(lrn)}&tripId=${encodeURIComponent(id)}`
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                // Use the count sent back by the Controller
                updateCounterUI(result.currentCount);
            }
        });
}

// Helper to update all number displays at once
function updateCounterUI(count) {
    currentBoardedCount = count;
    const activeEl = document.getElementById('active-live-count');
    const successEl = document.getElementById('success-live-count');

    if (activeEl) activeEl.innerText = count;
    if (successEl) successEl.innerText = count;
}

function addToOnBoardList(studentData) {
    const list = document.getElementById('onboardList');

    if (list.innerText.includes("No students")) {
        list.innerHTML = "";
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newItem = `
        <div class="onboard-student-card" style="background: white; border-radius: 15px; padding: 15px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 5px solid #2ecc71; display: flex; align-items: center; gap: 15px;">
            <img src="${studentData.photo || '/lib/default-avatar.png'}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover;">
            <div style="flex: 1;">
                <h4 style="margin: 0;">${studentData.name}</h4>
                <p style="margin: 0; font-size: 11px; color: #0077b6; font-weight:700;">${studentData.level}</p>
            </div>
            <div style="text-align: right; font-size: 10px; color: #94a3b8;">${time}</div>
        </div>
    `;

    list.insertAdjacentHTML('afterbegin', newItem);
}

// --- 3. END TRIP LOGIC ---
function endTrip() {
    if (confirm(`Finish current trip? Total students boarded: ${currentBoardedCount}`)) {
        stopScanner();

        const tripData = {
            tripId: currentTripId,
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

                    document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">No students scanned yet.</p>';

                    const banner = document.getElementById('main-title');
                    if (banner) {
                        banner.classList.remove('hide-banner');
                        banner.style.removeProperty('display');
                    }

                    document.getElementById('active-scanner-ui').style.display = 'none';
                    document.getElementById('scan-success').style.display = 'none';
                    document.getElementById('trip-idle-state').style.display = 'block';

                    currentBoardedCount = 0;
                    updateCounterUI(0);
                    tripIdCounter++;

                    alert("Trip Logged successfully.");
                }
            });
    }
}

function addTripToHistoryTable(id, date, start, end, count) {
    const tbody = document.getElementById('historyBody');
    if (document.getElementById('no-data-row')) document.getElementById('no-data-row').remove();
    const row = `<tr><td><span class="trip-id-tag">${id}</span></td><td>${date}</td><td style="font-size:10px;">In: ${start}<br>Out: ${end}</td><td style="text-align:center;"><span class="count-pill">${count}</span></td></tr>`;
    tbody.insertAdjacentHTML('afterbegin', row);
}

async function stopScanner() {
    if (html5QrCode) { await html5QrCode.stop(); html5QrCode = null; }
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
    if (btn.disabled) return;
    btn.innerText = "Boarded ✓";
    btn.classList.add('boarded');
    btn.disabled = true;

    let studentName = btn.parentElement.querySelector('h4').innerText;
    let lrn = btn.parentElement.parentElement.getAttribute('data-lrn') || "MANUAL";

    // Create card manually so counter updates
    addToOnBoardList({ name: studentName, level: "Manual", photo: "" });
    recordScanToBackend(lrn, currentTripId);
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