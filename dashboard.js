document.addEventListener('DOMContentLoaded', (event) => {
    
    // --- Configuration and DOM Element Selection ---
    const statusDiv = document.getElementById('status');
    
    // 1. IMPORTANT: REPLACE WITH YOUR ACTIVE WSS:// TUNNEL FOR OBD (8080)
    const OBD_WEBSOCKET_URL = 'wss://flat-paths-rush.loca.lt'; 
    const socket = new WebSocket(OBD_WEBSOCKET_URL);

    // 2. IMPORTANT: REPLACE WITH YOUR ACTIVE WSS:// TUNNEL FOR CAMERA (8081)
    const CAMERA_WEBSOCKET_URL = 'wss://lemon-heads-appear.loca.lt'; // REPLACE THIS
    let cameraSocket = null;
    let isCameraOn = false;

    // DOM Elements (from your HTML)
    const dataElements = {
        rpm: document.getElementById('rpm'),
        speed: document.getElementById('speed'),
        coolantTemp: document.getElementById('coolantTemp'),
        engineLoad: document.getElementById('engineLoad'),
        fuelLevel: document.getElementById('fuelLevel'),
        throttlePos: document.getElementById('throttlePos'),
        mafAirFlow: document.getElementById('mafAirFlow'),
        mpg: document.getElementById('mpg'),
        batteryVoltage: document.getElementById('batteryVoltage'),
        soc: document.getElementById('soc'),
        idlingTime: document.getElementById('idlingTime'),
        acceleration: document.getElementById('acceleration'),
        tripDistance: document.getElementById('tripDistance'),
        dtc: document.getElementById('dtc'),
        ignitionState: document.getElementById('ignitionState'),
    };

    // This must match the <img> element in index.html
    const videoElement = document.getElementById('cameraFeed'); 
    const cameraContainer = document.getElementById('camera-container');
    const cameraToggleButton = document.getElementById('camera-toggle-btn');
    const cameraToggleStatus = document.getElementById('camera-toggle-status');
    const cameraPlaceholder = document.getElementById('camera-placeholder');


    // ====================================================================
    //                  CAMERA STREAMING FUNCTIONS (WebSockets)
    // ====================================================================

    /**
    * Starts the camera stream by connecting to the dedicated WebSocket server (8081).
    */
    async function startCamera() {
        // 1. Setup UI for connection attempt
        cameraPlaceholder.style.display = 'flex';
        videoElement.style.display = 'none';
        cameraToggleStatus.textContent = 'Camera is ON (Connecting...)';
        cameraContainer.classList.add('visible');
        
        try {
            if (cameraSocket) {
                cameraSocket.close();
            }

            // 2. Establish WebSocket connection to the camera server using WSS://
            cameraSocket = new WebSocket(CAMERA_WEBSOCKET_URL);

            cameraSocket.onopen = function() {
                cameraToggleStatus.textContent = 'Camera is ON (Streaming YOLOv8n)';
                cameraToggleButton.textContent = 'Stop Camera Feed';
                isCameraOn = true;
                console.log('Camera WebSocket connected to WSS port 8081.');
            };

            cameraSocket.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.frame) {
                        // 3. Render the Base64 image received from the server (YOLO annotated frame)
                        videoElement.src = 'data:image/jpeg;base64,' + data.frame;
                        
                        // Display the image element after the first frame arrives
                        cameraPlaceholder.style.display = 'none';
                        videoElement.style.display = 'block';
                    }
                } catch (e) {
                    console.error("Error parsing camera frame data:", e);
                }
            };

            cameraSocket.onclose = function() {
                stopCamera();
                cameraToggleStatus.textContent = 'Camera is OFF (Stream Ended)';
            };

            cameraSocket.onerror = function(error) {
                console.error('Camera WebSocket error. Check WSS tunnel status and URL in JS:', error);
                cameraToggleStatus.textContent = 'Camera is OFF (Error)';
                stopCamera();
            };
            

        } catch (error) {
            // This catch handles errors during the creation of the WebSocket object itself
            console.error("Error initializing camera socket: ", error); 
            cameraToggleStatus.textContent = 'Camera Unavailable (Socket Init Failed)';
            cameraToggleButton.disabled = true;
            isCameraOn = false;
        }
    }

    /**
    * Stops the camera stream by closing the WebSocket connection.
    */
    function stopCamera() {
        if (cameraSocket) {
            cameraSocket.close();
            cameraSocket = null;
        }
        videoElement.src = ''; // Clear image source
        cameraContainer.classList.remove('visible');
        cameraToggleButton.textContent = 'Show Camera Feed';
        cameraToggleStatus.textContent = 'Camera is OFF';
        isCameraOn = false;
    }

    // Attach event listener to the camera toggle button - SAFE due to DOMContentLoaded
    cameraToggleButton.addEventListener('click', () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    });


    // ====================================================================
    //                  OBD-II DATA FUNCTIONS (Port 8080)
    // ====================================================================

    function resetDashboard() {
        for(const key in dataElements) {
            const element = dataElements[key];
            if (key === 'dtc') {
                element.textContent = '---';
                element.classList.remove('has-dtc', 'no-dtc');
            } else if (key === 'ignitionState') {
                element.textContent = '---';
                element.classList.remove('Off', 'On', 'Running');
            }
            else {
                element.textContent = '---';
            }
        }
    }

    function setStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type; // 'success', 'error', or 'warning'
    }

    // --- OBD WebSocket Handlers ---

    socket.onopen = function(event) {
        setStatus('Status: Connected to OBD server. Awaiting OBD-II data...', 'warning');
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.status === 'disconnected') {
            setStatus(`Status: ${data.error}`, 'error');
            resetDashboard();
            return;
        }
        
        setStatus('Status: Connected and receiving data.', 'success');

        for (const key in data) {
            if (dataElements[key]) {
                const value = data[key];
                const element = dataElements[key];

                if (value === null || value === undefined) {
                    element.textContent = 'N/A';
                    if (key === 'ignitionState') element.classList.remove('Off', 'On', 'Running');
                    if (key === 'dtc') element.classList.remove('has-dtc', 'no-dtc');
                    continue;
                }
                
                if (key === 'ignitionState') {
                    element.textContent = value;
                    element.classList.remove('Off', 'On', 'Running');
                    element.classList.add(value);
                } else if (key === 'dtc') {
                    // Check if value is not 'None' (from the server) or an empty string
                    // Note: Your Python server sends "None" or a list of codes.
                    const hasDTCs = value && value !== 'None'; 
                    element.textContent = hasDTCs ? value : 'None';
                    element.classList.remove('has-dtc', 'no-dtc');
                    element.classList.add(hasDTCs ? 'has-dtc' : 'no-dtc');
                } else if (key === 'idlingTime') {
                    const date = new Date(0);
                    date.setSeconds(value);
                    element.textContent = date.toISOString().substr(11, 8);
                } else if (typeof value === 'number') {
                    element.textContent = Number(value).toFixed(1);
                } else {
                    element.textContent = value;
                }
            }
        }
    };

    socket.onclose = function(event) {
        setStatus('Status: Disconnected from OBD server. Please restart the Python server and refresh.', 'error');
        resetDashboard();
        stopCamera(); 
    };

    socket.onerror = function(error) {
        setStatus('Status: OBD connection error. Is the Python server running?', 'error');
        resetDashboard();
        stopCamera(); 
    };

}); // <--- END OF DOMContentLoaded WRAPPER
