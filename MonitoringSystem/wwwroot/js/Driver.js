let html5QrCode;
let currentBoardedCount = 0;
let tripStartTime = ""; // Stores when the trip began
let tripIdCounter = 1;  // Local counter for Trip IDs

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function switchSection(id) {
    let sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    // Update titles - 'active-trip' is now your History section
    let titles = {
        'scan': 'Scanner',
        'register': 'Manual Check-in',
        'onboard': 'On-Board',
        'active-trip': 'Trip History'
    };
    document.getElementById('header-title').innerText = titles[id];
    toggleMenu();
}

// --- 1. START TRIP LOGIC ---
function handleStart() {
    console.log("Trip Started");

    // RECORD START TIME
    tripStartTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const banner = document.getElementById('main-title');
    const idleState = document.getElementById('trip-idle-state');
    const activeUI = document.getElementById('active-scanner-ui');

    if (banner) {
        banner.classList.add('hide-banner');
    }

    if (idleState) idleState.style.display = 'none';
    if (activeUI) activeUI.style.display = 'block';

    currentBoardedCount = 0;
    const liveCountEl = document.getElementById('live-count');
    if (liveCountEl) liveCountEl.innerText = "0";
}

// --- 2. SCANNER LOGIC ---
async function startScanner() {
    const banner = document.getElementById('main-title');
    if (banner) {
        banner.classList.add('hide-banner');
    }

    document.getElementById('static-frame').style.display = 'none';
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('reader').style.display = 'block';
    document.getElementById('stop-btn').style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => { onScanSuccess(decodedText); }
        );
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
                const banner = document.getElementById('main-title');
                if (banner) banner.classList.add('hide-banner');

                document.getElementById('scanned-name').innerText = data.name;
                document.getElementById('scanned-photo').src = data.photo || '/lib/default-avatar.png';
                document.getElementById('scanned-level').innerText = "Grade: " + data.level;

                currentBoardedCount++;
                const liveCountEl = document.getElementById('live-count');
                if (liveCountEl) liveCountEl.innerText = currentBoardedCount;

                document.getElementById('active-scanner-ui').style.display = 'none';
                document.getElementById('scan-success').style.display = 'block';

                addToOnBoardList(data);
            } else {
                alert("Student not found!");
                resetScanner();
            }
        });
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

// --- 3. END TRIP LOGIC (WITH BACKEND SYNC) ---
function endTrip() {
    if (confirm(`Finish current trip? Total students boarded: ${currentBoardedCount}`)) {
        stopScanner();

        // 1. Prepare Data
        const tripData = {
            tripId: "TRP-" + String(tripIdCounter++).padStart(3, '0'),
            date: new Date().toLocaleDateString(),
            startTime: tripStartTime,
            endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            boardedCount: currentBoardedCount,
            driverName: "Ricardo Dalisay"
        };

        // 2. SEND TO CONTROLLER
        fetch('/DriverDashboard/SaveTrip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tripData)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // 3. Update the History Table in the UI
                    addTripToHistoryTable(tripData.tripId, tripData.date, tripData.startTime, tripData.endTime, tripData.boardedCount);

                    // 4. Reset Scan UI
                    currentBoardedCount = 0;
                    const liveCountEl = document.getElementById('live-count');
                    if (liveCountEl) liveCountEl.innerText = "0";
                    document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">No students scanned yet.</p>';

                    // 5. Show Banner again
                    const banner = document.getElementById('main-title');
                    if (banner) {
                        banner.classList.remove('hide-banner');
                        banner.style.removeProperty('display');
                    }

                    alert("Trip Logged and Saved to Database.");

                    // 6. Return to Home
                    document.getElementById('active-scanner-ui').style.display = 'none';
                    document.getElementById('scan-success').style.display = 'none';
                    document.getElementById('trip-idle-state').style.display = 'block';
                }
            });
    }
}

// FUNCTION TO ADD TRIP TO THE VISUAL TABLE
function addTripToHistoryTable(id, date, start, end, count) {
    const tbody = document.getElementById('historyBody');
    const noData = document.getElementById('no-data-row');

    if (noData) noData.remove(); // Remove placeholder row

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

function addToOnBoardList(student) {
    const list = document.getElementById('onboardList');
    if (list.innerText.includes("No students")) {
        list.innerHTML = "";
    }

    const newItem = `<div class="student-item" style="border-left: 5px solid #2ecc71;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${student.photo || '/lib/default-avatar.png'}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Boarded: ${new Date().toLocaleTimeString()}</p>
            </div>
        </div>
        <i class="fas fa-check-circle" style="color: #2ecc71;"></i>
    </div>`;
    list.insertAdjacentHTML('afterbegin', newItem);
}