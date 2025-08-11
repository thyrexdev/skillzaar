#!/usr/bin/env bun

import { spawn } from "bun";
import { join, dirname } from "path";

// Get the script directory and project root
const scriptDir = process.cwd();
const projectRoot = scriptDir.endsWith('server') ? dirname(scriptDir) : scriptDir;

// Get bun executable path
const bunPath = process.execPath;

// Color codes for different services
const colors = {
  client: '\x1b[36m',    // Cyan
  auth: '\x1b[32m',      // Green
  chat: '\x1b[33m',      // Yellow
  core: '\x1b[35m',      // Magenta
  reset: '\x1b[0m'       // Reset
};

interface Service {
  name: string;
  color: string;
  command: string[];
  cwd: string;
}

const services: Service[] = [
  {
    name: "AUTH",
    color: colors.auth,
    command: [bunPath, "run", "dev"],
    cwd: join(projectRoot, "server", "auth-service")
  },
  {
    name: "CHAT",
    color: colors.chat,
    command: [bunPath, "run", "dev"],
    cwd: join(projectRoot, "server", "chat-service")
  },
  {
    name: "CORE",
    color: colors.core,
    command: [bunPath, "run", "dev"],
    cwd: join(projectRoot, "server", "core-service")
  },
  {
    name: "PAYMENT",
    color: colors.client,
    command: [bunPath, "run", "dev"],
    cwd: join(projectRoot, "server", "payment-service")
  }
];

const runningProcesses: any[] = [];

// Function to prefix logs with service name and color
function prefixLog(serviceName: string, color: string, data: string) {
  const lines = data.toString().split('\n').filter(line => {
    const trimmed = line.trim();
    // Filter out empty lines, bun watch warnings, command output lines, and empty warnings
    return trimmed && 
           !trimmed.startsWith('warn: File') && 
           !trimmed.includes('is not in the project directory and will not be watched') &&
           !trimmed.startsWith('$ bun --watch') &&
           !trimmed.startsWith('$ bun') &&
           trimmed !== 'warn:';
  });
  lines.forEach(line => {
    console.log(`${color}[${serviceName}]${colors.reset} ${line}`);
  });
}

// Function to start a service
async function startService(service: Service) {
  console.log(`${service.color}Starting ${service.name} service...${colors.reset}`);
  
  const proc = spawn({
    cmd: service.command,
    cwd: service.cwd,
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore"
  });

  runningProcesses.push(proc);

  // Handle stdout
  if (proc.stdout) {
    const reader = proc.stdout.getReader();
    (async () => {
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          prefixLog(service.name, service.color, decoder.decode(value));
        }
      } catch (error) {
        // Process ended
      }
    })();
  }

  // Handle stderr
  if (proc.stderr) {
    const reader = proc.stderr.getReader();
    (async () => {
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          prefixLog(service.name, service.color, decoder.decode(value));
        }
      } catch (error) {
        // Process ended
      }
    })();
  }

  return proc;
}

// Function to cleanup processes
function cleanup() {
  console.log('\n\nShutting down all services...');
  runningProcesses.forEach(proc => {
    try {
      proc.kill();
    } catch (error) {
      // Ignore errors when killing processes
    }
  });
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start all services
async function main() {
  console.log('🚀 Starting all Frevix server services...\n');
  
  // Start all services concurrently
  const promises = services.map(startService);
  
  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Error starting services:', error);
    cleanup();
  }
}

main().catch(console.error);
