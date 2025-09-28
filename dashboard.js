// dashboard.js (Rewritten with hardcoded WebSocket)

document.addEventListener("DOMContentLoaded", () => {
    // --- Element Cache ---
    const statusDiv = document.getElementById('status');
    const cameraFeed = document.getElementById('cameraFeed');
    const cameraPlaceholder = document.getElementById('camera-placeholder');
    const lidarCanvas = document.getElementById('lidar-canvas');
    const lidarCtx = lidarCanvas.getContext('2d');
    
    // Cache for all the metric display elements
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
        idlingTime: document.getElementById('idlingTime'),
        acceleration: document.getElementById('acceleration'),
        tripDistance: document.getElementById('tripDistance'),
        dtc: document.getElementById('dtc'),
        ignitionState: document.getElementById('ignitionState'),
    };

    let lidarAnimationId = null;

    // --- Utility Functions ---
    function setStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
    }

    // --- Lidar Simulation (Unchanged) ---
    function drawLidar() {
        const w = lidarCanvas.width;
        const h = lidarCanvas.height;
        const centerX = w / 2;
        const centerY = h - 20;

        lidarCtx.fillStyle = '#000';
        lidarCtx.fillRect(0, 0, w, h);
        lidarCtx.fillStyle = '#007bff';
        lidarCtx.fillRect(centerX - 10, centerY - 5, 20, 10);

        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI;
            const maxDist = Math.min(centerX, centerY);
            let distance = Math.random() * maxDist;
            if (Math.random() > 0.95) {
                distance = Math.random() * (maxDist * 0.4) + (maxDist * 0.2);
            }
            const x = centerX - Math.cos(angle) * distance;
            const y = centerY - Math.sin(angle) * distance;
            lidarCtx.fillStyle = `rgba(0, 245, 212, ${1 - (distance / maxDist)})`;
            lidarCtx.beginPath();
            lidarCtx.arc(x, y, 1.5, 0, Math.PI * 2);
            lidarCtx.fill();
        }
        lidarAnimationId = requestAnimationFrame(drawLidar);
    }

    function startLidar() {
        const rect = lidarCanvas.parentElement.getBoundingClientRect();
        lidarCanvas.width = rect.width;
        lidarCanvas.height = rect.height;
        if (lidarAnimationId) cancelAnimationFrame(lidarAnimationId);
        drawLidar();
    }

    // --- WebSocket Connection & Logic ---
    
    // !! IMPORTANT !!
    // Manually change this URL to your Jetson's IP address or your localtunnel URL.
    // For local connection: 'ws://192.168.1.XX:8080'
    // For localtunnel:    'wss://your-subdomain.loca.lt'
    const socket = new WebSocket('ws://neat-frogs-run.loca.lt');

    socket.onopen = () => {
        setStatus('Status: Connected to vehicle.', 'success');
        startLidar();
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        // Route message based on its type
        if (message.type === 'obd_data') {
            updateMetrics(message.payload);
        } else if (message.type === 'video_frame') {
            // Hide placeholder and show the image feed
            if (cameraPlaceholder.style.display !== 'none') {
                cameraPlaceholder.style.display = 'none';
                cameraFeed.style.display = 'block';
            }
            // Update the image source with the new frame data
            cameraFeed.src = 'data:image/jpeg;base64,' + message.payload;
        }
    };

    socket.onclose = () => {
        setStatus('Status: Disconnected. Please check the server and refresh.', 'error');
        if (lidarAnimationId) cancelAnimationFrame(lidarAnimationId);
    };

    socket.onerror = () => {
        setStatus('Status: Connection error. Is the server running?', 'error');
        socket.close();
    };

    function updateMetrics(data) {
        if (data.status) {
            const statusMap = {
                'connected': 'Connected to OBD-II Adapter',
                'demo': 'Running in Demo Mode',
                'disconnected': 'OBD-II Connection Lost...'
            };
            const typeMap = {
                'connected': 'success',
                'demo': 'warning',
                'disconnected': 'error'
            };
            setStatus(`Status: ${statusMap[data.status] || data.status}`, typeMap[data.status] || 'info');
        }

        for (const key in data) {
            const element = dataElements[key];
            if (!element) continue;

            const value = data[key];
            if (value === null || typeof value === 'undefined') {
                element.textContent = '---';
                continue;
            }

            if (key === 'ignitionState') {
                element.textContent = value;
                element.className = `metric-value text-status ignitionState ${value}`;
            } else if (key === 'dtc') {
                const hasDTCs = value && value.length > 0 && value !== 'None';
                element.textContent = hasDTCs ? value : 'None';
                element.className = `metric-value small-text dtc ${hasDTCs ? 'has-dtc' : 'no-dtc'}`;
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

    // --- Initial Setup ---
    window.addEventListener('resize', startLidar);
});
