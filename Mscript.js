// Make addWarningMessage globally accessible
function addWarningMessage(messageText) {
    // Create a new message element
    var messageElement = document.createElement('div');
    messageElement.className = 'message warning-message';
    messageElement.textContent = messageText;

    // Append the new message element to the message container
    document.getElementById('warning-messages').prepend(messageElement);

    // Scroll to the bottom of the message container to show the latest message
    document.getElementById('left-container').scrollTop = document.getElementById('left-container').scrollHeight;
}

const socket = io();

// Handle incoming MQTT messages
socket.on('mqttMessage', (message) => {
    addWarningMessage(message);
});
