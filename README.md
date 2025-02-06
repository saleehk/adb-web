# ADB Web Interface

A modern web-based interface for Android Debug Bridge (ADB) that makes device management and debugging easier through an intuitive browser interface. Built with Node.js and Next.js for a fast, responsive experience.

## Features

- 🔌 **Device Management**
  - View connected devices
  - Monitor device status
  - Support for multiple devices
  - Device information display

- 📁 **File Management**
  - Browse device files
  - Upload/download files
  - Drag and drop support

- 📱 **App Management**
  - Install/uninstall applications
  - Manage app data
  - View app information

- 🛠 **System Controls**
  - Screen capture
  - Shell command execution
  - System logs viewer
  - Device reboot options

- 🎨 **Modern UI**
  - Clean, responsive interface
  - Real-time updates
  - Dark/Light theme support

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- ADB (Android Debug Bridge) installed and in system PATH
- Web browser (Chrome, Firefox, Safari)
- USB debugging enabled on Android device

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/adb-web.git
   cd adb-web
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Tech Stack

- **Frontend**:
  - Next.js 14
  - React
  - Tailwind CSS
  - Shadcn UI

- **Backend**:
  - Node.js
  - ADB Node.js wrapper
  - WebSocket for real-time updates

## Usage

1. **Connect Device**
   - Connect your Android device via USB
   - Enable USB debugging on your device
   - Your device should appear in the web interface

2. **File Management**
   - Use the file explorer to browse device storage
   - Upload files by dragging and dropping
   - Download files by selecting them in the interface

3. **App Management**
   - View all installed applications
   - Install new APKs
   - Manage app data and permissions

4. **System Controls**
   - Take screenshots
   - View system logs
   - Execute shell commands

## Development

The project is under active development. Check the [plan.md](plan.md) file for the roadmap and upcoming features.

To contribute:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

For development:
```bash
# Run in development mode
npm run dev
# or
yarn dev

# Build for production
npm run build
# or
yarn build

# Start production server
npm start
# or
yarn start
```

## Security Notice

This tool provides direct access to connected Android devices. Use with caution and ensure proper security measures are in place when deploying in a network environment.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Android Debug Bridge (ADB) team
- All contributors to this project

## Support

For issues, feature requests, or questions:
- Open an issue in the GitHub repository
- Contact the maintainers

---
Made with ❤️ for Android developers and enthusiasts
