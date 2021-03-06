'use strict';

import * as net from 'net'; 
import * as util from 'util';
import * as events from 'events'; 
// var xml2js = require('xml2js');
// import * as stream from 'stream'; 
import * as coqXml from './coq-xml';
import * as coqProto from './coq-proto';
import {ChildProcess, exec, spawn} from 'child_process';
import {CoqTopSettings, LtacProfResult, LtacProfTree} from './protocol';
import * as fs from 'fs';
import * as os from 'os';
import {asyncWithTimeout} from './CancellationSignal';
// import entities = require('entities'); 
// const spawn = require('child_process').spawn;


// from vscode-languageserver
export interface RemoteConsole {
    error(message: string): any;
    warn(message: string): any;
    info(message: string): any;
    log(message: string): any;
}

export interface FailureResult {
  stateId?: number;
  message: string;
  range?: coqProto.Location;
}

export interface InitResult {
  stateId: number;
}
export interface AddResult {
  stateId: number;
  unfocusedStateId?: number;
  message: string;
}
export interface EditAtFocusResult {
  stateId: number;
  qedStateId: number;
  oldStateIdTip: number;
}
export interface EditAtResult {
  newFocus?: EditAtFocusResult;
}
export interface GoalResult {
  goals?: coqProto.Goal[];
  backgroundGoals?: coqProto.Goal[];
  shelvedGoals?: coqProto.Goal[];
  abandonedGoals?: coqProto.Goal[];
}


export interface CoqOptions {
  asymmetricPatterns: boolean;
  atomicLoad: boolean;
  automaticCoercionsImport: boolean;
  automaticIntroduction: boolean;
  booleanEqualitySchemes: boolean;
  bracketingLastIntroductionPattern: boolean;
  bulletBehavior: string; // enum {Strict}
  subproofsCaseAnalysisSchemes: boolean;
  compatNotations: boolean;
  congruenceDepth: number;
  congruenceVerbose: boolean;
  contextualImplicit: boolean;
  debugAuto: boolean;
  debugEauto: boolean;
  debugRAKAM: boolean;
  debugTacticUnification: boolean;
  debugTrivial: boolean;
  debugUnification: boolean;
  decidableEqualitySchemes: boolean;
  defaultClearingUsedHypotheses: boolean;
  defaultGoalSelector: number;
  defaultProofMode: string; // enum {Classic}
  defaultProofUsing: any;
  defaultTimeout: number;
  dependentPropositionsElimination: boolean;
  discriminateIntroduction: boolean;
  dumpBytecode: boolean;
  eliminationSchemes: boolean;
  equalityScheme: boolean;
  extractionAutoInline: boolean;
  extractionConservativeTypes: boolean;
  extractionFileComment: string;
  extractionFlag: number;
  extractionKeepSingleton: boolean;
  extractionOptimize: boolean;
  extractionSafeImplicits: boolean;
  extractionTypeExpand: boolean;
  firstorderDepth: number;
  hideObligations: boolean;
  implicitArguments: boolean;
  infoAuto: boolean;
  infoEauto: boolean;
  infoLevel: any;
  infoTrivial: boolean;
  injectionL2RPatternOrder: boolean;
  injectionOnProofs: boolean;
  inlineLevel: number;
  intuitionIffUnfolding: boolean;
  intuitionNegationUnfolding: boolean;
  kernelTermSharing: boolean;
  keyedUnification: boolean;
  looseHintBehavior: string; // enum {Lax}
  maximalImplicitInsertion: boolean;
  nonrecursiveEliminationSchemes: boolean;
  parsingExplicit: boolean;
  primitiveProjections: boolean;
  printingAll: boolean;
  printingCoercions: boolean;
  printingDepth: number;
  printingExistentialInstances: boolean;
  printingImplicit: boolean;
  printingImplicitDefensive: boolean;
  printingMatching: boolean;
  printingNotations: boolean;
  printingPrimitiveProjectionCompatibility: boolean;
  printingPrimitiveProjectionParameters: boolean;
  printingProjections: boolean;
  printingRecords: boolean;
  printingSynth: boolean;
  printingUniverses: boolean;
  printingWidth: number;
  printingWildcard: boolean;
  programMode: boolean;
  proofUsingClearUnused: boolean;
  recordEliminationSchemes: boolean;
  regularSubstTactic: boolean;
  reversiblePatternImplicit: boolean;
  rewritingSchemes: boolean;
  shortModulePrinting: boolean;
  shrinkObligations: boolean;
  simplIsCbn: boolean;
  standardPropositionEliminationNames: boolean;
  strictImplicit: boolean;
  strictProofs: boolean;
  strictUniverseDeclaration: boolean;
  stronglyStrictImplicit: boolean;
  suggestProofUsing: boolean;
  tacticCompatContext: boolean;
  tacticEvarsPatternUnification: boolean;
  transparentObligations: boolean;
  typeclassResolutionAfterApply: boolean;
  typeclassResolutionForConversion: boolean;
  typeclassesDebug: boolean;
  typeclassesDependencyOrder: boolean;
  typeclassesDepth: any;
  yypeclassesModuloEta: boolean;
  typeclassesStrictResolution: boolean;
  typeclassesUniqueInstances: boolean;
  typeclassesUniqueSolutions: boolean;
  universalLemmaUnderConjunction: boolean;
  universeMinimizationToSet: boolean;
  universePolymorphism: boolean;
  verboseCompatNotations: boolean;
  // Asynchronous options:
  function_debug: boolean;
  function_raw_tcc: boolean;
  functionalInductionRewriteDependent: boolean;
  hypsLimit: any;
  ltacDebug: boolean;
  silent: boolean;
  undo: any
  // [DEPRECATED] Tables: Search Blacklist Printing Coercion Printing If Printing Let Printing Record Printing Constructor
  // [DEPRECATED] Extraction AccessOpaque: boolean;
  // [DEPRECATED] Refine Instance Mode: boolean;
  // [DEPRECATED] Tactic Pattern Unification: boolean;

}

