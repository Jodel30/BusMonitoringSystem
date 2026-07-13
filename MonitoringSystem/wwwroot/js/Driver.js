let html5QrCode;
let currentBoardedCount = 0;
let tripStartTime = "";
let tripIdCounter = 1;
let currentTripId = "";
let currentShift = "";
let dbTripId = 0;
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

function openStartTripModal() {
    const modal = document.getElementById('startTripModal');
    if (modal) {
        modal.classList.add('active');
    }
}


// 1. Function called by the Green button in your HTML
function confirmStartTrip() {
    console.log("Opening start confirmation...");
    // This shows your custom modal "Begin Trip?"
    const modal = document.getElementById('startTripModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        // Fallback: if modal ID is wrong, just start the trip
        handleStart();
    }
}

// 2. Function called by the "Yes, Start Now" button inside the modal
async function confirmAndStart() {
    closeStartModal(); // Hide the pop-up
    await handleStart(); // Run the database initialization
}

function closeStartModal() {
    const modal = document.getElementById('startTripModal');
    if (modal) modal.classList.remove('active');
}

// 3. The actual logic that talks to the Database
async function handleStart() {
    console.log("Initializing trip in database...");

    const hour = new Date().getHours();
    currentShift = (hour < 12) ? "AM" : "PM";

    // FETCH: Tell the C# Controller to create a new row in the Trips table
    fetch('/DriverDashboard/InitializeTrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ TripSchedule: currentShift })
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                // --- THE MASTER FIX ---
                dbTripId = result.dbTripID; // We now have the REAL numeric ID (e.g. 5)
                currentTripId = "TRP-" + String(dbTripId).padStart(3, '0');

                // Update UI IDs
                const idDisplay = document.getElementById('active-trip-id-display');
                if (idDisplay) idDisplay.innerText = currentTripId + " (" + currentShift + ")";

                const banner = document.getElementById('main-title');
                if (banner) banner.classList.add('hide-banner');

                document.getElementById('trip-idle-state').style.display = 'none';
                document.getElementById('active-scanner-ui').style.display = 'block';

                document.getElementById('onboardList').innerHTML = `<p style="text-align:center; color:#8898aa; margin-top:50px;">Trip ${currentTripId} Started.</p>`;

                // Reset local variables
                currentBoardedCount = 0;
                updateCounterUI(0);

                console.log("Trip successfully linked to SQL ID: " + dbTripId);
            } else {
                showSystemAlert('error', 'Database Error', 'Could not start trip.');
            }
        })
        .catch(err => {
            console.error("Critical Start Error:", err);
            showSystemAlert('error', 'Connection Error', 'Check server connection.');
        });
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
    lrn = lrn.trim(); // Ensure no spaces

    fetch(`/SchoolDashboard/GetStudentData?lrn=${encodeURIComponent(decodedText.trim())}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // --- NEW: HIDE FROM MANUAL LIST ---
                // We find the box in the 'Manual Check-in' tab that matches this LRN
                const manualItem = document.querySelector(`.student-item[data-lrn="${lrn}"]`);
                if (manualItem) {
                    manualItem.style.display = 'none'; // Remove it from the list
                }
                // -----------------------------------

                // 1. ADD TO ON-BOARD LIST
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
function recordScanToBackend(lrn) {
    // Ensure we are sending the Number we got from InitializeTrip
    const tripId = parseInt(dbTripId);

    fetch('/DriverDashboard/RecordScan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `lrn=${encodeURIComponent(lrn)}&tripId=${tripId}&isManual=false`
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                // This updates the '0' on your screen to '1' immediately
                updateCounterUI(result.currentCount);
            }
        });
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
    const confirmMessage = `Finish current trip? Total boarded: ${currentBoardedCount}`;

    showSystemAlert('confirm', 'Finish Trip?', confirmMessage, function () {
        stopScanner();

        // --- THE FIX: Use the REAL Database ID saved in your global variable ---
        // We use dbTripId (the number from SQL) instead of guessing from the string
        const tripData = {
            TripID: dbTripId,           // Use the global variable number
            UserID: 0,                   // Placeholder
            TotalBoarded: currentBoardedCount,
            TripSchedule: currentShift,
            StartTime: tripStartTime,
            EndTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            Date: new Date().toLocaleDateString(),
            Status: "Completed"
        };

        console.log("SENDING TO SERVER:", tripData);

        fetch('/DriverDashboard/SaveTrip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(tripData)
        })
            .then(response => {
                if (!response.ok) return response.text().then(err => { throw new Error(err) });
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    // SUCCESS logic...
                    addTripToHistoryTable(currentTripId, tripData.Date, tripData.StartTime, tripData.EndTime, currentBoardedCount);

                    // RESET EVERYTHING
                    currentBoardedCount = 0;
                    updateCounterUI(0);
                    resetManualCheckinUI();
                    tripIdCounter++;
                    dbTripId = 0; // Reset the database ID tracker

                    document.getElementById('onboardList').innerHTML = '<p style="text-align:center; color:#8898aa; margin-top:50px;">No students scanned yet.</p>';
                    if (document.getElementById('main-title')) document.getElementById('main-title').classList.remove('hide-banner');

                    document.getElementById('active-scanner-ui').style.display = 'none';
                    document.getElementById('scan-success').style.display = 'none';
                    document.getElementById('trip-idle-state').style.display = 'block';

                    // Show success modal with the real message from server
                    showSystemAlert('success', 'Trip Logged', result.message);
                }
            })
            .catch(err => {
                console.error("Critical Error:", err);
                showSystemAlert('error', 'Save Failed', 'Data format mismatch. Check your F12 Console.');
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
    console.log("Stopping camera and returning to Active UI...");

    // 1. Kill the actual camera hardware stream
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
            html5QrCode = null; // Clear the instance
        } catch (err) {
            console.warn("Scanner was already stopped or not running.");
        }
    }

    // 2. UI RESET: Hide the Camera Feed and Stop Button
    document.getElementById('reader').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'none';

    // 3. UI RESET: Show the "Tap to Scan" button and the dashed frame
    // This brings you back to the state seen in your screenshot
    document.getElementById('static-frame').style.display = 'flex';
    document.getElementById('start-btn').style.display = 'block';

    // Ensure the "End Current Trip" button is still visible
    const endTripBtn = document.querySelector('.btn-end-trip');
    if (endTripBtn) endTripBtn.style.display = 'block';
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

// --- NEW: FUNCTION TO HIDE STUDENT FROM MANUAL LIST ---
function hideStudentFromManualList(lrn) {
    // Find the student item that has the matching LRN
    const studentItem = document.querySelector(`.student-item[data-lrn="${lrn}"]`);

    if (studentItem) {
        // Add a smooth fade-out animation
        studentItem.style.transition = "0.4s";
        studentItem.style.opacity = "0";
        studentItem.style.transform = "translateX(20px)";

        // Remove it from the layout after the animation finishes
        setTimeout(() => {
            studentItem.style.display = "none";

            // Check if the list is now empty
            const visibleItems = document.querySelectorAll('.student-item[style*="display: block"], .student-item:not([style*="display: none"])');
            if (visibleItems.length === 0) {
                document.getElementById('studentList').innerHTML =
                    '<p style="text-align:center; color:#8898aa; margin-top:50px;">All students are currently on-board.</p>';
            }
        }, 400);
    }
}

/* --- DRIVER DASHBOARD UNIQUE PROFILE LOGIC --- */
function drv_toggleProfile() {
    const drvBox = document.getElementById('drv_profileBox');

    if (drvBox.style.display === 'block') {
        drvBox.style.display = 'none';
    } else {
        // Fetch current user data from the backend
        fetch('/Account/GetMyProfile')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Fill the mobile dropdown with real backend data
                    document.getElementById('drv-name').innerText = data.name;
                    document.getElementById('drv-role').innerText = data.role;
                    document.getElementById('drv-user').innerText = "@" + data.username;
                    document.getElementById('drv-contact').innerText = data.contact || "N/A";

                    drvBox.style.display = 'block';
                }
            });
    }
}

// Close dropdown if driver clicks anywhere else on the screen
window.addEventListener('click', function (e) {
    const drvBox = document.getElementById('drv_profileBox');
    const trigger = document.querySelector('.drv-user-trigger');

    if (drvBox && trigger) {
        if (!trigger.contains(e.target) && !drvBox.contains(e.target)) {
            drvBox.style.display = 'none';
        }
    }
}); 


