const socketio = io('http://localhost:3000'); // Replace with your server URL
mapboxgl.accessToken = 'pk.eyJ1IjoibWFyaWlhbW0iLCJhIjoiY2xwYmE2bWVoMGhwczJrcXIxNzlvaTgyaiJ9.rDjlQgOMAzkppYwBVeUG2Q';

///////////////////////////////////////// intialization section ////////////////////////////////////////////

// Initialize markers arrays
let marker_array = [];
let accidentMarkers = [];

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [30.055840, 31.357728],
    zoom: 15
});

// Initialize car icon
const carIcon = document.createElement('div');
carIcon.className = 'car-icon';
carIcon.style.backgroundImage = 'url("./black_car.JPG")';
carIcon.style.width = '30px';
carIcon.style.height = '30px';
carIcon.style.backgroundSize = 'cover';
let mymarkerId = "";
// set my car icon to a marker
const mymarker = new mapboxgl.Marker(carIcon)
    .setLngLat([map.getCenter().lng, map.getCenter().lat])
    .addTo(map);

//initialize the marker with a promise to ensure synchr.
function initializeMarker() {
    return new Promise((resolve, reject) => {
        socketio.on('carID', (ownCarID) => {
            console.log("gowa event el CARID ");
            // Set a custom ID for the marker
            mymarkerId = ownCarID;
            mymarker.getElement().id = mymarkerId;
            console.log("from maphandler: ", mymarkerId);
            resolve(); // Resolve the promise when the marker is initialized
        });
    });
}