// export interface CoqOptions {
// Asymmetric Patterns: false;
//  Atomic Load: true Automatic Coercions Import: false Automatic Introduction: true Boolean Equality Schemes: false Bracketing Last Introduction Pattern: false Bullet Behavior: Strict Subproofs Case Analysis Schemes: false Compat Notations: true Congruence Depth: 100 Congruence Verbose: false Contextual Implicit: false Debug Auto: false Debug Eauto: false Debug RAKAM: false Debug Tactic Unification: false Debug Trivial: false Debug Unification: false Decidable Equality Schemes: false Default Clearing Used Hypotheses: false Default Goal Selector: 1 Default Proof Mode: Classic Default Proof Using: undefined Default Timeout: undefined Dependent Propositions Elimination: true Discriminate Introduction: true Dump Bytecode: false Elimination Schemes: true Equality Scheme: false [DEPRECATED] Extraction AccessOpaque: true Extraction AutoInline: false Extraction Conservative Types: false Extraction File Comment: Extraction Flag: 495 Extraction KeepSingleton: false Extraction Optimize: true Extraction SafeImplicits: true Extraction TypeExpand: true Firstorder Depth: 3 Hide Obligations: false Implicit Arguments: false Info Auto: false Info Eauto: false Info Level: undefined Info Trivial: false Injection L2R Pattern Order: true Injection On Proofs: false Inline Level: 100 Intuition Iff Unfolding: false Intuition Negation Unfolding: true Kernel Term Sharing: true Keyed Unification: false Loose Hint Behavior: Lax Maximal Implicit Insertion: false Nonrecursive Elimination Schemes: false Parsing Explicit: false Primitive Projections: false Printing All: false Printing Coercions: false Printing Depth: 4611686018427387903 Printing Existential Instances: false Printing Implicit: false Printing Implicit Defensive: true Printing Matching: true Printing Notations: true Printing Primitive Projection Compatibility: true Printing Primitive Projection Parameters: true Printing Projections: false Printing Records: true Printing Synth: true Printing Universes: false Printing Width: 78 Printing Wildcard: true Program Mode: false Proof Using Clear Unused: false Record Elimination Schemes: false [DEPRECATED] Refine Instance Mode: true Regular Subst Tactic: false Reversible Pattern Implicit: false Rewriting Schemes: false Short Module Printing: false Shrink Obligations: false SimplIsCbn: false Standard Proposition Elimination Names: false Strict Implicit: true Strict Proofs: false Strict Universe Declaration: true Strongly Strict Implicit: false Suggest Proof Using: false Tactic Compat Context: false Tactic Evars Pattern Unification: true [DEPRECATED] Tactic Pattern Unification: true Transparent Obligations: true Typeclass Resolution After Apply: false Typeclass Resolution For Conversion: true Typeclasses Debug: false Typeclasses Dependency Order: false Typeclasses Depth: undefined Typeclasses Modulo Eta: false Typeclasses Strict Resolution: false Typeclasses Unique Instances: false Typeclasses Unique Solutions: false Universal Lemma Under Conjunction: false Universe Minimization ToSet: true Universe Polymorphism: false Verbose Compat Notations: false Asynchronous options: Function_debug: false Function_raw_tcc: false Functional Induction Rewrite Dependent: true Hyps Limit: undefined Ltac Debug: false Silent: false Undo: undefined [DEPRECATED] Tables: Search Blacklist Printing Coercion Printing If Printing Let Printing Record Printing Constructor
// 
// }

// export interface StateStatusUpdate {
//   stateId: number;
//   status: coqProto.SentenceStatus;
//   worker: string
// }
// export interface StateError {
//   stateId: number;
//   message: string;
//   location?: coqProto.Location
// }
// export interface StateWorkerStatusUpdate {
//   stateId: number;
//   workerUpdates: coqProto.WorkerStatus[]
// }
// export interface StateFileDependencies {
//   stateId: number;
//   fileDependencies:  Map<string,string[]>
// }
// export interface StateFileLoaded {
//   stateId: number;
//   status: coqProto.FileLoaded
// }
// export interface EditFeedback {
//   editId: number;
//   error?: coqProto.ErrorMessage
// }
// export interface Message {
//   level: coqProto.MessageLevel;
//   message: string
// }

export interface EventCallbacks {
  onStateStatusUpdate? : (stateId: number, route: number, status: coqProto.SentenceStatus, worker: string) => void;
  onStateError? : (stateId: number, route: number, message: string, location?: coqProto.Location) => void;
  onStateWorkerStatusUpdate? : (stateId: number, route: number, workerUpdates: coqProto.WorkerStatus[]) => void;
  onStateFileDependencies? : (stateId: number, route: number, fileDependencies: Map<string,string[]>) => void;
  onStateFileLoaded? : (stateId: number, route: number, status: coqProto.FileLoaded) => void;
  onEditFeedback? : (editId: number, error?: coqProto.ErrorMessage) => void;
  onMessage? : (level: coqProto.MessageLevel, message: string) => void;
  onClosed?: (error?: string) => void;
}



export class CoqTop extends events.EventEmitter {
  private mainChannelServer: net.Server;
  private mainChannelServer2: net.Server;
  private controlChannelServer: net.Server;
  private controlChannelServer2: net.Server;
  private mainChannelR : net.Socket;
  private mainChannelW : net.Socket;
  private controlChannelW : net.Socket;
  private controlChannelR : net.Socket;
  private console: RemoteConsole;
  private coqtopProc : ChildProcess = null;
  private parser : coqXml.XmlStream;
  private callbacks: EventCallbacks;
  private readyToListen: Thenable<void>[];
  private settings : CoqTopSettings;

