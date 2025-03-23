import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { type Component } from "../types";
import { CSSClass } from "../types";
import { FrameworkVersion } from "./version";

export async function loadComponentsData(
  context: vscode.ExtensionContext,
  version: FrameworkVersion
): Promise<Component[]> {
  try {
    // Load from extension resources
    const filePath = path.join(
      context.extensionPath,
      "resources",
      version.components
    );

    if (!fs.existsSync(filePath)) {
      console.warn(`Components file not found: ${filePath}`);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent) as Component[];
  } catch (error) {
    console.error("Failed to load components data:", error);
    return [];
  }
}

export async function loadCSSClassesData(
  context: vscode.ExtensionContext,
  version: FrameworkVersion
): Promise<CSSClass[]> {
  try {
    // Load from extension resources
    const filePath = path.join(
      context.extensionPath,
      "resources",
      version.selectors
    );

    if (!fs.existsSync(filePath)) {
      console.warn(`CSS classes file not found: ${filePath}`);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent) as CSSClass[];
  } catch (error) {
    console.error("Failed to load CSS classes data:", error);
    return [];
  }
}

// Add a function to reload data when version changes
export async function reloadData(
  context: vscode.ExtensionContext,
  version: FrameworkVersion
): Promise<{
  components: Component[];
  cssClasses: CSSClass[];
}> {
  const components = await loadComponentsData(context, version);
  const cssClasses = await loadCSSClassesData(context, version);

  return { components, cssClasses };
}
