// src/utils/versionDetector.ts

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export interface FrameworkVersion {
  version: string;
  components: string;
  selectors: string;
}

// Define available versions and their corresponding files
const AVAILABLE_VERSIONS: FrameworkVersion[] = [
  {
    version: "2.1",
    components: "components-2.1.json",
    selectors: "selectors-2.1.json",
  },
];

// Default to latest version if nothing is found
const DEFAULT_VERSION = AVAILABLE_VERSIONS[0];

export async function detectFrameworkVersion(): Promise<FrameworkVersion> {
  // Get workspace folders
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.log("No workspace folder found, using default version");
    return DEFAULT_VERSION;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;

  // First check: Look for .frankenrc file
  const frankenRcPath = path.join(rootPath, ".frankenrc");
  if (fs.existsSync(frankenRcPath)) {
    try {
      const frankenRcContent = fs.readFileSync(frankenRcPath, "utf8");
      const frankenRc = JSON.parse(frankenRcContent);

      if (frankenRc.version) {
        console.log(`Found version ${frankenRc.version} in .frankenrc`);
        return findVersionConfig(frankenRc.version);
      }
    } catch (err) {
      console.warn("Error parsing .frankenrc file:", err);
    }
  }

  // Second check: Look for franken-ui in package.json
  const packageJsonPath = path.join(rootPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonContent);

      // Check dependencies and devDependencies for franken-ui
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (dependencies && dependencies["franken-ui"]) {
        // Parse version from dependency string (e.g., "^2.0.0" -> "2.0")
        const versionMatch = dependencies["franken-ui"].match(/(\d+\.\d+)/);
        if (versionMatch && versionMatch[1]) {
          console.log(`Found version ${versionMatch[1]} in package.json`);
          return findVersionConfig(versionMatch[1]);
        }
      }
    } catch (err) {
      console.warn("Error parsing package.json file:", err);
    }
  }

  // Fallback to default version
  console.log(
    `No version detected, using default version ${DEFAULT_VERSION.version}`
  );
  return DEFAULT_VERSION;
}

function findVersionConfig(versionString: string): FrameworkVersion {
  // Try to find an exact match first
  let version = AVAILABLE_VERSIONS.find((v) => v.version === versionString);

  // If no exact match, try to find a major.minor match
  if (!version) {
    const majorMinor = versionString.split(".").slice(0, 2).join(".");
    version = AVAILABLE_VERSIONS.find((v) => v.version === majorMinor);
  }

  // If still no match, use default
  if (!version) {
    console.log(
      `Version ${versionString} not found in available versions, using default`
    );
    return DEFAULT_VERSION;
  }

  return version;
}