  constructor(settings : CoqTopSettings, console: RemoteConsole, callbacks?: EventCallbacks) {
    super();
    this.settings = settings;
    this.console = console;
    this.callbacks = callbacks;
    this.mainChannelServer = net.createServer();
    this.mainChannelServer2 = net.createServer();
    this.controlChannelServer = net.createServer();
    this.controlChannelServer2 = net.createServer();
    this.mainChannelServer.maxConnections = 1;
    this.mainChannelServer2.maxConnections = 1;
    this.controlChannelServer.maxConnections = 1;
    this.controlChannelServer2.maxConnections = 1;
    
    this.readyToListen = [
      this.startListening(this.mainChannelServer),
      this.startListening(this.mainChannelServer2),
      this.startListening(this.controlChannelServer),
      this.startListening(this.controlChannelServer2)
    ];


    // this.resetCoq(coqPath);
  }

  cleanup(error?: string) {
    if(this.coqtopProc) {
      try {
        this.coqtopProc.kill();
        this.coqtopProc.disconnect();
      } catch(e) {}
      this.coqtopProc = null;
    }
    // if(this.mainChannelServerR)
    //   this.mainChannelServerR.close();
    // if(this.mainChannelServerW)
    //   this.mainChannelServerW.close();
    // if (this.controlChannelServerR)
    //   this.controlChannelServerR.close();
    // if (this.controlChannelServerW)
    //   this.controlChannelServerW.close();
    try {
    if (this.mainChannelR)
      this.mainChannelR.end();
    if (this.mainChannelW)
      this.mainChannelW.end();
    if (this.controlChannelR)
      this.controlChannelR.end();
    if (this.controlChannelW)
      this.controlChannelW.end();
    } catch(err) {
      var x = 0;
    }

    this.callbacks.onClosed(error);
  }

  public isRunning() : boolean {
    return this.coqtopProc != null;
  }
  
  private checkState() : void {
    if(this.coqtopProc === null)
      this.resetCoq();
  }
  
  private startListening(server: net.Server) : Promise<void> {
    const port = 0;
    const host = 'localhost';
    return new Promise<void>((resolve,reject) => {
      server.listen({port: port, host: host}, (err) => {
        if (err)
          reject(err);
        else {
          this.console.log(`Listening at ${server.address().address}:${server.address().port}`);
          resolve();
        }
      });
    });
  }
  
  private acceptConnection(server: net.Server, name:string, dataHandler?: (data:string) => void) : Promise<net.Socket> {
    return new Promise<net.Socket>((resolve) => {
      server.once('connection', (socket:net.Socket) => {
        this.console.log(`Client connected on ${name} (port ${socket.localPort})`);
        socket.setEncoding('utf8');
        if (dataHandler)
          socket.on('data', (data) => dataHandler(data));
        socket.on('error', (err) => this.onCoqTopError(err.toString() + ` (${name})`));
        resolve(socket);
      });
    });
  }
  
  
  public async resetCoq() : Promise<InitResult> {    
    this.console.log('reset');
    this.cleanup(undefined);

    // await this.setupCoqTopWindows();
      
    if (this.settings.wrapper && this.settings.wrapper != "" && fs.existsSync(this.settings.wrapper))
      await this.setupCoqTop(true);
    else if(os.platform() !== 'win32')
      await this.setupCoqTop(false);
    else
      await this.setupCoqTopWindows();
    
    return await this.coqInit();
  }

  public async setupCoqTop(useWrapper: boolean) : Promise<void> {
    await Promise.all(this.readyToListen);

    var mainAddr = this.mainChannelServer.address();
    var controlAddr = this.controlChannelServer.address();
    var mainAddressArg = mainAddr.address + ':' + mainAddr.port;
    var controlAddressArg = controlAddr.address + ':' + controlAddr.port;

    try {
      if(useWrapper)
        this.startCoqTop(this.spawnCoqTopWrapper(mainAddressArg, controlAddressArg));
      else
        this.startCoqTop(this.spawnCoqTop(mainAddressArg, controlAddressArg));
    } catch(error) {
      this.console.error('Could not spawn coqtop: ' + error);
      throw <FailureResult>{ message: 'Could not spawn coqtop' };
    }

    let channels = await Promise.all([
        this.acceptConnection(this.mainChannelServer, 'main channel',(data) => this.onMainChannelR(data)), //, 'main channel R', (data) => this.onMainChannelR(data)),
        this.acceptConnection(this.controlChannelServer, 'control channel', (data) => this.onControlChannelR(data)),
      ]);
    this.mainChannelR = channels[0];
    this.mainChannelW = channels[0];
    this.controlChannelR = channels[1];
    this.controlChannelW = channels[1];
    
    this.parser = new coqXml.XmlStream(this.mainChannelR, {
      onStateFeedback: (feedback: coqProto.StateFeedback) => this.onStateFeedback(feedback),
      onEditFeedback: (feedback: coqProto.EditFeedback) => this.onEditFeedback(feedback),
      onMessage: (msg: coqProto.Message) => this.onMessage(msg),
      onOther: (x: any) => this.onOther(x),
      onError: (x: any) => this.onError(x)
    });
    
    // this.mainChannelR.on('data', (data) => this.onMainChannelR(data));
  }
  
