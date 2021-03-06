'use strict';


import * as path from 'path';
import * as vscode from 'vscode';
import * as util from 'util';
import { workspace, TextEditor, TextEditorEdit, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions } from 'vscode-languageclient';


import * as proto from './protocol';
import {CoqDocumentListener} from './CoqDocumentListener';


vscode.Range.prototype.toString = function rangeToString() {return `[${this.start.toString()},${this.end.toString()})`}
vscode.Position.prototype.toString = function positionToString() {return `{${this.line}@${this.character}}`}

console.log(`Coq Extension: process.version: ${process.version}, process.arch: ${process.arch}}`);



// from 'vscode-languageserver'
// export interface TextDocumentIdentifier {
//     uri: string;
// } 


let documents : CoqDocumentListener;

export function activate(context: ExtensionContext) {
  documents = new CoqDocumentListener(context);
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.quit', quitCoq));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.reset', resetCoq));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.interrupt', interruptCoq));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.stepForward', stepForward));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.stepBackward', stepBackward));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.interpretToPoint', interpretToPoint));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.interpretToEnd', interpretToEnd));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.check', check));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.locate', locate));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.search', search));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.searchAbout', searchAbout)); 
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.viewGoalState', viewGoalState)); 
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.viewGoalStateExternal', viewGoalStateExternal));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.ltacProfStart', ltacProfStart));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.ltacProfStop', ltacProfStop));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.ltacProfGetResults', ltacProfGetResults));

  // vscode.languages.registerCompletionItemProvider('coq', {provideCompletionItems: provideOptionCompletions}, 'X');
}

// function provideOptionCompletions(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionItem[] {
//   const wordRange = document.lineAt(position.line);
//   if(!wordRange)
//     return [];
//   const wordAtPosition = document.getText();
//   const optionsMatch = /^[(.*)]$/.exec(wordAtPosition);
//   if(optionsMatch) {
//     const options = optionsMatch[1].split('|');
//     return options.map((o) => <vscode.CompletionItem>{label:o});
//   }
//   
// }

async function queryStringFromPlaceholder(prompt: string, editor: TextEditor) {
  let placeHolder = editor.document.getText(editor.selection);
  if(editor.selection.isEmpty)
    placeHolder = editor.document.getText(editor.document.getWordRangeAtPosition(editor.selection.active));
  return await vscode.window.showInputBox({
    prompt: prompt,
    value: placeHolder
    });
}

async function check(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    await doc.check(await queryStringFromPlaceholder("Check:", editor));
}

async function locate(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    await doc.locate(await queryStringFromPlaceholder("Locate:", editor));
}

async function search(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    await doc.search(await queryStringFromPlaceholder("Search:", editor));
}

async function searchAbout(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    await doc.searchAbout(await queryStringFromPlaceholder("Search About:", editor));
}


async function quitCoq(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    await doc.quitCoq(editor);
}

function resetCoq(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.resetCoq(editor);
}

function interruptCoq(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.interruptCoq();
}

function stepForward(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.stepForward(editor);
}

function stepBackward(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.stepBackward(editor);
}

function interpretToPoint(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.interpretToCursorPosition(editor);
}

function interpretToEnd(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.interpretToEnd(editor);
}

function viewGoalState(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.viewGoalState(editor,false);
}

function viewGoalStateExternal(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.viewGoalState(editor,true);
}

function ltacProfStart(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.ltacProfSet(true);
}

function ltacProfStop(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.ltacProfSet(false);
}

function ltacProfGetResults(editor: TextEditor, edit: TextEditorEdit) {
  const doc = documents.get(editor.document.uri.toString());
  if(doc)
    doc.ltacProfGetResults();
}