// Call the function to initialize the marker,then use a then block to proceed
initializeMarker().then(() => {
    // console.log("Marker ID: ", mymarkerId);
    // Now you can push the marker object to the marker array
    marker_array.push({ id: mymarkerId, marker: mymarker });
    console.log("marker_array ", marker_array);
    let marker_type = "red_marker";

    ///////////////////////////////////////// function section /////////////////////////////////////////////////

    function createMarker(payload, marker_type) {
        // Create a new car icon 
        const redcarIcon = document.createElement('div');
        redcarIcon.className = 'car-icon';
        if (marker_type == "accident") {
            redcarIcon.style.backgroundImage = 'url("./accident.png")';
            redcarIcon.style.width = '35px';
            redcarIcon.style.height = '25px';
            redcarIcon.style.backgroundSize = 'cover';

            //set the caricon to a marker
            const marker = new mapboxgl.Marker(redcarIcon)
                .setLngLat([payload.lng, payload.lat])
                .addTo(map);
            console.log("here is an accident: ", payload.lng, payload.lat);

            marker.getElement().id = payload.accident_id;
            accidentMarkers.push({ id: payload.accident_id, marker: marker });
        } else {
            // For other markers, create them as before
            const redcarIcon = document.createElement('div');
            redcarIcon.className = 'car-icon';
            redcarIcon.style.backgroundImage = 'url("./red_car.png")';
            redcarIcon.style.width = '30px';
            redcarIcon.style.height = '30px';
            redcarIcon.style.backgroundSize = 'cover';

            //set the caricon to a marker
            const marker = new mapboxgl.Marker(redcarIcon)
                .setLngLat([payload.lng, payload.lat])
                .addTo(map);

            let markerId = payload.carID;
            marker.getElement().id = markerId;
            // Push the marker object to the markers array
            marker_array.push({ id: markerId, marker: marker });
        }
    }

    function removeMarkerById(id) {
        const markerIndex = marker_array.findIndex(markerObj => markerObj.id === id);
        if (markerIndex !== -1) {
            const markerObject = marker_array[markerIndex];
            const { marker } = markerObject;
            // Remove the marker from the map
            marker.remove();
            // Remove the marker object from the markers array
            marker_array.splice(markerIndex, 1);
            console.log(`Marker with id ${id} removed.`);
        } else {
            console.log(`Marker with id ${id} not found.`);
        }
    }

    function removeAllMarkers() {
        for (let i = 0; i < marker_array.length; i++) {
            // Check if marker id is not equal to your marker's id
            if (marker_array[i].id !== mymarkerId) {
                // Remove the marker from the map
                marker_array[i].marker.remove();
                // Remove the marker object from the markers array
                marker_array.splice(i, 1);
                // Decrement the index to account for removed element
                i--;
            }
        }
    }

    function putOrUpdateMap(payload, marker_type) {
        if (marker_type === "accident") {
            // Check if the accident marker already exists
            const existingAccidentMarker = accidentMarkers.find(marker => marker.id === payload.accident_id);
            if (!existingAccidentMarker) {
                // Create a new accident marker
                createMarker(payload, marker_type);
                //accidentMarkers.push({ id: payload.accident_id, marker: payload }); // Add accident marker to array
            }
        } else {
            // For other markers, check if the marker already exists
            let existingMarker = marker_array.find(marker => marker.id === payload.carID);
            if (existingMarker) {
                // Update existing marker's position 
                existingMarker.marker.setLngLat([payload.lng, payload.lat]);
            } else {
                // Create a new marker
                createMarker(payload, marker_type);
            }
        }
    }

    /////////////////////////////////////// End function section //////////////////////////////////////////////

    //////////////////////////////////////// event listening section ////////////////////////////////////////////

    // it handle ny own coordinate on the map 
    socketio.on('gpsDataupdated', (currentdata) => {
        marker_array[0].marker.setLngLat([currentdata[0], currentdata[1]]);
        map.setCenter([currentdata[0], currentdata[1]]);
    });

    socketio.on('removemarker', (other_payload) => {
        removeMarkerById(other_payload.carID);
    });

    // socketio.on('suddenbreak', (other_payload) => {
    //     marker_type = "red_marker";
    //     intersection_carArray.forEach(other_car_payload => {
    //         putOrUpdateMap(other_car_payload, marker_type);
    //     });
    // });

    socketio.on('suddenbreak', (intersection_carArray) => {
        marker_type = "red_marker";
        intersection_carArray.forEach(other_car_payload => {
            putOrUpdateMap(other_car_payload, marker_type);
        });
    });

    //////////////////////////////////////// end event listening section //////////////////////////////////////

    socketio.on('suddenbreak_message', (carID) => {
        marker_type = "red_marker";
        const message = "suddenbreak detected! be careful please from " + carID;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.classList.add('message', 'warning-message');
        const warningMessagesContainer = document.getElementById('warning-messages');
        warningMessagesContainer.appendChild(messageDiv);
    });

    socketio.on('accidentDetected', (other_payload) => {
        console.log("gowa accident event***************");
        marker_type = "accident";

        const message = "accident ahead detected! be careful.";
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.classList.add('message', 'warning-message');
        const warningMessagesContainer = document.getElementById('warning-messages');
        warningMessagesContainer.appendChild(messageDiv);
        putOrUpdateMap(other_payload, marker_type);
    });

    // it handle intersection marker coordinate in the map 
    socketio.on('intersection', (intersection_carArray) => {
        marker_type = "red_marker";
        intersection_carArray.forEach(other_car_payload => {
            putOrUpdateMap(other_car_payload, marker_type);
        });
    });

    socketio.on('intersection_message', (carID) => {
        marker_type = "red_marker";
        const message = "INTERSECTION detected! be careful please from " + carID;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.classList.add('message', 'warning-message');
        const warningMessagesContainer = document.getElementById('warning-messages');
        warningMessagesContainer.appendChild(messageDiv);
    });


    socketio.on('suddenbreakMessage', (carID) => {
        marker_type = "red_marker";
        const message = "SuddenBreak detected! be careful please from " + carID;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.classList.add('message', 'warning-message');
        const warningMessagesContainer = document.getElementById('warning-messages');
        warningMessagesContainer.appendChild(messageDiv);
    });

    // it delete all the markers of other cars in the map when i get out of the topic
    // it remove markers from the map and the markers array 

    socketio.on("delete_markers", () => {
        removeAllMarkers();
    });

    /////////////////////////////////////// end event listening section //////////////////////////////////////
});