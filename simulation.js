 const socket = io('http://localhost:3000');
 mapboxgl.accessToken = 'pk.eyJ1IjoibWFyaWlhbW0iLCJhIjoiY2xwYmE2bWVoMGhwczJrcXIxNzlvaTgyaiJ9.rDjlQgOMAzkppYwBVeUG2Q';


 //طريق امريكا المعرج 
 // const startLat = 35.50651782545116;
 // const startLng = -83.94942475268726;
 // const endLat = 35.498927692990385;
 // const endLng =  -83.93636372647782;
 //30.017729679741294, 31.262195300255957

 // very good road (keep it safe) (don't delete please)
//  const start = [30.016484942935506, 31.263206904560604]
//  const end = [30.01147052609344, 31.267260872259133]

const start = [30.012910, 31.263593]
const end = [30.013381,  31.266179]
//  const start = [30.012910, 31.263593]
//  const end = [30.013381,  31.266179]

//  const start = [30.01644269604787, 31.26325400991775]
//  const end = [30.017654117912738, 31.262267251612666]

 //  const start = [30.012910, 31.263593]
 //  const end = [30.013381,  31.266179]

 // const start = [30.014378, 31.263013]
 // const end = [30.014863, 31.265711]

//   const start = [30.028319, 31.226380]
//   const end = [30.029176, 31.232346]

//  const start = [35.50651782545116, -83.94942475268726]
//  const end = [35.498927692990385, -83.93636372647782]

 // shoubra road