  public async setupCoqTopWindows() : Promise<void> {    
    await Promise.all(this.readyToListen);

    var mainAddr = this.mainChannelServer.address();
    var mainPortW = this.mainChannelServer2.address().port;
    var controlAddr = this.controlChannelServer.address();
    var controlPortW = this.controlChannelServer2.address().port;
    var mainAddressArg = mainAddr.address + ':' + mainAddr.port + ':' + mainPortW;
    var controlAddressArg = controlAddr.address + ':' + controlAddr.port + ':' + controlPortW;

    try {
      this.startCoqTop(this.spawnCoqTop(mainAddressArg, controlAddressArg));
    } catch(error) {
      this.console.error('Could not spawn coqtop: ' + error);
      throw <FailureResult>{ message: 'Could not spawn coqtop' };
    }

    let channels = await Promise.all([
        this.acceptConnection(this.mainChannelServer, 'main channel R',(data) => this.onMainChannelR(data)), //, 'main channel R', (data) => this.onMainChannelR(data)),
        this.acceptConnection(this.mainChannelServer2, 'main channel W', (data) => this.onMainChannelW(data)),
        this.acceptConnection(this.controlChannelServer, 'control channel R', (data) => this.onControlChannelR(data)),
        this.acceptConnection(this.controlChannelServer2, 'control channel W', (data) => this.onControlChannelW(data)),
      ]);
    this.mainChannelR = channels[0];
    this.mainChannelW = channels[1];
    this.controlChannelR = channels[2];
    this.controlChannelW = channels[3];

    this.parser = new coqXml.XmlStream(this.mainChannelR, {
      onStateFeedback: (feedback: coqProto.StateFeedback) => this.onStateFeedback(feedback),
      onEditFeedback: (feedback: coqProto.EditFeedback) => this.onEditFeedback(feedback),
      onMessage: (msg: coqProto.Message) => this.onMessage(msg),
      onOther: (x: any) => this.onOther(x),
      onError: (x: any) => this.onError(x)
    });
    
    // this.mainChannelR.on('data', (data) => this.onMainChannelR(data));
  }
  
  private onCoqTopError(message: string) : void {
    this.console.error('Error: ' + message);
    this.cleanup(message);
  }
  
  private startCoqTop(process : ChildProcess) {
    this.coqtopProc = process;
    this.console.log(`coqtop started with pid ${this.coqtopProc.pid}`);
    this.coqtopProc.stdout.on('data', (data) => this.coqtopOut(data))
    this.coqtopProc.on('exit', (code) => {
      this.console.log('coqtop exited with code: ' + code);
    });
    this.coqtopProc.stderr.on('data', (data) => {
      this.console.log('coqtop-stderr: ' + data);
    });
    this.coqtopProc.on('close', (code) => {
      this.console.log('coqtop closed with code: ' + code);
      this.cleanup('coqtop closed with code: ' + code);
    });
    this.coqtopProc.on('error', (code) => {
      this.console.log('coqtop could not be started: ' + code);
      this.cleanup('coqtop could not be started: ' + code);
    });
    // this.coqtopProc.stdin.write('\n');
 }

  private spawnCoqTop(mainAddr : string, controlAddr: string) {
    var coqtopModule = this.settings.coqPath + '/coqtop';
    // var coqtopModule = 'cmd';
    var args = [
      // '/D /C', this.coqPath + '/coqtop.exe',
      '-main-channel', mainAddr,
      '-control-channel', controlAddr,
      '-ideslave',
      '-async-proofs', 'on'
      ].concat(this.settings.args);
    this.console.log('exec: ' + coqtopModule + ' ' + args.join(' '));
    return spawn(coqtopModule, args, {detached: false});
  }

  private spawnCoqTopWrapper(mainAddr : string, controlAddr: string) : ChildProcess {
    // var coqtopModule = this.coqPath + '/coqtop';
    var coqtopModule = this.settings.wrapper;
    // var coqtopModule = 'cmd';
    var args = [
      // '/D /C', this.coqPath + '/coqtop.exe',
      '-coqtopbin', this.settings.coqPath + '/coqtop',
      // '-tracefile', 'C:/Users/cj/Desktop/coqtrace.txt',
      '-main-channel', mainAddr,
      '-control-channel', controlAddr,
      '-ideslave',
      '-async-proofs', 'on'
      ].concat(this.settings.args);
    this.console.log('exec: ' + coqtopModule + ' ' + args.join(' '));
    return spawn(coqtopModule, args, {detached: false});
  }
// 
//   private spawnCoqTop() {
//     try {
//       // var coqtopModule = this.coqPath + '/coqtop';
//       var coqtopModule = 'cmd';
//       var mainAddr = this.mainChannelServerR.address();
//       var mainPortW = this.mainChannelServerW.address().port;
//       var controlAddr = this.controlChannelServerR.address();
//       var controlPortW = this.controlChannelServerW.address().port;
//       var args = [
//         '/D /C', this.coqPath + '/coqtop.exe',
//         '-main-channel', mainAddr.address + ':' + mainAddr.port + ':' + mainPortW,
//         '-control-channel', controlAddr.address + ':' + controlAddr.port + ':' + controlPortW,
//         '-ideslave',
//         '-async-proofs', 'on'
//         ];
//       this.console.log('exec: ' + coqtopModule + ' ' + args.toLocaleString());
//       this.coqtopProc = spawn(coqtopModule, args, {detached: true});
//       this.console.log(`coqtop started with pid ${this.coqtopProc.pid}`);
//       // this.coqtopProc.unref();
//       this.coqtopProc.stdout.on('data', this.coqtopOut)
//       this.coqtopProc.on('exit', (code) => {
//         this.console.log('coqtop exited with code: ' + code);
//         // this.cleanup();
//       });
//       this.coqtopProc.stderr.on('data', (data) => {
//         this.console.log('coqtop-stderr: ' + data);
//       });
//       this.coqtopProc.on('close', (code) => {
//         this.console.log('coqtop closed with code: ' + code);
//         this.cleanup();
//       });
//       this.coqtopProc.on('error', (code) => {
//         this.console.log('coqtop could not be started: ' + code);
//         this.cleanup();
//       });
//     } catch (error) {
//       this.console.error('Could not spawn coqtop: ' + error);
//       throw <FailureResult>{message: 'Could not spawn coqtop'};
//     }
//   }
//   
  
  
  // coqParser = new xml2js.Parser({
  //   trim: true,
  //   normalizeTags: true,
  //   explicitArray: true,
  //   mergeAttrs: false
  // });


