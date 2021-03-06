/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';


import * as path from 'path';
import * as vscode from 'vscode';
import * as util from 'util';
import * as proto from './protocol';
import * as textUtil from './text-util';
import {RangeSet} from './RangeSet';
import {Highlights} from './Highlights';
import {CoqDocument} from './CoqDocument';

import { workspace, TextEditor, TextEditorEdit, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions } from 'vscode-languageclient';

function createServerProcess(serverModule: string, debugOptions: string[]): ServerOptions {
    let nodejsPath = workspace.getConfiguration('nodejs')['path'] || '';
    let nodejsCmd = path.join(nodejsPath, 'node');
    
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    var args = debugOptions.concat([serverModule]);
    return {
      run: { command: nodejsCmd, args: [serverModule] },
      debug: { command: nodejsCmd, args: debugOptions.concat([serverModule]) }
    }
  }

function createServerLocalExtension(serverModule: string, debugOptions: string[]): ServerOptions {
    return {
      run: { module: serverModule },
      debug: { module: serverModule, options: { execArgv: debugOptions } }
    }
  }

export interface LtacProfTree {
  entry: {total: number; local: number; ncalls: number; max_total: number};
  children: Map<string,LtacProfTree>
}

export class CoqLanguageServer {
  private server: LanguageClient = null;

  public constructor(context: ExtensionContext) {
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    // The debug options for the server
    let debugOptions = ["--nolazy", "--debug=6004"];

    // let serverOptions = createServerProcess(serverModule, debugOptions);
    let serverOptions = createServerLocalExtension(serverModule, debugOptions);
    
    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
      // Register the server for Coq scripts
      documentSelector: ['coq'],
      synchronize: {
        // Synchronize the setting section 'languageServerExample' to the server
        configurationSection: 'coqtop',
        // Notify the server about file changes to '.clientrc files contain in the workspace
        fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
      }
    }

    // Create the language client and start the client.
    this.server = new LanguageClient('Coq Language Server', serverOptions, clientOptions);
  }
  
  public start() : vscode.Disposable {
    return this.server.start();
  }

  public onUpdateHighlights(listener: (params: proto.NotifyHighlightParams) => void) {
    this.server.onNotification(proto.UpdateHighlightsNotification.type, listener);
  }

  public onMessage(listener: (params: proto.NotifyMessageParams) => void) {
    this.server.onNotification(proto.CoqMessageNotification.type, listener);
  }

  public onReset(listener: (params: proto.NotificationParams) => void) {
    this.server.onNotification(proto.CoqResetNotification.type, listener);
  }

  public onUpdateComputingStatus(listener: (params: proto.NotifyComputingStatusParams) => void) {
    this.server.onNotification(proto.CoqComputingStatusNotification.type, listener);
  }

  public onUpdateStateViewUrl(listener: (params: proto.NotifyStateViewUrlParams) => void) {
    this.server.onNotification(proto.CoqStateViewUrlNotification.type, listener);
  }

  public interruptCoq(uri: string) {
    return this.server.sendRequest(proto.InterruptCoqRequest.type, {uri: uri});
  }

  public quitCoq(uri: string) {
    return this.server.sendRequest(proto.QuitCoqRequest.type, {uri: uri});
  }

  public resetCoq(uri: string) {
    return this.server.sendRequest(proto.ResetCoqRequest.type, {uri: uri});
  }

  public getGoal(uri: string) {
    return <Thenable<proto.CoqTopGoalResult>>this.server.sendRequest(proto.GoalRequest.type, {uri: uri});
  }

  public stepForward(uri: string) {
    return <Thenable<proto.CoqTopGoalResult>>this.server.sendRequest(proto.StepForwardRequest.type, {uri: uri});
  }

  public stepBackward(uri: string) {
    return <Thenable<proto.CoqTopGoalResult>>this.server.sendRequest(proto.StepBackwardRequest.type, {uri: uri});
  }

  public interpretToPoint(uri: string, offset: number) {
    const params = {
      uri: uri,
      offset: offset
    };
    return <Thenable<proto.CoqTopGoalResult>>this.server.sendRequest(proto.InterpretToPointRequest.type, params);
  }

  public interpretToEnd(uri: string) {
    return <Thenable<proto.CoqTopGoalResult>>this.server.sendRequest(proto.InterpretToEndRequest.type, {uri: uri});
  }
  
  public resizeView(uri: string, columns: number) : Thenable<void> {
    var x = proto.ResizeWindowRequest.type;
    return <Thenable<void>>this.server.sendRequest<proto.CoqTopResizeWindowParams,void,void>(proto.ResizeWindowRequest.type, <proto.CoqTopResizeWindowParams>{uri: uri, columns: columns});
  }

  public ltacProfSet(uri: string, enabled: boolean) : Thenable<void> {
    return <Thenable<void>>this.server.sendRequest<proto.CoqTopLtacProfSetParams,void,void>(proto.LtacProfSetRequest.type, <proto.CoqTopLtacProfSetParams>{uri: uri, enabled: enabled});
  }

  private createLtacProfResultsMap(treelist: {fst:string,snd:proto.LtacProfTree}[]) : Map<string,LtacProfTree> {
    const results = new Map<string,LtacProfTree>();
    treelist.forEach((value) =>
      results.set(value.fst, {entry: value.snd.entry, children: this.createLtacProfResultsMap(value.snd.children)}));
    return results;
  }

  public async ltacProfGetResults(uri: string) : Promise<Map<string,LtacProfTree>> {
    const results = await <Thenable<proto.LtacProfResult>>this.server.sendRequest<proto.CoqTopParams,proto.LtacProfResult,void>(proto.LtacProfResultsRequest.type, {uri: uri});
    return this.createLtacProfResultsMap(results.results);
  }

  public locate(uri: string, query: string) {
    return <Thenable<proto.CoqTopQueryResult>>this.server.sendRequest(proto.QueryRequest.type, <proto.CoqTopQueryParams>{
      uri: uri,
      queryFunction: proto.QueryFunction.Locate,
      query: query
    });
  }

  public check(uri: string, query: string) {
    return <Thenable<proto.CoqTopQueryResult>>this.server.sendRequest(proto.QueryRequest.type, <proto.CoqTopQueryParams>{
      uri: uri,
      queryFunction: proto.QueryFunction.Check,
      query: query
    });
  }

  public search(uri: string, query: string) {
    return <Thenable<proto.CoqTopQueryResult>>this.server.sendRequest(proto.QueryRequest.type, <proto.CoqTopQueryParams>{
      uri: uri,
      queryFunction: proto.QueryFunction.Search,
      query: query
    });
  }

  public searchAbout(uri: string, query: string) {
    return <Thenable<proto.CoqTopQueryResult>>this.server.sendRequest(proto.QueryRequest.type, <proto.CoqTopQueryParams>{
      uri: uri,
      queryFunction: proto.QueryFunction.SearchAbout,
      query: query
    });
  }

}