'use strict';

const { createGunzip } = require('node:zlib');
const { Readable } = require('node:stream');
const tar = require('tar-stream');
const YAML = require('yaml');

const MAX_ENTRY_BYTES = 128 * 1024 * 1024;
const MAX_TOTAL_BYTES = 512 * 1024 * 1024;
const MAX_ENTRIES = 20000;

function parseUnityYaml(input, label = 'Unity asset') {
  const text = input.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.startsWith('%YAML') && !text.includes('--- !u!')) {
    throw new Error(`${label}: not a Force Text Unity YAML asset`);
  }
  const header = /^--- !u!(\d+) &(-?\d+)(?: stripped)?[ \t]*$/gm;
  const matches = [...text.matchAll(header)];
  if (!matches.length) throw new Error(`${label}: no Unity YAML objects found`);
  const result = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    let body = text.slice(start, end).trim();
    if (!body) continue;
    // Unity fileIDs are 64-bit values. Quote them before YAML parsing so JS never rounds them.
    body = body.replace(/(\bfileID\s*:\s*)(-?\d+)(?=\s*[,}\n])/g, '$1"$2"');
    let parsed;
    try {
      parsed = YAML.parse(body, { uniqueKeys: false, maxAliasCount: 0 });
    } catch (error) {
      throw new Error(`${label}: YAML object ${matches[i][2]} failed: ${error.message}`);
    }
    if (!parsed || typeof parsed !== 'object') continue;
    const [type, value] = Object.entries(parsed)[0] || [];
    if (!type || !value || typeof value !== 'object') continue;
    result.push({ classId: Number(matches[i][1]), fileId: matches[i][2], type, data: value });
  }
  return result;
}

function readUnityPackage(buffer) {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const raw = new Map();
    let entryCount = 0;
    let totalBytes = 0;
    let done = false;
    const fail = (error) => {
      if (!done) { done = true; reject(error); }
    };
    extract.on('entry', (header, stream, next) => {
      entryCount++;
      if (entryCount > MAX_ENTRIES) return fail(new Error('Too many archive entries'));
      const parts = header.name.replaceAll('\\', '/').split('/');
      if (parts.length !== 2 || !/^[a-f0-9]{32}$/i.test(parts[0]) ||
          !['asset', 'asset.meta', 'pathname', 'preview.png'].includes(parts[1]) ||
          header.type !== 'file') {
        stream.resume();
        stream.on('end', next);
        return;
      }
      if (header.size > MAX_ENTRY_BYTES || totalBytes + header.size > MAX_TOTAL_BYTES) {
        return fail(new Error('Archive exceeds size limits'));
      }
      totalBytes += header.size;
      const chunks = [];
      let size = 0;
      stream.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_ENTRY_BYTES) return fail(new Error('Archive entry exceeds size limit'));
        chunks.push(chunk);
      });
      stream.on('end', () => {
        const guid = parts[0].toLowerCase();
        if (!raw.has(guid)) raw.set(guid, {});
        raw.get(guid)[parts[1]] = Buffer.concat(chunks);
        next();
      });
      stream.on('error', fail);
    });
    extract.on('finish', () => {
      if (done) return;
      const assets = new Map();
      for (const [guid, parts] of raw) {
        if (!parts.pathname || !parts.asset) continue;
        const pathname = parts.pathname.toString('utf8').trim().replaceAll('\\', '/');
        if (!pathname.startsWith('Assets/') || pathname.includes('../') || pathname.includes('/..')) continue;
        assets.set(guid, {
          guid, pathname, extension: pathname.slice(pathname.lastIndexOf('.')).toLowerCase(),
          content: parts.asset, meta: parts['asset.meta'] || null,
          preview: parts['preview.png'] || null,
        });
      }
      done = true;
      resolve(assets);
    });
    extract.on('error', fail);
    Readable.from(buffer).pipe(createGunzip()).on('error', fail).pipe(extract);
  });
}

module.exports = { parseUnityYaml, readUnityPackage };
