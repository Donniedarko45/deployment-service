import { exec } from "child_process";
import path from "path";
import fs from "fs";


export function buildProject(id: string) {
  return new Promise((resolve, reject) => {
    // Use absolute path and normalize it
    const outputPath = path.resolve(__dirname, 'output', id);
    
    // Create output directory if it doesn't exist
    try {
      fs.mkdirSync(outputPath, { recursive: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return reject(new Error(`Failed to create output directory: ${errorMessage}`));
    }

    // Use spawn instead of exec for better handling of spaces in paths
    const npmInstall = `npm install`;
    const npmBuild = `npm run build`;
    
    // Change to output directory first
    process.chdir(outputPath);

    const child = exec(`${npmInstall} && ${npmBuild}`, {
      cwd: outputPath,
      shell: '/bin/sh'
    });

    child.stdout?.on('data', (data: string) => {
      console.log(`[stdout] ${data.trim()}`);
    });
    
    child.stderr?.on('data', (data: string) => {
      console.log(`[stderr] ${data.trim()}`);
    });

    child.on('error', (error) => {
      reject(new Error(`Build process failed: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve("");
      } else {
        reject(new Error(`Build process failed with exit code ${code}`));
      }
    });
  });
}