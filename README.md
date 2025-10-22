Real-Time Vehicle Telemetry Dashboard with AI Capabilities

This project provides a complete solution for reading live data from a vehicle's On-Board Diagnostics (OBD-II) port and displaying it on a modern, web-based dashboard. Powered by an NVIDIA Jetson Nano, this platform not only visualizes data but also serves as a foundation for in-car AI, computer vision, and sensor fusion applications.

The server is designed to be resilient, featuring an automatic "Demo Mode" that generates simulated data if no OBD-II adapter is connected, making it perfect for development and showcasing without a physical vehicle connection.

Key Features:

AI-Ready Platform: Hosted on an NVIDIA Jetson Nano, enabling future expansion into real-time AI tasks like object detection from the camera feed or sensor fusion.

Real-Time Data Streaming: Connects to any standard ELM37-based OBD-II adapter and streams key vehicle metrics over WebSockets.

Comprehensive Metrics: Gathers and displays a wide range of data, including:

Primary Metrics: RPM, Vehicle Speed, Engine Load, Coolant Temperature, Fuel Level, and more.

Calculated Metrics: Real-time MPG, Acceleration (m/s²), Trip Distance, and Total Idling Time.

Vehicle Status: Ignition State and Diagnostic Trouble Codes (DTCs).

Advanced Visualization: The dashboard features:

Live Camera Feed: A real-time video stream from a connected webcam.

Foxglove LiDAR Integration: Includes a direct link to open a Foxglove Studio session in your browser, streaming live LiDAR data for professional-grade, 2D/3D visualization.

Remote Accessibility: Includes instructions for using localtunnel to easily and securely expose the dashboard to the internet, allowing you to monitor your vehicle from anywhere.

Hardware & Software Requirements

Hardware 🛠️

NVIDIA Jetson Nano: This powerful, compact AI computer serves as the brain of the project, running the backend server.

USB OBD-II Adapter: A standard ELM327-based adapter with a USB connection.

Webcam: A standard USB webcam compatible with the Jetson Nano.

LIDAR Sensor (Optional): A 2D or 3D LIDAR sensor. Required for the Foxglove LiDAR integration.

Software 💻

Jetson Nano OS: Flashed with the official NVIDIA JetPack SDK.

Python 3.7+

Required Python Libraries:

pyserial: For communicating with the USB adapter.

websockets: For real-time data streaming to the dashboard.

(Add any libraries for your Foxglove server, e.g., foxglove-websocket)

localtunnel (Optional): A command-line tool for exposing the server to the internet. Requires npm/nodejs.

Setup and Installation

Follow these steps to get your telemetry dashboard up and running on the Jetson Nano.

1. Install Python Dependencies

Open a terminal on your Jetson Nano and install the necessary Python libraries using pip:

pip install pyserial websockets
# Install Foxglove server library if needed
# pip install foxglove-websocket



2. Install localtunnel (Optional)

If you want to access your dashboard from outside your local network, you'll need to install localtunnel.

# Install Node.js and npm (if not already installed)
sudo apt update
sudo apt install npm nodejs -y

# Install localtunnel globally
sudo npm install -g localtunnel



3. Connect the Hardware

Plug the OBD-II adapter into your vehicle's OBD-II port.

Turn the vehicle's ignition to the "On" position.

Connect the USB end of the adapter to one of the Jetson Nano's USB ports.

Connect your webcam to another USB port on the Jetson Nano.

Connect your LiDAR sensor (if using) to the Jetson Nano.

How to Use

1. Start the Servers

You will need to run your server scripts.

OBD/Camera Server: Open a terminal, navigate to the project directory, and run your main server:

python3 server.py 



This will start the OBD server (e.g., on port 8080) and the Camera server (e.g., on port 8081).

Foxglove Server (If used): Open a second terminal and run your LiDAR/Foxglove server script (e.g., on port 8765).

2. Accessing the Dashboard

Method A: Local Network Access

While the server is running, you can access the dashboard from any device on the same Wi-Fi network.

Find the local IP address of your Jetson Nano (e.g., 192.168.1.15).

On another device (phone, tablet, laptop), open a web browser and navigate to the index.html file served by your server (e.g., http://<JETSON_NANO_IP>:8000/index.html if you are running a simple python http server from the directory).

Method B: Internet Access with localtunnel

To access your dashboard from anywhere, you must set up separate secure tunnels for the data and camera feeds.

Start OBD-II Data Tunnel (Port 8080)
Open a new terminal window on the Jetson Nano and run:

lt --port 8080



Note: Save the public https:// URL. Your wss:// URL will be the same but with wss:// (e.g., wss://obd-tunnel.loca.lt).

Start Camera Feed Tunnel (Port 8081)
Open a second new terminal window and run:

lt --port 8081



Note: Save the public wss:// URL (e.g., wss://camera-tunnel.loca.lt).

Update Dashboard Files

You must update your dashboard.js file with the new tunnel URLs.

In dashboard.js:
Update the WebSocket URLs for the OBD and Camera feeds.

// Update the URL for the OBD-II Data connection
const OBD_WEBSOCKET_URL = 'wss://obd-tunnel.loca.lt'; // <-- YOUR URL HERE

// Update the URL for the Camera Feed connection
const CAMERA_WEBSOCKET_URL = 'wss://camera-tunnel.loca.lt'; // <-- YOUR URL HERE



Access Dashboard
Now you can access your hosted index.html from any device with an internet connection.
