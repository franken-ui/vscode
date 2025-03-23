// src/providers/cssClassProvider.ts

import * as vscode from "vscode";
import { type CSSClass } from "../types";

export class CSSClassCompletionProvider
  implements vscode.CompletionItemProvider
{
  private getCssClasses: () => CSSClass[];

  constructor(getCssClasses: () => CSSClass[]) {
    this.getCssClasses = getCssClasses;
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const linePrefix = document
      .lineAt(position)
      .text.substring(0, position.character);

    // Check if we're in a class attribute
    if (!linePrefix.includes("class=")) {
      return undefined;
    }

    const cssClasses = this.getCssClasses();

    return cssClasses.map((cssClass) => {
      const completionItem = new vscode.CompletionItem(
        cssClass.name,
        vscode.CompletionItemKind.Value
      );

      completionItem.documentation = new vscode.MarkdownString(
        cssClass.description
      );

      if (cssClass.properties && cssClass.properties.length > 0) {
        const propertiesMarkdown = new vscode.MarkdownString();
        propertiesMarkdown.appendMarkdown(`**${cssClass.name}**\n\n`);
        propertiesMarkdown.appendMarkdown(cssClass.description + "\n\n");
        propertiesMarkdown.appendCodeblock(
          cssClass.properties.join(";\n") + ";",
          "css"
        );

        completionItem.documentation = propertiesMarkdown;
      }

      return completionItem;
    });
  }
}

export class CSSClassHoverProvider implements vscode.HoverProvider {
  private getCssClasses: () => CSSClass[];

  constructor(getCssClasses: () => CSSClass[]) {
    this.getCssClasses = getCssClasses;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    const range = document.getWordRangeAtPosition(position);
    if (!range) {
      return undefined;
    }

    const lineText = document.lineAt(position.line).text;
    const word = document.getText(range);

    // Skip if we're hovering over a tag name
    const isInsideTagName = this.isPositionInsideTagName(
      lineText,
      position.character
    );
    if (isInsideTagName) {
      return undefined;
    }

    // Check if we're inside a class attribute
    const isInsideClassAttribute = this.isPositionInsideClassAttribute(
      lineText,
      position.character
    );
    if (!isInsideClassAttribute) {
      return undefined;
    }

    const cssClasses = this.getCssClasses();
    const cssClass = cssClasses.find((c) => c.name === word);

    if (!cssClass) {
      return undefined;
    }

    // Rest of the existing code...
    const hoverContent = new vscode.MarkdownString();
    hoverContent.appendMarkdown(`**${cssClass.name}**\n\n`);
    hoverContent.appendMarkdown(cssClass.description + "\n\n");

    if (cssClass.properties && cssClass.properties.length > 0) {
      hoverContent.appendMarkdown("**CSS Properties:**\n\n");
      hoverContent.appendCodeblock(
        cssClass.properties.join(";\n") + ";",
        "css"
      );
    }

    return new vscode.Hover(hoverContent);
  }

  // Helper method to check if position is inside a tag name
  private isPositionInsideTagName(lineText: string, position: number): boolean {
    // Look for tag openings before the current position
    const textBefore = lineText.substring(0, position);
    const lastTagOpen = textBefore.lastIndexOf("<");

    if (lastTagOpen === -1) return false;

    // Check if there's a space or closing bracket after the tag opening
    const nextSpace = textBefore.indexOf(" ", lastTagOpen);
    const nextClose = textBefore.indexOf(">", lastTagOpen);

    // If no space or close bracket, or they come after our position,
    // we're inside a tag name
    return (
      (nextSpace === -1 || nextSpace > position) &&
      (nextClose === -1 || nextClose > position)
    );
  }

  // Helper method to check if position is inside a class attribute
  private isPositionInsideClassAttribute(
    lineText: string,
    position: number
  ): boolean {
    // Find class attributes before the position
    const textBefore = lineText.substring(0, position);
    const classAttrMatch = /class\s*=\s*["']([^"']*)$/i.exec(textBefore);

    if (!classAttrMatch) return false;

    // Check if we're still inside the attribute value (no closing quote after)
    const textAfter = lineText.substring(position);
    const closeQuoteMatch = /^([^"']*)["']/.exec(textAfter);

    return closeQuoteMatch !== null;
  }
}
