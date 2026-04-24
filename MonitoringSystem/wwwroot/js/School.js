function previewFile() {
    const preview = document.getElementById('previewImg');
    const icon = document.getElementById('placeholderIcon');
    const file = document.getElementById('studentPhoto').files[0];
    const reader = new FileReader();

    reader.onloadend = function () {
        preview.src = reader.result;
        preview.style.display = "block"; // Show image
        icon.style.display = "none";     // Hide icon
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
        preview.style.display = "none";
        icon.style.display = "block";
    }
}
function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    // Prevents scrolling the background when modal is open
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    // Restores scrolling
    document.body.style.overflow = 'auto';
}

// Function to preview the profile picture
function previewFile() {
    const preview = document.getElementById('previewImg');
    const icon = document.getElementById('placeholderIcon');
    const file = document.getElementById('studentPhoto').files[0];
    const reader = new FileReader();

    reader.onloadend = function () {
        preview.src = reader.result;
        preview.style.display = "block";
        icon.style.display = "none";
    }

    if (file) { reader.readAsDataURL(file); }
}
function viewQRCode(base64Data) {
    // 1. Find the image in the modal and set the source
    const qrImg = document.getElementById('fullSizeQR');
    qrImg.src = "data:image/png;base64," + base64Data;

    // 2. Show the modal
    document.getElementById('qrModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQRView() {
    document.getElementById('qrModalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}