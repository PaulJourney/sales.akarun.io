// Modal functions
function openModal() {
    const modal = document.getElementById('salesModal');
    modal.style.display = 'flex';  // Changed to flex for better centering
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

function closeModal() {
    const modal = document.getElementById('salesModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('salesModal');
    if (event.target == modal) {
        closeModal();
    }
} 