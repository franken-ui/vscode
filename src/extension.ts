// src/extension.ts

import * as vscode from "vscode";
import {
  ComponentCompletionProvider,
  ComponentAttributeCompletionProvider,
  ComponentHoverProvider,
  ComponentAttributeHoverProvider,
} from "./providers/components";
import {
  CSSClassCompletionProvider,
  CSSClassHoverProvider,
} from "./providers/selectors";
import { detectFrameworkVersion, FrameworkVersion } from "./utils/version";
import { reloadData } from "./utils/loader";
import { type Component } from "./types";
import { type CSSClass } from "./types";

// Global state to hold the current components and classes
let currentComponents: Component[] = [];
let currentCssClasses: CSSClass[] = [];
let currentVersion: FrameworkVersion | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log("Franken UI extension is activating...");

  // Detect version and load initial data
  currentVersion = await detectFrameworkVersion();
  console.log(`Detected Franken UI version: ${currentVersion.version}`);

  const data = await reloadData(context, currentVersion);
  currentComponents = data.components;
  currentCssClasses = data.cssClasses;

  console.log(
    `Loaded ${currentComponents.length} components and ${currentCssClasses.length} CSS classes`
  );

  // Register providers with the current data
  registerProviders(context);

  // Register status bar item to show current version
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = `Franken UI: ${currentVersion.version}`;
  statusBarItem.tooltip = "Click to change Franken UI version";
  statusBarItem.command = "franken-ui.selectVersion";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register command to select version manually
  context.subscriptions.push(
    vscode.commands.registerCommand("franken-ui.selectVersion", async () => {
      const versions = ["2.1"];
      const selected = await vscode.window.showQuickPick(versions, {
        placeHolder: "Select Franken UI version",
      });

      if (selected) {
        // Update version and reload data
        currentVersion = {
          version: selected,
          components: `components-${selected}.json`,
          selectors: `selectors-${selected}.json`,
        };

        const newData = await reloadData(context, currentVersion);
        currentComponents = newData.components;
        currentCssClasses = newData.cssClasses;

        // Update status bar
        statusBarItem.text = `Franken UI: ${currentVersion.version}`;

        vscode.window.showInformationMessage(
          `Franken UI version set to ${selected}`
        );
      }
    })
  );

  // Register command to check extension status
  context.subscriptions.push(
    vscode.commands.registerCommand("franken-ui.showStatus", () => {
      vscode.window.showInformationMessage(
        `Franken UI extension is active! Using version ${
          currentVersion?.version || "unknown"
        }`
      );
    })
  );

  console.log("Franken UI extension is now active!");
}

// Function to register providers with access to the current data
function registerProviders(context: vscode.ExtensionContext) {
  // Create a language selector for all supported HTML-like languages
  const htmlLikeLanguages = [
    "html",
    "latte",
    "blade",
    "twig",
    "php",
    "smarty",
    "razor",
    "django-html",
    "jinja",
    "erb",
    "liquid",
    "handlebars",
    "mustache",
    "ejs",
    "vue",
    "svelte",
    "astro",
  ];

  // Component completion provider
  const componentProvider = new ComponentCompletionProvider(
    () => currentComponents
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      htmlLikeLanguages.map((lang) => ({ scheme: "file", language: lang })),
      componentProvider,
      "<"
    )
  );

  // Component attribute completion provider
  const attributeProvider = new ComponentAttributeCompletionProvider(
    () => currentComponents
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      htmlLikeLanguages.map((lang) => ({ scheme: "file", language: lang })),
      attributeProvider,
      " ",
      "="
    )
  );

  // CSS class completion provider
  const cssClassProvider = new CSSClassCompletionProvider(
    () => currentCssClasses
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      htmlLikeLanguages.map((lang) => ({ scheme: "file", language: lang })),
      cssClassProvider,
      '"',
      "'",
      " "
    )
  );

  // CSS class hover provider
  const cssHoverProvider = new CSSClassHoverProvider(() => currentCssClasses);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      htmlLikeLanguages.map((lang) => ({ scheme: "file", language: lang })),
      cssHoverProvider
    )
  );

  // Component hover provider for uk-* components
  const componentHoverProvider = new ComponentHoverProvider(
    () => currentComponents
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      htmlLikeLanguages.map((lang) => ({ scheme: "file", language: lang })),
      componentHoverProvider
    )
  );

  // Component attribute hover provider
  const componentAttributeHoverProvider = new ComponentAttributeHoverProvider(
    () => currentComponents
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      htmlLikeLanguages.map((lang) => ({ scheme: "file", language: lang })),
      componentAttributeHoverProvider
    )
  );
}

export function deactivate() {}
