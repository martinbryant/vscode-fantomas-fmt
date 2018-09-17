'use strict';
import * as vscode from 'vscode';
const cp = require('child_process');

let onData: (data: string) => void;
const terminalName = 'fantomas';

vscode.window.onDidOpenTerminal(e => {
  if (e.name !== terminalName) {
    return;
  }
  (e as any).onDidWriteData(data => {
    console.log('Terminal ' + e.name + ' - data: ', data);
    onData && onData(data);
  });
});

function getTerminal(context: vscode.ExtensionContext) {
  let term = vscode.window.terminals.find(t => t.name === terminalName);
  if (term) {
    return term;
  }
  term = vscode.window.createTerminal(terminalName);
  context.subscriptions.push(term);
  return term;
}

export function runOnShell(cmd: any): { output?: string; err?: string } {
  try {
    let output = cp.execSync(cmd);
    log(output.toString());
    return { output: output.toString() };
  } catch (e) {
    logerr(e);
    return { err: e.toString() };
  }
}

export function runOnTerminal(context: vscode.ExtensionContext, cmd: string, endMatch: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    const term = getTerminal(context);
    let buffer = "";
    onData = data => {
      buffer += data;
      if (buffer.includes(endMatch)) {
        clearTimeout(timer);
        try {
          resolve(buffer);
        } catch (ex) {
          vscode.window.showErrorMessage("[fantomas-fmt] can't read formatted output");
          logerr(ex.message);
          reject(ex.message);
        }
      }
    };
    term.sendText(cmd);
  });
}


export function log(input) {
  console.log('[fantomas-fmt] ' + input);
}

export function logerr(input) {
  console.error('[fantomas-fmt] ' + input);
}