//   const start = [30.16280343006511, 31.2567217420339];
//   const end =    [30.183572688486002, 31.242433889561458];


 // const startLat = 30.028319;
 // const startLng = 31.226380;
 // const endLat = 30.029176;
 // const endLng = 31.232346;

 // طريق السرايا لتجربة التقاطعات
 const startLat = start[0];
 const startLng = start[1];
 const endLat = end[0];
 const endLng = end[1];

 // const startLat = 30.012832;
 // const startLng =  31.265130;
 // const endLat = 30.013553;
 // const endLng = 31.266411;

 // const startLat = 30.016673;
 // const startLng =  31.257651;
 // const endLat = 30.017079;
 // const endLng = 31.260050;

 // const startLat = 30.017940;
 // const startLng =  31.256983;
 // const startLat = 30.028708;
 // const startLng =  31.228442;
 // const data = [30.033517, 31.229488];
 // const startLat = data[0];
 // const startLng = data[1];
 // const endLat = 29.77778719184814;
 // const endLng = 30.538408655131622;




 const sim_speed = 50;

 var routeCoordinates;

 if (!navigator.geolocation) {
     console.log("Your browser doesn't support geolocation feature!");
 } else {
     simulateMovingCar();
 }

 async function simulateMovingCar() {
     try {
         const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${ endLng},${endLat}?steps=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
         const response = await fetch(url);
         const data = await response.json();

         if (data.routes && data.routes.length > 0 && data.routes[0].legs && data.routes[0].legs.length > 0) {
             const routeSteps = data.routes[0].legs[0].steps;
             let currentStepIndex = 0;
             var route = data.routes[0].geometry;
             routeCoordinates = expandRouteCoordinates(route.coordinates);


             // console.log('Route coordinates:', routeCoordinates);

             const moveCarAlongRoute = async() => {
                 for (let i = 0; i < routeCoordinates.length; i++) {
                     const currentCoordinate = routeCoordinates[i];
                     const nextCoordinate = routeCoordinates[i + 1];

                     if (nextCoordinate) {
                         // here i make the differnce between 2 consquetive coordinates is 300 milliseconds

                         //duration = calculateDuration(currentLngLat, nextLngLat);
                         const speed = calculateSpeed(currentCoordinate, nextCoordinate, 300);

                         const bearing = calculateBearing(currentCoordinate, nextCoordinate);

                         socket.emit('gpsData', { coordinate: currentCoordinate, speed, bearing });

                         //duration = calculateDuration(currentCoordinate, nextCoordinate);

                         await new Promise(resolve => setTimeout(resolve, 300)); // Wait for number of seconds before moving to the next coordinate
                     }
                 }
                 while (1) {
                     const lastCoordinate = routeCoordinates[routeCoordinates.length - 1];
                     console.log("We have reached the end, now looping the last position indefinitely.");
                     const speed = calculateSpeed(lastCoordinate, lastCoordinate, 300);
                     const bearing = calculateBearing(lastCoordinate, lastCoordinate);
                     socket.emit('gpsData', { coordinate: lastCoordinate, speed, bearing });
                     await new Promise(resolve => setTimeout(resolve, 300));
                 }
             };
             moveCarAlongRoute();
         } else {
             console.log('No route found.');
         }
     } catch (error) {
         console.error('Error simulating car movement:', error.message);
     }
 }


 function calculateDuration(startLngLat, endLngLat) {
     // Calculate distance using Haversine formula
     const earthRadius = 6371000; // Radius of the Earth in meters
     const phi1 = startLngLat.lat * Math.PI / 180;
     const phi2 = endLngLat.lat * Math.PI / 180;
     const deltaPhi = (endLngLat.lat - startLngLat.lat) * Math.PI / 180;
     const deltaLambda = (endLngLat.lng - startLngLat.lng) * Math.PI / 180;

     const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
         Math.cos(phi1) * Math.cos(phi2) *
         Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

     const distance = Math.floor(earthRadius * c); // Distance in meters
     duration = Math.floor(distance * 1000 / sim_speed);

     return duration;
 }

 function calculateSpeed(startLngLat, endLngLat, timeInMilliSeconds) {
     const earthRadius = 6371000; // Radius of the Earth in meters

     // Calculate distance using Haversine formula
     const phi1 = startLngLat[1] * Math.PI / 180;
     const phi2 = endLngLat[1] * Math.PI / 180;
     const deltaPhi = (endLngLat[1] - startLngLat[1]) * Math.PI / 180;
     const deltaLambda = (endLngLat[0] - startLngLat[0]) * Math.PI / 180;

     const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
         Math.cos(phi1) * Math.cos(phi2) *
         Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

     const distance = earthRadius * c; // Distance in meters

     // Speed = distance / time
     const speed = distance / (timeInMilliSeconds / 1000); // Speed in meters per second
     //console.log("dist =  " + distance + "speed =  " + speed);
     return speed;
 }


 function expandRouteCoordinates(routeCoordinates) {
     const expandedCoordinates = [];

     for (let i = 0; i < routeCoordinates.length - 1; i++) {
         const currentCoordinate = routeCoordinates[i];
         const nextCoordinate = routeCoordinates[i + 1];

         const distance = calculateDistance(currentCoordinate, nextCoordinate);
         //  console.log("dist =  " + distance);
         expandedCoordinates.push([currentCoordinate[0], currentCoordinate[1]]);

         if (distance > 20) {
             const numPoints = Math.ceil(distance / 20); // Calculate number of points to interpolate
             //console.log("gwa el distance " + distance);
             // Interpolate points between current and next coordinates
             for (let j = 1; j < numPoints; j++) {
                 const ratio = j / numPoints;
                 const interpolatedLng = currentCoordinate[0] + (nextCoordinate[0] - currentCoordinate[0]) * ratio;
                 const interpolatedLat = currentCoordinate[1] + (nextCoordinate[1] - currentCoordinate[1]) * ratio;

                 expandedCoordinates.push([interpolatedLng, interpolatedLat]);
             }
         }

         /*else {
             // If distance is less than 10 meters, just add the current coordinate
             expandedCoordinates.push(currentCoordinate);
         }*/
     }
     // Add the last coordinate to the expanded coordinates
     expandedCoordinates.push(routeCoordinates[routeCoordinates.length - 1]);

     return expandedCoordinates;
 }

 function calculateDistance(coord1, coord2) {
     const earthRadius = 6371000; // Radius of the Earth in meters

     // Convert latitude and longitude from degrees to radians
     const lat1 = coord1[1] * Math.PI / 180;
     const lat2 = coord2[1] * Math.PI / 180;
     const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
     const deltaLng = (coord2[0] - coord1[0]) * Math.PI / 180;

     // Haversine formula to calculate distance
     const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
         Math.cos(lat1) * Math.cos(lat2) *
         Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
     const distance = earthRadius * c;

     return distance;
 }

 function calculateBearing(coord1, coord2) {

     var dLon = coord2[0] - coord1[0];
     var y = Math.sin(dLon) * Math.cos(coord2[1]);
     var x = Math.cos(coord1[1]) * Math.sin(coord2[1]) - Math.sin(coord1[1]) * Math.cos(coord2[1]) * Math.cos(dLon);

     var bearing = Math.atan2(y, x);
     bearing = (bearing * 180) / Math.PI; // Convert radians to degrees
     bearing = (bearing + 360) % 360; // Normalize to 0-360 degrees

     return bearing;
 }