'use strict';

import {Position, Range} from 'vscode-languageserver';

// 'sticky' flag is not yet supported :()
const lineEndingRE = /([^\r\n]*)(\r\n|\r|\n)?/;

export interface RangeDelta {
  start: Position;
  end: Position;
  linesDelta: number;
  charactersDelta: number; // delta for positions on the same line as the end position
}

export function positionIsBefore(pos1: Position, pos2: Position) : boolean {
  return (pos1.line < pos2.line || (pos1.line===pos2.line && pos1.character < pos2.character));
}

export function positionIsBeforeOrEqual(pos1: Position, pos2: Position) : boolean {
  return (pos1.line < pos2.line || (pos1.line===pos2.line && pos1.character <= pos2.character));
}

export function positionIsAfter(pos1: Position, pos2: Position) : boolean {
  return (pos1.line > pos2.line || (pos1.line===pos2.line && pos1.character > pos2.character));
}

export function positionIsAfterOrEqual(pos1: Position, pos2: Position) : boolean {
  return (pos1.line > pos2.line || (pos1.line===pos2.line && pos1.character >= pos2.character));
}

export function rangeContains(range: Range, pos: Position) : boolean {
  return !this.positionIsBefore(pos,range.start) && this.positionIsBefore(pos,range.end);
}

export function rangeContainsOrTouches(range: Range, pos: Position) : boolean {
  return !this.positionIsBeforeOrEqual(pos,range.start) && this.positionIsBeforeOrEqual(pos,range.end);
}

export function rangeIntersects(range1: Range, range2: Range) : boolean {
  return this.rangeContains(range1,range2.start) || this.rangeContains(range1,range2.end);
}

export function rangeTouches(range1: Range, range2: Range) : boolean {
  return this.rangeContainsOrTouches(range1,range2.start) || this.rangeContainsOrTouches(range1,range2.end);
}


export function locationAt(text: string, pos: Position) : number {
  let line = pos.line;
  let lastIndex = 0;
  while (line > 0) {
    const match = lineEndingRE.exec(text.substring(lastIndex));
    if(match[2] === '' || match[2] === undefined) // no line-ending found
      return -1; // the position is beyond the length of text
    else {
      lastIndex+= match[0].length;
      --line;
    }
  }
  return lastIndex + pos.character;
}

/**
 * @returns the Position (line, column) for the location (character position)
 */
export function positionAt(text: string, offset: number) : Position {
  if(offset > text.length)
    offset = text.length;
  let line = 0;
  let lastIndex = 0;
  while(true) {
    const match = lineEndingRE.exec(text.substring(lastIndex));
    if(lastIndex + match[1].length >= offset)
      return Position.create(line, Math.max(offset - lastIndex,0))
    lastIndex+= match[0].length;
    ++line;
  }
}

/**
 * @returns the lines and characters represented by the text
 */
export function toRangeDelta(oldRange:Range, text: string) : RangeDelta {
  const newEnd = positionAt(text,text.length);
  let charsDelta;
  if(oldRange.start.line === oldRange.end.line)
    charsDelta = newEnd.character - (oldRange.end.character-oldRange.start.character);
  else
    charsDelta = newEnd.character - oldRange.end.character;
  
  return {
    start: oldRange.start,
    end: oldRange.end,
    linesDelta: newEnd.line-(oldRange.end.line-oldRange.start.line),
    charactersDelta: charsDelta
  };
}

export function positionRangeDeltaTranslate(pos: Position, delta: RangeDelta) : Position {
  if(positionIsBefore(pos,delta.end))
    return pos;
  else if (delta.end.line === pos.line) {
    let x = pos.character + delta.charactersDelta;
    if (delta.linesDelta > 0) 
      x = x - delta.end.character;
    else if (delta.start.line === delta.end.line + delta.linesDelta && delta.linesDelta < 0) 
      x = x + delta.start.character;
    return Position.create(pos.line + delta.linesDelta, x);
  }
  else // if(pos.line > delta.end.line)
    return Position.create(pos.line + delta.linesDelta, pos.character);
}

export function positionRangeDeltaTranslateEnd(pos: Position, delta: RangeDelta) : Position {
  if(positionIsBeforeOrEqual(pos,delta.end))
    return pos;
  else if (delta.end.line === pos.line) {
    let x = pos.character + delta.charactersDelta;
    if (delta.linesDelta > 0) 
      x = x - delta.end.character;
    else if (delta.start.line === delta.end.line + delta.linesDelta && delta.linesDelta < 0) 
      x = x + delta.start.character;
    return Position.create(pos.line + delta.linesDelta, x);
  }
  else // if(pos.line > delta.end.line)
    return Position.create(pos.line + delta.linesDelta, pos.character);
}

export function rangeTranslate(range: Range, delta: RangeDelta) {
  return Range.create(
    positionRangeDeltaTranslate(range.start, delta),
    positionRangeDeltaTranslateEnd(range.end, delta)
  )
}

