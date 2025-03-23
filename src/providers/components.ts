import * as vscode from "vscode";
import { type Component } from "../types";

export class ComponentCompletionProvider
  implements vscode.CompletionItemProvider
{
  private getComponents: () => Component[];

  constructor(getComponents: () => Component[]) {
    this.getComponents = getComponents;
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const linePrefix = document
      .lineAt(position)
      .text.substring(0, position.character);

    // More lenient check for tag context
    if (!linePrefix.includes("<")) {
      return undefined;
    }

    // Get current components
    const components = this.getComponents();

    return components.map((component) => {
      const completionItem = new vscode.CompletionItem(
        component.tagName,
        vscode.CompletionItemKind.Class
      );

      completionItem.documentation = new vscode.MarkdownString(
        component.description
      );
      completionItem.insertText = new vscode.SnippetString(
        `${component.tagName}$1>$0</${component.tagName}>`
      );
      completionItem.detail = `${component.tagName} Component`;

      return completionItem;
    });
  }
}

export class ComponentAttributeCompletionProvider
  implements vscode.CompletionItemProvider
{
  private getComponents: () => Component[];

  constructor(getComponents: () => Component[]) {
    this.getComponents = getComponents;
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const linePrefix = document
      .lineAt(position)
      .text.substring(0, position.character);

    // Check if we're in a tag context
    const tagMatch = linePrefix.match(/<([\w-]+)([^>]*)$/);
    if (!tagMatch) {
      return undefined;
    }

    const tagName = tagMatch[1];
    const components = this.getComponents();
    const component = components.find((c) => c.tagName === tagName);

    if (!component) {
      return undefined;
    }

    return component.attributes.map((attr) => {
      const completionItem = new vscode.CompletionItem(
        attr.name,
        vscode.CompletionItemKind.Property
      );

      completionItem.documentation = new vscode.MarkdownString(
        attr.description
      );

      if (attr.values && attr.values.length > 0) {
        completionItem.insertText = new vscode.SnippetString(
          `${attr.name}="\${1|${attr.values.join(",")}|}"$0`
        );
      } else if (attr.type === "boolean") {
        completionItem.insertText = new vscode.SnippetString(`${attr.name}$0`);
      } else {
        completionItem.insertText = new vscode.SnippetString(
          `${attr.name}="$1"$0`
        );
      }

      if (attr.required) {
        completionItem.detail = `${attr.name} (required)`;
      } else {
        completionItem.detail = attr.name;
      }

      if (attr.default) {
        completionItem.detail += ` - Default: ${attr.default}`;
      }

      return completionItem;
    });
  }
}

// Add this class to your existing components.ts file:

export class ComponentHoverProvider implements vscode.HoverProvider {
  private getComponents: () => Component[];

  constructor(getComponents: () => Component[]) {
    this.getComponents = getComponents;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Get current line text
    const lineText = document.lineAt(position.line).text;

    // Look for uk-* components in the line
    const tagMatch = /<(uk-[a-zA-Z0-9-]+)/.exec(
      lineText.substring(0, position.character + 20)
    );
    if (!tagMatch) return null;

    // Check if the cursor is within the tag name
    const tagStart = lineText.indexOf(tagMatch[1], tagMatch.index);
    const tagEnd = tagStart + tagMatch[1].length;
    if (position.character < tagStart || position.character > tagEnd)
      return null;

    // Find matching component
    const tagName = tagMatch[1];
    const component = this.getComponents().find((c) => c.tagName === tagName);
    if (!component) return null;

    // Create the hover content
    const content = new vscode.MarkdownString();
    content.appendMarkdown(`## ${component.tagName}\n\n`);
    content.appendMarkdown(`${component.description}\n\n`);

    if (component.attributes && component.attributes.length > 0) {
      content.appendMarkdown(`**Attributes:**\n\n`);
      component.attributes.forEach((attr) => {
        content.appendMarkdown(`- \`${attr.name}\`: ${attr.description}\n`);
      });
    }

    // Get range for the component tag
    const range = new vscode.Range(
      position.line,
      tagStart,
      position.line,
      tagEnd
    );

    return new vscode.Hover(content, range);
  }
}

export class ComponentAttributeHoverProvider implements vscode.HoverProvider {
  private getComponents: () => Component[];

  constructor(getComponents: () => Component[]) {
    this.getComponents = getComponents;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Get current line text
    const lineText = document.lineAt(position.line).text;

    // Find word at current position (attribute name)
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return null;
    const attributeName = document.getText(wordRange);

    // Find the uk-* tag that contains this attribute
    const beforeCursor = lineText.substring(0, position.character);
    const tagRegex = /<(uk-[a-zA-Z0-9-]+)/g;
    let tagMatch;
    let lastTagMatch = null;

    while ((tagMatch = tagRegex.exec(beforeCursor)) !== null) {
      lastTagMatch = tagMatch;
    }

    if (!lastTagMatch) return null;

    // Get tag name from the match
    const tagName = lastTagMatch[1];

    // Make sure the cursor is not inside the tag name itself
    const tagNameStart = lastTagMatch.index + 1; // +1 for '<'
    const tagNameEnd = tagNameStart + tagName.length;
    if (
      position.character >= tagNameStart &&
      position.character <= tagNameEnd
    ) {
      return null;
    }

    // Check if the closing bracket appears before our position
    const closingBracketPos = beforeCursor.indexOf(">", lastTagMatch.index);
    if (closingBracketPos !== -1 && closingBracketPos < position.character) {
      return null;
    }

    // Find the component and attribute
    const component = this.getComponents().find((c) => c.tagName === tagName);
    if (!component) return null;

    const attribute = component.attributes.find(
      (attr) => attr.name === attributeName
    );
    if (!attribute) return null;

    // Create hover content
    const content = new vscode.MarkdownString();
    content.appendMarkdown(`**${attribute.name}**\n\n`);
    content.appendMarkdown(`${attribute.description}\n\n`);

    if (attribute.type) {
      content.appendMarkdown(`**Type:** ${attribute.type}\n\n`);
    }

    if (attribute.default) {
      content.appendMarkdown(`**Default:** ${attribute.default}\n\n`);
    }

    if (attribute.values && attribute.values.length > 0) {
      content.appendMarkdown(
        `**Allowed Values:** ${attribute.values.join(", ")}\n\n`
      );
    }

    return new vscode.Hover(content, wordRange);
  }
}
