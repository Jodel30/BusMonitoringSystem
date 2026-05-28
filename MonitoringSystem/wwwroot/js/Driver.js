let html5QrCode;
let currentBoardedCount = 0;
let tripStartTime = "";
let tripIdCounter = 1;
let currentTripId = "";
let currentShift = "";
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

    console.log("New Trip Started with ID: " + currentTripId);
    const hour = new Date().getHours();
    currentShift = (hour < 12) ? "AM" : "PM";

    const banner = document.getElementById('main-title');
    const idleState = document.getElementById('trip-idle-state');
    const activeUI = document.getElementById('active-scanner-ui');

    if (banner) banner.classList.add('hide-banner');
    if (idleState) idleState.style.display = 'none';
    if (activeUI) activeUI.style.display = 'block';

    // UI RESET
    document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">New trip started. Scan students.</p>';
    currentBoardedCount = 0;
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

    if (html5QrCode) {
        stopScanner();
    }

    let lrn = decodedText.includes('LRN:') ? decodedText.split('LRN:')[1].split('|')[0] : decodedText;

    fetch(`/SchoolDashboard/GetStudentData?lrn=${lrn.trim()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 1. ADD TO LIST (Source of truth)
                addToOnBoardList(data);

                // 2. RECORD TO BACKEND
                recordScanToBackend(lrn, currentTripId);

                // 3. UPDATE UI INFO
                document.getElementById('scanned-name').innerText = data.name;
                document.getElementById('scanned-photo').src = data.photo || '/lib/default-avatar.png';
                document.getElementById('scanned-level').innerText = data.level;
                document.getElementById('scanned-id').innerText = "ID: " + (data.id || "N/A");
                document.getElementById('scanned-address').innerText = data.address || "No Address Provided";

                // 4. SWITCH UI
                document.getElementById('active-scanner-ui').style.display = 'none';
                document.getElementById('scan-success').style.display = 'block';

                // 5. SYNC COUNTER
                updateCounterUI();
            }
            else {
               
                showSystemAlert('error', 'Boarding Denied', data.message);
                resetScanner();
            }
        }).catch(err => {
            showSystemAlert('error', 'Connection Error', 'Please check server connection.');
        });
}
// FIXED: Counter now counts the actual student cards on the screen
function updateCounterUI() {
    const list = document.getElementById('onboardList');
    // We look for every student card currently in the list
    const totalOnScreen = list.querySelectorAll('.onboard-student-card').length;

    const activeEl = document.getElementById('active-live-count');
    const successEl = document.getElementById('success-live-count');

    if (activeEl) activeEl.innerText = totalOnScreen;
    if (successEl) successEl.innerText = totalOnScreen;

    // Sync the global variable so "End Trip" shows the same number
    currentBoardedCount = totalOnScreen;
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
               
                currentBoardedCount = result.currentCount;

              
                updateCounterUI(result.currentCount);

                console.log("Count synced from server: " + currentBoardedCount);
            }
        })
        .catch(err => console.error("Manifest sync failed:", err));
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
    
    const confirmMessage = `Are you sure?`;

    showSystemAlert('confirm', 'Finish Trip?', confirmMessage, function () {

        // --- THIS CODE ONLY RUNS IF THE USER CLICKS "YES, CONTINUE" ---
        stopScanner();

        const tripData = {
            tripId: currentTripId,
            shift: currentShift, 
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
                    // 3. Add to the history table in the dashboard
                    addTripToHistoryTable(tripData.tripId, tripData.date, tripData.startTime, tripData.endTime, tripData.boardedCount);

                    // 4. RESET ALL DATA FOR THE NEXT TRIP
                    currentBoardedCount = 0;
                    updateCounterUI(0);
                    resetManualCheckinUI();
                    tripIdCounter++; 

                    // Clear student list from the phone screen
                    document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">No students scanned yet.</p>';

                    // Show the Main Banner again
                    const banner = document.getElementById('main-title');
                    if (banner) {
                        banner.classList.remove('hide-banner');
                        banner.style.removeProperty('display');
                    }

                    // Go back to the initial Start Trip screen
                    document.getElementById('active-scanner-ui').style.display = 'none';
                    document.getElementById('scan-success').style.display = 'none';
                    document.getElementById('trip-idle-state').style.display = 'block';

                    // 5. SHOW THE SUCCESS MODAL
                    showSystemAlert('success', 'Trip Logged', result.message || 'Trip successfully saved to history.');
                }
            })
            .catch(err => {
                console.error("Error:", err);
                showSystemAlert('error', 'Save Failed', 'Could not connect to the server. Please try again.');
            });
    });
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
// 1. UNLOCK THE BUTTON WHEN A REASON IS CHOSEN
function enableBoardButton(selectEl) {
    // Find the button inside the same student-item box
    const button = selectEl.closest('.student-item').querySelector('.btn-check');

    if (selectEl.value !== "") {
        button.style.opacity = "1";
        button.style.pointerEvents = "auto";
        button.style.background = "#0077b6"; // Turn to primary blue
    }
}

// 2. HANDLE BOARDING
function handleManualBoarding(btn, lrn, name, level, photo) {
    if (btn.disabled || !currentTripId) {
        alert("Please start a trip first!");
        return;
    }

    // Get the selected reason from the dropdown
    const selectEl = btn.closest('.student-item').querySelector('.manual-reason-select');
    const reason = selectEl.value;

    // A. Sync with Backend (Pass isManual=true and the reason)
    fetch('/DriverDashboard/RecordScan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `lrn=${encodeURIComponent(lrn)}&tripId=${encodeURIComponent(currentTripId)}&isManual=true&reason=${encodeURIComponent(reason)}`
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                // B. Update the Live Counter UI
                if (document.getElementById('active-live-count'))
                    document.getElementById('active-live-count').innerText = result.currentCount;

                // C. Add student to the live "On-Board" list
                const manualData = {
                    name: name,
                    level: level,
                    photo: photo,
                    status: "Manual: " + reason // Shows the reason in the list
                };
                addToOnBoardList(manualData);

                // D. UI Feedback
                btn.innerText = "Boarded ✓";
                btn.style.background = "#2ecc71";
                btn.disabled = true;
                selectEl.disabled = true; // Lock dropdown
            }
        });
}
function resetManualCheckinUI() {
    // 1. Find all boarding buttons
    const buttons = document.querySelectorAll('.btn-check');
    buttons.forEach(btn => {
        btn.innerText = "Board Student";           
        btn.style.background = "";         
        btn.disabled = false;              
        btn.style.opacity = "0.3";        
        btn.style.pointerEvents = "none";  
    });

    // 2. Find all reason dropdowns
    const selects = document.querySelectorAll('.manual-reason-select');
    selects.forEach(select => {
        select.value = "";                 
        select.disabled = false;            
    });
}

function showSystemAlert(type, title, message, onConfirm = null) {
    const modal = document.getElementById('systemAlertModal');
    const iconContainer = document.getElementById('alert-icon-container');
    const icon = document.getElementById('alert-icon');
    const okBtn = document.getElementById('alert-btn-ok');
    const cancelBtn = document.getElementById('alert-btn-cancel');

    // 1. Setup Colors and Icons
    iconContainer.className = ""; // clear
    if (type === 'success') {
        iconContainer.classList.add('alert-success');
        icon.className = "fa-solid fa-circle-check";
    } else if (type === 'error') {
        iconContainer.classList.add('alert-error');
        icon.className = "fa-solid fa-circle-xmark";
    } else if (type === 'confirm') {
        iconContainer.classList.add('alert-warning');
        icon.className = "fa-solid fa-circle-question";
    }

    // 2. Set Text
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;

    // 3. Setup Buttons
    if (onConfirm) {
        cancelBtn.style.display = "block";
        okBtn.innerText = "Yes, Continue";
        okBtn.onclick = function () {
            onConfirm();
            closeSystemAlert();
        };
    } else {
        cancelBtn.style.display = "none";
        okBtn.innerText = "Okay";
        okBtn.onclick = closeSystemAlert;
    }

    // 4. Open Modal
    modal.classList.add('active');
}

function closeSystemAlert() {
    document.getElementById('systemAlertModal').classList.remove('active');
}

