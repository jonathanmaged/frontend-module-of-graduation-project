
// Function to show OTA request message
function showOtaRequestMessage() {
    const otaRequestMessage = document.getElementById('ota_request_message');
    otaRequestMessage.classList.remove('hidden');
}

// Function to hide OTA request message
function hideOtaRequestMessage() {
    const otaRequestMessage = document.getElementById('ota_request_message');
    otaRequestMessage.classList.add('hidden');
}

hideOtaRequestMessage();

// Socket event listener to show OTA request message
socket.on("ota_request", () => {
    showOtaRequestMessage();
});

// Add event listeners for the buttons to hide the OTA request message
document.getElementById('update_button').addEventListener('click', () => {
    hideOtaRequestMessage();
    alert("the system will be updated now")
    const update_flag = 1 ;
    socket.emit("ota_response",update_flag);
});

document.getElementById('later_button').addEventListener('click', () => {
    hideOtaRequestMessage();
    const update_flag = 0 ;
    socket.emit("ota_response",update_flag);
});