  // onValue(value: coqXml.Value) {
  //   super.emit('value', value);
  // }
  // 
  // onFeedback(feedback: any) {
  //   try {
  //     this.console.log('FEEDBACK');
  //     switch(feedback.$.object) {
  //     case 'state':
  //       feedback.feedback_content.forEach( (y) => {
  //         switch(y.$.val) {
  //           case 'workerstatus':
  //             var worker = y.pair[0].string[0];
  //             var status = y.pair[0].string[1];
  //             this.console.log('worker ' + worker + ' is ' + status);
  //             break;
  //           default:
  //             this.console.warn('unknown coqtop feedback-content-response: ' + y.$.val);
  //             this.console.log('coqtop response: ' + util.inspect(feedback, false, null));
  //         }
  //       })
  //       break;
  //     default:
  //       this.console.warn('unknown coqtop feedback-response: ' + feedback.$.object);
  //       this.console.log('coqtop response: ' + util.inspect(feedback, false, null));
  //     }
  //   } catch(err) {
  //     this.console.error("FEEDBACK ERROR: " + err + '\n  on: ' + util.inspect(feedback, false, null));
  //   }
  // }

  // onMainChannelRError(err: any) {
  //   this.console.error('XmlStream error: ' + err);
  // }

  private onMainChannelR(data: string) {
    // this.console.log('>>' + data);
//     try {
//     this.coqParser.parseString(data, (err,x) => {
//       if (err) {
//         this.console.log('main-channelR parse error: ' + err + '\n  on:' + data);
//         return;
//       }
// 
//       // var x = { value: { '$': { val: 'good' }, state_id: [ { '$': { val: '1' } } ] } };
//       // var x = { feedback:  { '$': { object: 'state', route: '0' }, state_id: [ { '$': { val: '1' } } ],
//       //    feedback_content: [ { '$': { val: 'workerstatus' }, pair: [ { string: [ 'proofworker:0', 'Idle' ] } ] } ] } };
//       // this.console.log('coqtop response: ' + util.inspect(x, false, null));
// 
//       if (x.value) {
//         return;
//       } else if(x.feedback) {
//         return;
//       } else {
//         this.console.warn('unknown coqtop response: ' + util.inspect(x, false, null));
//       }
//     });
//     } catch(err) {
//       this.console.error("main-channelR XML parse error: " + err + '\n  on: ' + data);
//     }
    // <value val="good"><state_id val="1"/></value>
  }

  private onMainChannelW(data: string) {
    this.console.log('main-channelW: ' + data);
  }
  private onControlChannelR(data: string) {
    this.console.log('control-channelR: ' + data);
  }
  private onControlChannelW(data: string) {
    this.console.log('control-channelW: ' + data);
  }
  private coqtopOut(data:string) {
    this.console.log('coqtop-stdout:' + data);
  }
  

  private onStateFeedback(feedback: coqProto.StateFeedback) {
    if (feedback.sentenceFeedback && this.callbacks.onStateStatusUpdate) {
      this.console.log(`[stateId: ${feedback.stateId}] --> ${coqProto.SentenceStatus[feedback.sentenceFeedback.status]} by ${feedback.sentenceFeedback.worker || "()"}`);
      this.callbacks.onStateStatusUpdate(feedback.stateId, feedback.route, feedback.sentenceFeedback.status, feedback.sentenceFeedback.worker);
    }
    if(feedback.error && this.callbacks.onStateError) {
      this.console.log(`[stateId: ${feedback.stateId}] --> ERROR: ${feedback.error.message} ${feedback.error.location ? `@ ${feedback.error.location.start}-${feedback.error.location.stop}` : ""}`);
      this.callbacks.onStateError(feedback.stateId,feedback.route, feedback.error.message,feedback.error.location);
    }
    if(feedback.workerStatus && this.callbacks.onStateWorkerStatusUpdate) {
      this.console.log(`[stateId: ${feedback.stateId}] --> ${feedback.workerStatus[0].id} is ${coqProto.WorkerState[feedback.workerStatus[0].state]} ${feedback.workerStatus[0].ident || ""}`);
      this.callbacks.onStateWorkerStatusUpdate(feedback.stateId, feedback.route, feedback.workerStatus);
    }
    if(feedback.fileDependencies && this.callbacks.onStateFileDependencies) {
      this.console.log(`[stateId: ${feedback.stateId}] --> FileDependency`);
      this.callbacks.onStateFileDependencies(feedback.stateId, feedback.route, feedback.fileDependencies);
    }
    if(feedback.fileLoaded && this.callbacks.onStateFileLoaded) {
      this.console.log(`[stateId: ${feedback.stateId}] --> FileLoaded`);
      this.callbacks.onStateFileLoaded(feedback.stateId, feedback.route, feedback.fileLoaded);
    }
  }

  private onEditFeedback(feedback: coqProto.EditFeedback) {
    this.console.log(`[editId: ${feedback.editId}] --> ${feedback.error || "()"}`);
    if(this.callbacks.onEditFeedback)
      this.callbacks.onEditFeedback(feedback.editId, feedback.error);
  }

  private onMessage(msg: coqProto.Message) {
    this.console.log(`>> ${coqProto.MessageLevel[msg.level]}: ${msg.message}`);
    if(this.callbacks.onMessage)
      this.callbacks.onMessage(msg.level, msg.message);
  }

  private onOther(x: any) {}
  private onError(x: any) {}


  private validateValue(value: coqProto.Value, logIdent?: string) {
    if(!value.error)
      return;
    let error = <FailureResult>{
      stateId: value.stateId,
      message: value.error.message,
      };
    if(value.error.location)
      error.range = value.error.location;
    this.console.log(`ERROR ${logIdent || ""}: ${value.stateId} --> ${value.error.message} ${value.error.location ? `@ ${value.error.location.start}-${value.error.location.stop}`: ""}`);
    throw error;
  }
  
