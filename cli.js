#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

// Get the directory where the package is installed
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.join(__dirname);

// Function to check if a port is available
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => {
            resolve(false);
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
}

// Function to find an available port
async function findAvailablePort(startPort = 3000) {
    let port = startPort;
    while (port < startPort + 100) { // Try up to 100 ports
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }
    throw new Error('No available ports found');
}

// Function to run npm command
function runNpmCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
        const child = spawn(npm, ['run', command, ...args], {
            stdio: 'inherit',
            cwd: packageDir,
            env: { ...process.env }
        });

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with code ${code}`));
                return;
            }
            resolve();
        });
    });
}

async function main() {
    try {
        // Find an available port
        const port = await findAvailablePort();
        console.log(`Starting ADB Web Interface on port ${port}...`);
        
        // Set the port in the environment
        process.env.PORT = port.toString();
        await runNpmCommand('start');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main(); 