  /**
   * Note: this needs to be called before this.mainChannelW.write to ensure that the handler for 'response: value'
   * is installed on time
   */
  private coqGetResultOnce(logIdent?: string) : Promise<coqProto.Value> {
    return new Promise<coqProto.Value>((resolve,reject) => {
      this.parser.once('response: value', (value:coqProto.Value) => {
        try {
          this.validateValue(value,logIdent);
          resolve(value);
        } catch(error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Note: this needs to be called before this.mainChannelW.write to ensure that the handler for 'response: value'
   * is installed on time
   */
  private coqGetMessageOnce() : Promise<coqProto.Message> {
    return new Promise<coqProto.Message>((resolve,reject) => {
      this.parser.once('response: message', (value:coqProto.Message) => {
        try {
          resolve(value);
        } catch(error) {
          reject(error);
        }
      });
    });
  }
  
  public async coqInterrupt() {
    if(!this.coqtopProc)
      return;

    this.parser.once('response: value', (value:coqProto.Value) => {
      this.console.log('interrupted');
    });
    this.console.log('interrupt');
    
    this.console.log('--------------------------------');
    this.console.log('Call Interrupt()');
    this.mainChannelW.write('<call val="Interrupt"><unit/></call>');
// 
// 
// 
// // process.once('kill', () => {
// //   this.console.log('kill'); 
// // });
//     try {
//       // NOTE!!!!
//       // CoqTop uses the interrupt signal (SIGINT) to interrupt processing and return to a 'ready' state
//       // But signals are not cross-platform; Windows only barely supports them, and WORSE
//       // Node.js's `kill` will simply terminate a process instead of sending any kind of signal (on Windows)
// 
//       
//       // 'assasinate-coqtop'
//       // const assassin = fork('C:/Users/cj/vscode_coq/client/server/assassinate-coqtop.js');
//       // const assassin = fork('./assassinate-coqtop', [this.coqtopProc.pid.toString()]);
//       // const assassin = fork('./assassinate-coqtop.js');
//       // assassin.on('exit', () => {this.console.info('assassination complete');});
//       // assassin.disconnect();
//       // this.coqtopProc.stdin.write("\x03", () => {
//       //   this.console.info('ctrl+c written to coqtop');
//       // });
//       // this.mainChannelW.write("\x03", () => {
//       //   this.console.info('ctrl+c written to coqtop');
//       // });
//       // exec(`C:/cygwin64/bin/kill -f -2 ${this.coqtopProc.pid}`, {}, (error,stdout,stdin) => {
//       // const pid = this.coqtopProc.pid;        
//       // try {
//         // exec(`C:/cygwin64/bin/kill -f -SIGQUIT ${pid}`, {}, (error,stdout,stdin) => {
//         //   if(error)
//         //     this.coqtopProc.kill('SIGINT');
//         //   else
//         //     this.console.log(`Interrupting coqtop: C:/cygwin64/bin/kill -f -SIGINT ${pid}`);
//         // });
//       // } catch(err) {
//         this.coqtopProc.kill('SIGINT');
//       // }
//         
//       // exec(`start C:/Users/cj/vscode_coq/SendSignal.exe ${this.coqtopProc.pid}`, {}, (error,stdout,stdin) => {
//       //   if(error)
//       //     this.coqtopProc.kill('SIGINT');
//       //   else
//       //     this.console.log(`Interrupting coqtop: C:/cygwin64/bin/kill -f -SIGINT ${this.coqtopProc.pid}`);
//       // });
//       
//       // this.coqtopProc.stdin.write("\x03");
//       // process.kill(this.coqtopProc.pid, 'SIGINT');
//       // process.kill(this.coqtopProc.pid, 'SIGINT');
//       // spawn("taskkill", ["/pid", this.coqtopProc.pid.toString()]);
//       
//       // this.console.info(util.inspect(assassin,false,null));
//       // this.coqtopProc.kill('SIGBREAK');
//       // this.coqtopProc.kill('SIGINT');
//       // this.coqtopProc.stdin.write('\x03');
//       // this.mainChannelW.write('\x03');
//       // this.coqtopProc.stdin.writable.uncork();
//     } catch(err) {
//       this.console.error("Cannot send interrupt to coqtop: " + err.toString());
//     }
  }


  public async coqInit() : Promise<InitResult> {
    const coqResult = this.coqGetResultOnce('Init');
    this.console.log('--------------------------------');
    this.console.log('Call Init()');
    this.mainChannelW.write('<call val="Init"><option val="none"/></call>');

    const timeout = 3000;
    try {
      const value = await asyncWithTimeout(coqResult, timeout);
      const result = <InitResult>{stateId: value.stateId};
      this.console.log(`Init: () --> ${result.stateId}`);
      return result;
    } catch(error) {
      this.console.warn(`Init: () --> TIMEOUT after ${timeout}ms`);
      this.cleanup(`Init: () --> TIMEOUT after ${timeout}ms`);
      throw error;
    }    
// this.controlChannelR.write("PING\n");
  }

  public async coqQuit() : Promise<void> {
    this.console.log('quit');
    
    try {
      const coqResult = this.coqGetResultOnce('Quit');
      this.console.log('--------------------------------');
      this.console.log('Call Quit()');
      this.mainChannelW.write('<call val="Quit"><unit/></call>');
      try {
        await Promise.race([coqResult, new Promise((resolve,reject) => setTimeout(() => reject(), 1000))]);
        this.console.log(`Quit: () --> ())`);
      } catch(err) {
        this.console.log(`Forced Quit (timeout).`);
      }
    } catch(error) {
      this.console.log(`Forced Quit.`);
    } finally {
      this.cleanup(undefined);
    }
  }
  
  public async coqGoal() : Promise<GoalResult> {
    this.checkState();

    const coqResult = this.coqGetResultOnce('Goal');
    this.console.log('--------------------------------');
    this.console.log('Call Goal()');
    this.mainChannelW.write('<call val="Goal"><unit/></call>');
    
    const value = await coqResult;
    var result = <GoalResult>{};
    if(value.hasOwnProperty('value'))
      result = <GoalResult>{
        goals: value.value.goals,
        backgroundGoals: value.value.backgroundGoals,
        shelvedGoals: value.value.shelvedGoals,
        abandonedGoals: value.value.abandonedGoals
      };
    this.console.log(`Goal: -->`);
    if (result.goals && result.goals.length > 0) {
      this.console.log("Current:");
      result.goals.forEach((g, i) => this.console.log(`    ${i + 1}:${g.id}= ${g.goal}`));
    }
    if (result.backgroundGoals && result.backgroundGoals.length > 0) {
      this.console.log("Background:");
      result.backgroundGoals.forEach((g, i) => this.console.log(`    ${i + 1}) ${util.inspect(g, false, null)}`));
    }
    if (result.shelvedGoals && result.shelvedGoals.length > 0) {
      this.console.log("Shelved:");
      result.shelvedGoals.forEach((g, i) => this.console.log(`    ${i + 1}) ${util.inspect(g, false, null)}`));
    }
    if (result.abandonedGoals && result.abandonedGoals.length > 0) {
      this.console.log("Abandoned:");
      result.abandonedGoals.forEach((g, i) => this.console.log(`    ${i + 1}) ${util.inspect(g, false, null)}`));
    }
    return result;
 }
  
  public async coqAddCommand(command: string, editId: number, stateId: number, verbose?: boolean) : Promise<AddResult> {
    this.checkState();

    const coqResult = this.coqGetResultOnce('Add');
    // const verboseStr = verbose===true ? "true" : "false";
    const verboseStr = verbose === false ? "false" : "true";
    this.console.log('--------------------------------');
    this.console.log(`Call Add("${command.trim().substr(0, 20) + (command.trim().length > 20 ? "..." : "")}", editId: ${editId}, stateId: ${stateId}, verbose: ${verboseStr})`);
    this.mainChannelW.write(`<call val="Add"><pair><pair><string>${coqXml.escapeXml(command)}</string><int>${editId}</int></pair><pair><state_id val="${stateId}"/><bool val="${verboseStr}"/></pair></pair></call>`);

    const value = await coqResult;
    let result = <AddResult>{
      stateId: value.stateId,
      message: value.message,
    };
    if (value.unfocusedStateId)
      result.unfocusedStateId = value.unfocusedStateId;
    this.console.log(`Add:  ${stateId} --> ${result.stateId} ${result.unfocusedStateId ? "(unfocus ${result.unfocusedStateId})" : ""} "${result.message || ""}"`);
    return result;
  }

  public async coqEditAt(stateId: number) : Promise<EditAtResult> {
    this.checkState();

    const coqResult = this.coqGetResultOnce('EditAt');
    this.console.log('--------------------------------');
    this.console.log(`Call EditAt(stateId: ${stateId})`);
    this.mainChannelW.write(`<call val="Edit_at"><state_id val="${stateId}"/></call>`);    

    const value = await coqResult;
    let result : EditAtResult;
    if(value.value.inr) {
      // Jumping inside another proof; create a new tip
      result = {newFocus: {
        stateId: value.value.inr[0].fst,
        qedStateId: value.value.inr[0].snd.fst,
        oldStateIdTip: value.value.inr[0].snd.snd,
      }};
    } else {
      result = {};
    }
    this.console.log(`EditAt: ${stateId} --> ${result.newFocus ? `{newTipId: ${result.newFocus.stateId}, qedId: ${result.newFocus.qedStateId}, oldId: ${result.newFocus.oldStateIdTip}}` : "{}"}`);
    return result;
  }

  public async coqLtacProfilingSet(enabled: boolean) : Promise<void> {
    this.checkState();

    const coqResult = this.coqGetResultOnce('LtacProfSet');
    this.console.log('--------------------------------');
    this.console.log(`Call LtacProfSet(enabled: ${enabled})`);
    this.mainChannelW.write(`<call val="LtacProfSet"><bool val="${enabled}"/></call>`);    

    const value = await coqResult;
    this.console.log(`LtacProfSet: ${enabled} --> ()`);
    return
  }

  public async coqLtacProfilingResults() : Promise<LtacProfResult> {
    this.checkState();

    const coqResult = this.coqGetResultOnce('LtacProfResults');
    this.console.log('--------------------------------');
    this.console.log(`Call LtacProfResults()`);
    this.mainChannelW.write(`<call val="LtacProfResults"><unit/></call>`);    

    const value = await coqResult;
    let result : LtacProfResult = {results: value['hashtbl']};
    // if(value.value.inr) {
    //   // Jumping inside another proof; create a new tip
    //   result = {newFocus: {
    //     stateId: value.value.inr[0].fst,
    //     qedStateId: value.value.inr[0].snd.fst,
    //     oldStateIdTip: value.value.inr[0].snd.snd,
    //   }};
    // } else {
    //   result = {};
    // }
    this.console.log(`LtacProfResults: () --> ...`);
    return result;
  }

  public async coqResizeWindow(columns: number) : Promise<void> {
    if(this.coqtopProc === null)
      return;

    const coqResult = this.coqGetResultOnce('SetOptions');
    this.console.log('--------------------------------');
    this.console.log(`Call ResizeWindow(columns: ${columns})`);
    this.mainChannelW.write(`<call val="SetOptions"><list><pair><list><string>Printing</string><string>Width</string></list><option_value val="intvalue"><option val="some"><int>${columns}</int></option></option_value></pair></list></call>`);
    // this.mainChannelW.write(`
    // <call val="SetOptions">
    //   <list>
    //     <pair>
    //       <list><string>Printing</string><string>Width</string></list>
    //       <option_value val="intvalue"><option val="some"><int>37</int></option></option_value>
    //     </pair>
    //     <pair>
    //       <list><string>Printing</string><string>Coercions</string></list>
    //       <option_value val="boolvalue"><bool val="false"/></option_value>
    //     </pair>
    //     <pair>
    //       <list><string>Printing</string><string>Matching</string></list>
    //       <option_value val="boolvalue"><bool val="true"/></option_value>
    //     </pair>
    //     <pair>
    //       <list><string>Printing</string><string>Notations</string></list>
    //       <option_value val="boolvalue"><bool val="true"/></option_value>
    //     </pair>
    //     <pair>
    //       <list><string>Printing</string><string>Existential</string><string>Instances</string></list>
    //       <option_value val="boolvalue"><bool val="false"/></option_value>
    //     </pair>
    //     <pair>
    //       <list><string>Printing</string><string>Implicit</string></list>
    //       <option_value val="boolvalue"><bool val="false"/></option_value>
    //     </pair>
    //     <pair>
    //       <list><string>Printing</string><string>All</string></list>
    //       <option_value val="boolvalue"><bool val="false"/></option_value>
    //     </pair>
    //     <pair>
    //       <list><string>Printing</string><string>Universes</string></list>
    //       <option_value val="boolvalue"><bool val="false"/></option_value>
    //     </pair>
    //   </list>
    // </call>`);
    await coqResult;
    this.console.log(`ResizeWindow: ${columns} --> ()`);
  }
  
  public async coqQuery(query: string, stateId?: number) : Promise<string> {
    this.checkState();
    if(stateId === undefined)
    stateId = 0;
    // 
    // 
    // const coqResult1 = this.coqGetResultOnce('Query');
    // this.mainChannelW.write(`<call val="SetOptions"><list><pair><list><string>Printing</string><string>Width</string></list><option_value val="intvalue"><option val="some"><int>37</int></option></option_value></pair><pair><list><string>Printing</string><string>Coercions</string></list><option_value val="boolvalue"><bool val="false"/></option_value></pair><pair><list><string>Printing</string><string>Matching</string></list><option_value val="boolvalue"><bool val="true"/></option_value></pair><pair><list><string>Printing</string><string>Notations</string></list><option_value val="boolvalue"><bool val="true"/></option_value></pair><pair><list><string>Printing</string><string>Existential</string><string>Instances</string></list><option_value val="boolvalue"><bool val="false"/></option_value></pair><pair><list><string>Printing</string><string>Implicit</string></list><option_value val="boolvalue"><bool val="false"/></option_value></pair><pair><list><string>Printing</string><string>All</string></list><option_value val="boolvalue"><bool val="false"/></option_value></pair><pair><list><string>Printing</string><string>Universes</string></list><option_value val="boolvalue"><bool val="false"/></option_value></pair></list></call>`);
    // await coqResult1;
    // 
    
    const coqResult = this.coqGetResultOnce('Query');
    const coqMessageResult = this.coqGetMessageOnce();
    this.console.log('--------------------------------');
    this.console.log(`Call Query(stateId: ${stateId}, query: $query})`);
    this.mainChannelW.write(`<call val="Query"><pair><string>${coqXml.escapeXml(query)}</string><state_id val="${stateId}"/></pair></call>`);    
    // this.mainChannelW.write(`<call val="Query"><pair><string>${entities.encodeXML(query)}</string><state_id val="${stateId}"/></pair></call>`);    

    const values = await Promise.all<coqProto.Message>([coqMessageResult, coqResult.then(() => null)]);
    this.console.log(`Query: ${stateId} --> ...`);
    return values[0].message;

    // return entities.decodeXML(values[0].message);

//     this.checkState();
// 
//     const coqResult = this.coqGetResultOnce('Locate');
//     // const verboseStr = verbose===true ? "true" : "false";
//     const verboseStr = verbose === false ? "false" : "true";
//     this.console.log('--------------------------------');
//     this.console.log(`Call Add("${command.trim().substr(0, 20) + (command.trim().length > 20 ? "..." : "")}", editId: ${editId}, stateId: ${stateId}, verbose: ${verboseStr})`);
//     this.mainChannelW.write(`<call val="Add"><pair><pair><string>${command}</string><int>${editId}</int></pair><pair><state_id val="${stateId}"/><bool val="${verboseStr}"/></pair></pair></call>`);
// 
//     const value = await coqResult;
//     let result = <AddResult>{
//       stateId: value.stateId,
//       message: value.message,
//     };
//     if (value.unfocusedStateId)
//       result.unfocusedStateId = value.unfocusedStateId;
//     this.console.log(`Add:  ${stateId} --> ${result.stateId} ${result.unfocusedStateId ? "(unfocus ${result.unfocusedStateId})" : ""} "${result.message || ""}"`);
//     return result;
  }


//   public async coqStatus(stateId: number) : Promise<EditAtResult> {
//     const coqResult = this.coqGetResultOnce('EditAt');
//     this.console.log('--------------------------------');
//     this.console.log(`Call EditAt(stateId: ${stateId})`);
//     this.mainChannelW.write(`<call val="Edit_at"><state_id val="${stateId}"/></call>`);    
// 
//     const value = await coqResult;
//     let result : EditAtResult;
//     if(value.value.inr) {
//       // Jumping inside another proof; create a new tip
//       result = {newFocus: {
//         stateId: value.value.inr[0].fst,
//         qedStateId: value.value.inr[0].snd.fst,
//         oldStateIdTip: value.value.inr[0].snd.snd,
//       }};
//     } else {
//       result = {};
//     }
//     this.console.log(`EditAt: ${stateId} --> ${result.newFocus ? `{newTipId: ${result.newFocus.stateId}, qedId: ${result.newFocus.qedStateId}, oldId: ${result.newFocus.oldStateIdTip}}` : "{}"}`);
//     return result;
//   }


}