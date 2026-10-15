#!/usr/bin/env node
'use strict';

/**
 * Native Android navigation smoke test. No application data is cleared.
 * Run: node scripts/android-smoke.cjs --serial emulator-5582 --install --allow-onboarding
 * This verifies launch/navigation/recovery screens, not plant identification accuracy.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const LABELS = {
  home: ['Home'], library: ['Library', 'Aklatan'], history: ['History', 'Kasaysayan'],
  profile: ['Profile'], scan: ['Scan', 'I-scan'],
  homeContent: ['Welcome Back', 'Maligayang Pagbabalik'],
  libraryContent: ['Search plants...', 'Maghanap ng halaman...'],
  historyContent: ['Scan History', 'Kasaysayan ng Scan'],
  profileContent: ['Manage your account & preferences', 'Pamahalaan ang iyong account at mga setting'],
  next: ['Continue', 'Magpatuloy'], start: ['Get started', 'Magsimula'], skip: ['Skip', 'Laktawan'],
  guide: ['Before you scan', 'Bago mag-scan'], ready: ['Ready to scan', 'Handa nang mag-scan'],
  permission: ['Camera Access', 'Access sa Camera'], enableCamera: ['Enable Camera', 'Paganahin ang Camera'],
  capture: ['Take photo', 'Kumuha ng litrato'],
  unavailable: ['Camera is unavailable on this device. Please check camera access and try again.',
    'Hindi magamit ang camera sa device na ito. Suriin ang pahintulot sa camera at subukang muli.'],
  appError: ['Something went wrong', 'May nangyaring mali'],
};

class BlockedError extends Error {}

function parseArgs(argv) {
  const options = { apk: path.join(ROOT, 'app-release.apk'),
    output: path.join(ROOT, '.audit-build', 'test-results', 'android-smoke'),
    install: false, allowOnboarding: false, bootTimeoutMs: 180000, uiTimeoutMs: 45000 };
  const valued = { '--serial': 'serial', '--apk': 'apk', '--output': 'output', '--adb': 'adb',
    '--package': 'packageName', '--boot-timeout-ms': 'bootTimeoutMs', '--ui-timeout-ms': 'uiTimeoutMs' };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--install') options.install = true;
    else if (arg === '--allow-onboarding') options.allowOnboarding = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (valued[arg]) {
      if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[valued[arg]] = argv[++index];
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  for (const name of ['bootTimeoutMs', 'uiTimeoutMs']) {
    options[name] = Number(options[name]);
    if (!Number.isInteger(options[name]) || options[name] < 1000 || options[name] > 600000) {
      throw new Error(`${name} must be an integer from 1000 to 600000`);
    }
  }
  if (options.packageName && !/^[A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+$/.test(options.packageName)) {
    throw new Error('Invalid Android package name');
  }
  options.apk = path.resolve(options.apk);
  options.output = path.resolve(options.output);
  return options;
}

function executableOnPath(name) {
  const names = process.platform === 'win32' ? [`${name}.exe`, name] : [name];
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    for (const filename of names) {
      const candidate = path.join(directory.replace(/^"|"$/g, ''), filename);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return null;
}

function sdkRoots() {
  return [...new Set([process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')].filter(Boolean))];
}

function findAdb(explicit) {
  if (explicit) {
    if (!fs.existsSync(explicit)) throw new BlockedError(`ADB executable does not exist: ${explicit}`);
    return path.resolve(explicit);
  }
  for (const sdk of sdkRoots()) {
    const candidate = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (fs.existsSync(candidate)) return candidate;
  }
  const candidate = executableOnPath('adb');
  if (candidate) return candidate;
  throw new BlockedError('ADB was not found. Set ANDROID_HOME/ANDROID_SDK_ROOT or add platform-tools to PATH.');
}

function findAapt() {
  for (const sdk of sdkRoots()) {
    const tools = path.join(sdk, 'build-tools');
    if (!fs.existsSync(tools)) continue;
    for (const version of fs.readdirSync(tools).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
      for (const name of ['aapt', 'aapt2']) {
        const candidate = path.join(tools, version, `${name}${process.platform === 'win32' ? '.exe' : ''}`);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return executableOnPath('aapt') || executableOnPath('aapt2');
}

function parseDevices(output) {
  return output.split(/\r?\n/).map(line => line.trim()).flatMap(line => {
    const match = /^(\S+)\s+(device|offline|unauthorized|recovery|sideload|bootloader)\b(.*)$/.exec(line);
    return match ? [{ serial: match[1], state: match[2], details: match[3].trim() }] : [];
  });
}

function selectDevice(devices, explicit) {
  if (explicit) {
    const selected = devices.find(device => device.serial === explicit);
    if (!selected) throw new BlockedError(`Requested device ${explicit} is not connected.`);
    if (selected.state !== 'device') throw new BlockedError(`Device ${explicit} is ${selected.state}; authorize it and wait for it to become ready.`);
    return selected;
  }
  if (devices.length > 1) throw new BlockedError('Multiple Android devices are connected. Select one explicitly with --serial.');
  if (!devices.length) throw new BlockedError('No Android device is connected. Start an emulator or connect an authorized device.');
  return selectDevice(devices, devices[0].serial);
}

function decodeXml(value) {
  return value.replace(/&(?:quot|apos|lt|gt|amp|#\d+|#x[\da-fA-F]+);/g, entity => {
    const known = { '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&amp;': '&' };
    if (Object.hasOwn(known, entity)) return known[entity];
    const point = entity.startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  });
}

function parseUiXml(xml) {
  if (!/<hierarchy\b/.test(xml)) throw new Error('UI Automator did not return a hierarchy.');
  const nodes = [];
  const stack = [];
  for (const match of xml.matchAll(/<node\b[^>]*>|<\/node\s*>/g)) {
    const tag = match[0];
    if (tag.startsWith('</')) { stack.pop(); continue; }
    const attributes = Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)]
      .map(([, key, value]) => [key, decodeXml(value)]));
    const bounds = /^\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]$/.exec(attributes.bounds || '');
    const node = { ...attributes, parent: stack.length ? stack[stack.length - 1] : null,
      rect: bounds ? bounds.slice(1).map(Number) : null };
    nodes.push(node);
    if (!/\/\s*>$/.test(tag)) stack.push(nodes.length - 1);
  }
  return nodes;
}

const normalized = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
function labeled(node, labels) {
  return labels.some(label => [node.text, node['content-desc']].some(value => {
    const text = normalized(value);
    const target = normalized(label);
    return text === target || text.startsWith(`${target},`);
  }));
}

function findNode(nodes, labels, bottom = false) {
  const matches = nodes.filter(node => node.enabled !== 'false' && node.rect && node.rect[2] > node.rect[0]
    && node.rect[3] > node.rect[1] && labeled(node, labels));
  return matches.sort((a, b) => bottom ? b.rect[3] - a.rect[3]
    : Number(b.clickable === 'true') - Number(a.clickable === 'true'))[0] || null;
}

function crashLines(logs, runStartEpoch, pids) {
  const ids = new Set([...pids].map(String));
  return logs.split(/\r?\n/).filter(line => {
    const match = /^\s*(\d+(?:\.\d+)?)\s+(\d+)\s+\d+\s+([VDIWEFA])\s+([^:]+):\s*(.*)$/.exec(line);
    if (!match || Number(match[1]) < runStartEpoch || !ids.has(match[2])) return false;
    const tag = match[4].trim();
    const message = match[5];
    return /FATAL EXCEPTION|Fatal signal\s+\d+|Unhandled (?:JS )?Exception|JavascriptException/i.test(message)
      || (tag === 'ReactNativeJS' && /TypeError|ReferenceError|RangeError|Invariant Violation|\bfatal\b/i.test(message));
  });
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
function command(executable, args, options = {}) {
  try {
    return execFileSync(executable, args, { windowsHide: true, timeout: 20000,
      maxBuffer: 32 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
  } catch (error) {
    const detail = [error.message, error.stderr?.toString(), error.stdout?.toString()].filter(Boolean).join('\n');
    throw new Error(detail.slice(0, 6000));
  }
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log('Usage: node scripts/android-smoke.cjs [--serial SERIAL] [--apk PATH] [--install] [--allow-onboarding] [--output DIR]\n'
      + 'Optional: --adb PATH --package PACKAGE --boot-timeout-ms MS --ui-timeout-ms MS\n'
      + '--install uses adb install -r and preserves existing app data. No uninstall, data clear, or global logcat clear is performed.\n'
      + '--allow-onboarding allows completing app/camera walkthroughs; required only when one is presented.\n'
      + 'Exit codes: 0 smoke passed; 1 a test failed; 2 device/tool/readiness or explicit consent blocked testing.');
    return 0;
  }
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`;
  const output = path.join(options.output, runId);
  fs.mkdirSync(output, { recursive: true });
  const report = { schemaVersion: 1, scope: 'Android launch and navigation smoke only',
    startedAt: new Date().toISOString(), runId, outputDirectory: output,
    options: { ...options, allowOnboarding: options.allowOnboarding }, cases: [], evidence: [],
    limitations: ['No physical camera capture or recognition accuracy assertion.',
      'No destructive data operations, backup import/export, or persistence stress test is performed.',
      'English and Tagalog selectors are supported; this run tests the existing interface language.'] };
  let adb;
  let serial;
  let packageName;
  let runStartEpoch;
  let launcher;
  const pids = new Set();
  const adbCommand = (args, settings) => command(adb, serial ? ['-s', serial, ...args] : args, settings);
  const shell = (...args) => adbCommand(['shell', ...args]);
  const save = (filename, content) => { const target = path.join(output, filename); fs.writeFileSync(target, content); return target; };
  async function runCase(name, action) {
    const started = Date.now();
    try {
      const detail = await action();
      report.cases.push({ name, status: 'passed', durationMs: Date.now() - started, detail });
      console.log(`PASS ${name}`);
      return true;
    } catch (error) {
      const status = error instanceof BlockedError ? 'blocked' : 'failed';
      report.cases.push({ name, status, durationMs: Date.now() - started, error: error.message });
      console.log(`${status.toUpperCase()} ${name}: ${error.message.split('\n')[0]}`);
      return false;
    }
  }
  function processIds() {
    const raw = shell('pidof', packageName).trim();
    const ids = raw.split(/\s+/).filter(value => /^\d+$/.test(value));
    ids.forEach(id => pids.add(id));
    return ids;
  }
  function snapshot(label) {
    const devicePath = `/sdcard/hanapmedisina-smoke-${process.pid}-${Date.now()}.xml`;
    try {
      shell('uiautomator', 'dump', '--compressed', devicePath);
      const xml = shell('cat', devicePath);
      const xmlPath = save(`${label}.xml`, xml);
      const png = adbCommand(['exec-out', 'screencap', '-p'], { encoding: null });
      if (!Buffer.isBuffer(png) || !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        throw new Error('Android screenshot did not contain PNG data.');
      }
      const screenshot = save(`${label}.png`, png);
      const nodes = parseUiXml(xml);
      if (nodes.some(node => labeled(node, LABELS.appError))) throw new Error('The application error recovery screen is visible.');
      report.evidence.push({ label, uiXml: xmlPath, screenshot });
      return { nodes, xmlPath, screenshot };
    } finally {
      try { shell('rm', '-f', devicePath); } catch { /* Only this run's temporary XML is eligible for cleanup. */ }
    }
  }
  function tap(node) {
    if (!node?.rect) throw new Error('Cannot tap an element without visible bounds.');
    const [left, top, right, bottom] = node.rect;
    shell('input', 'tap', String(Math.max(0, Math.round((left + right) / 2))), String(Math.max(0, Math.round((top + bottom) / 2))));
  }
  async function waitUi(label, predicate) {
    const deadline = Date.now() + options.uiTimeoutMs;
    let latest;
    let lastError;
    do {
      try {
        latest = snapshot(label);
        if (predicate(latest.nodes)) return latest;
      } catch (error) { lastError = error; }
      await delay(600);
    } while (Date.now() < deadline);
    throw new Error(`UI did not reach ${label} within ${options.uiTimeoutMs} ms.${lastError ? ` ${lastError.message}` : ''}`);
  }
  async function navigate(name, contentLabels) {
    const before = snapshot(`before-${name}`);
    const tab = findNode(before.nodes, LABELS[name], true);
    if (!tab) throw new Error(`The ${name} tab is not visible.`);
    // Re-tapping an already active Scan tab captures a photo in this app.
    let ancestor = tab;
    let selected = false;
    while (ancestor) {
      if (ancestor.selected === 'true') selected = true;
      ancestor = ancestor.parent === null ? null : before.nodes[ancestor.parent];
    }
    if (!selected) tap(tab);
    const after = await waitUi(name, nodes => contentLabels.some(labels => findNode(nodes, labels)));
    return { evidence: after.screenshot, visibleMarker: after.nodes.find(node => contentLabels.some(labels => labeled(node, labels)))?.text,
      processIds: processIds() };
  }
  try {
    const ready = await runCase('android-device-ready', async () => {
      adb = findAdb(options.adb);
      const selected = selectDevice(parseDevices(command(adb, ['devices', '-l'])), options.serial);
      serial = selected.serial;
      report.device = selected;
      const deadline = Date.now() + options.bootTimeoutMs;
      let state = {};
      do {
        try {
          const bootCompleted = shell('getprop', 'sys.boot_completed').trim();
          const currentUser = shell('am', 'get-current-user').trim();
          if (!/^\d+$/.test(currentUser)) throw new Error('Android current user is unavailable.');
          const userState = shell('am', 'get-started-user-state', currentUser).trim();
          state = { bootCompleted, currentUser, userState };
          if (bootCompleted === '1' && /\bRUNNING_UNLOCKED\b/.test(userState)) {
            report.device = { ...selected, ...state,
              model: shell('getprop', 'ro.product.model').trim(), androidVersion: shell('getprop', 'ro.build.version.release').trim(),
              apiLevel: shell('getprop', 'ro.build.version.sdk').trim() };
            return report.device;
          }
        } catch (error) { state.error = error.message; }
        await delay(1000);
      } while (Date.now() < deadline);
      throw new BlockedError(`Android has not completed boot with RUNNING_UNLOCKED: ${JSON.stringify(state)}`);
    });
    if (!ready) return finalize();

    let apkMeta = {};
    if (!await runCase('apk-available', () => {
      if (!fs.existsSync(options.apk)) throw new BlockedError(`APK does not exist: ${options.apk}`);
      const bytes = fs.readFileSync(options.apk);
      report.apk = { path: options.apk, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
      const aapt = findAapt();
      if (aapt) {
        const badging = command(aapt, ['dump', 'badging', options.apk]);
        save('apk-badging.txt', badging);
        apkMeta = { packageName: /package: name='([^']+)'/.exec(badging)?.[1],
          launcher: /launchable-activity: name='([^']+)'/.exec(badging)?.[1],
          versionCode: /versionCode='([^']+)'/.exec(badging)?.[1], versionName: /versionName='([^']+)'/.exec(badging)?.[1] };
        report.apk = { ...report.apk, ...apkMeta };
      }
      packageName = options.packageName || apkMeta.packageName;
      if (!packageName) {
        const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
        packageName = config.expo?.android?.package;
        report.apk.packageSource = 'Project app.json fallback; APK metadata tool unavailable';
      }
      if (!/^[A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+$/.test(packageName || '')) throw new Error('Could not determine a valid Android package. Supply --package.');
      report.packageName = packageName;
      return report.apk;
    })) return finalize();

    if (options.install && !await runCase('install-apk-preserving-data', () => {
      const result = adbCommand(['install', '-r', options.apk], { timeout: 180000 });
      save('install.txt', result);
      if (!/\bSuccess\b/.test(result)) throw new Error(`ADB did not confirm APK installation: ${result}`);
      return { replacedPackage: packageName, dataCleared: false };
    })) return finalize();

    if (!await runCase('package-installed', () => {
      let installed;
      try { installed = shell('pm', 'path', packageName); }
      catch { throw new BlockedError('Package is not installed. Run again with --install to install the selected APK.'); }
      const installedApk = /^package:(.+base\.apk)\s*$/m.exec(installed)?.[1];
      if (!installedApk) throw new BlockedError('Package is not installed. Run again with --install.');
      const metadata = shell('dumpsys', 'package', packageName);
      save('installed-package.txt', metadata);
      report.installedPackage = { baseApk: installedApk,
        versionName: /versionName=(\S+)/.exec(metadata)?.[1], versionCode: /versionCode=(\d+)/.exec(metadata)?.[1] };
      if (/^\/[\w/~=+.\-]+\.apk$/.test(installedApk)) {
        const hash = /^([a-f\d]{64})\b/i.exec(shell('sha256sum', installedApk))?.[1].toLowerCase();
        report.installedPackage.sha256 = hash;
        report.installedPackage.matchesSelectedApk = hash === report.apk.sha256;
        if (hash && hash !== report.apk.sha256) throw new BlockedError('The installed APK differs from --apk. Use --install to test the selected APK.');
      }
      return report.installedPackage;
    })) return finalize();

    if (!await runCase('launcher-resolved', () => {
      let resolved = '';
      try { resolved = shell('cmd', 'package', 'resolve-activity', '--brief', '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LAUNCHER', packageName); } catch { /* aapt fallback below */ }
      launcher = resolved.split(/\r?\n/).map(line => line.trim()).find(line => line.startsWith(`${packageName}/`));
      if (!launcher && apkMeta.launcher) launcher = `${packageName}/${apkMeta.launcher}`;
      if (!launcher || !/^[\w.]+\/[\w.$]+$/.test(launcher)) throw new Error(`No launcher activity found for ${packageName}.`);
      return { launcher };
    })) return finalize();

    if (!await runCase('launch-renders-ui', async () => {
      runStartEpoch = Number(shell('date', '+%s').trim());
      if (!Number.isFinite(runStartEpoch) || runStartEpoch <= 0) throw new Error('Could not capture device time for scoped crash logs.');
      shell('input', 'keyevent', 'KEYCODE_WAKEUP');
      const launch = shell('am', 'start', '-W', '-n', launcher);
      save('launch.txt', launch);
      if (/Error:|Exception|Status:\s*(?!ok\b)\S+/i.test(launch)) throw new Error(`Android could not launch the app: ${launch}`);
      const screen = await waitUi('launched', nodes => nodes.some(node => node.package === packageName)
        && (findNode(nodes, LABELS.skip) || findNode(nodes, LABELS.home)));
      const ids = processIds();
      if (!ids.length) throw new Error('The app has no running process after launch.');
      return { processIds: ids, evidence: screen.screenshot };
    })) return finalize();

    if (!await runCase('onboarding-or-existing-session', async () => {
      let screen = snapshot('onboarding-initial');
      if (!findNode(screen.nodes, LABELS.skip)) return { presented: false, detail: 'Existing completed onboarding state; first-run walkthrough not exercised.' };
      if (!options.allowOnboarding) throw new BlockedError('First-run onboarding is visible. Rerun with --allow-onboarding to explicitly complete it.');
      const actions = [];
      for (let step = 0; step < 4; step++) {
        const button = findNode(screen.nodes, LABELS.start) || findNode(screen.nodes, LABELS.next) || findNode(screen.nodes, LABELS.skip);
        if (!button) break;
        actions.push(button.text || button['content-desc']);
        tap(button);
        await delay(650);
        screen = snapshot(`onboarding-step-${step + 1}`);
        if (!findNode(screen.nodes, LABELS.skip) && findNode(screen.nodes, LABELS.home)) break;
      }
      await waitUi('onboarding-complete', nodes => !findNode(nodes, LABELS.skip) && !!findNode(nodes, LABELS.home));
      return { presented: true, completed: true, actions };
    })) return finalize();

    await runCase('navigate-home', () => navigate('home', [LABELS.homeContent]));
    await runCase('navigate-library', () => navigate('library', [LABELS.libraryContent]));
    await runCase('navigate-history', () => navigate('history', [LABELS.historyContent]));
    await runCase('navigate-profile', () => navigate('profile', [LABELS.profileContent]));
    const scanReached = await runCase('navigate-scan', () => navigate('scan', [LABELS.guide, LABELS.permission, LABELS.capture, LABELS.unavailable]));
    if (scanReached) await runCase('camera-guide-or-permission-screen', async () => {
      let screen = snapshot('camera-initial');
      let guideExercised = false;
      if (findNode(screen.nodes, LABELS.guide)) {
        if (!options.allowOnboarding) throw new BlockedError('The camera guide is visible. --allow-onboarding is required to mark it seen.');
        const ready = findNode(screen.nodes, LABELS.ready);
        if (!ready) throw new Error('The camera guide has no ready button.');
        tap(ready);
        guideExercised = true;
        screen = await waitUi('camera-guide-dismissed', nodes => !findNode(nodes, LABELS.guide)
          && !!(findNode(nodes, LABELS.permission) || findNode(nodes, LABELS.capture) || findNode(nodes, LABELS.unavailable)));
      }
      if (findNode(screen.nodes, LABELS.permission)) {
        if (!findNode(screen.nodes, LABELS.enableCamera)) throw new Error('Camera permission recovery action is missing.');
        return { guideExercised, permissionGate: true, cameraPermissionRequested: false,
          detail: 'Permission-ungranted screen and recovery control are visible. OS permission dialog/camera capture not exercised.' };
      }
      if (findNode(screen.nodes, LABELS.unavailable)) return { guideExercised, cameraUnavailableRecovery: true,
        detail: 'Camera-unavailable recovery screen is visible; real camera capture is unverified.' };
      if (findNode(screen.nodes, LABELS.capture)) return { guideExercised, captureControlVisible: true,
        detail: 'Camera capture UI is visible. No photo was captured or classified.' };
      throw new Error('No supported camera screen was visible.');
    });
    await runCase('return-home', () => navigate('home', [LABELS.homeContent]));
  } catch (error) {
    report.cases.push({ name: 'harness-execution', status: error instanceof BlockedError ? 'blocked' : 'failed', error: error.message });
  }
  return finalize();

  async function finalize() {
    if (adb && serial && packageName && runStartEpoch) {
      await runCase('app-process-alive', () => {
        const ids = processIds();
        if (!ids.length) throw new Error('Application process exited during the smoke run.');
        return { processIds: ids };
      });
      await runCase('no-fatal-runtime-logs', () => {
        if (!pids.size) throw new BlockedError('No application PID was observed; crash attribution is unavailable.');
        const logs = [...pids].map(pid => adbCommand(['logcat', '-d', '-v', 'epoch', `--pid=${pid}`, '-t', '20000'], { timeout: 30000 })).join('\n');
        const scoped = logs.split(/\r?\n/).filter(line => {
          const match = /^\s*(\d+(?:\.\d+)?)\s+(\d+)\s/.exec(line);
          return match && Number(match[1]) >= runStartEpoch && pids.has(match[2]);
        }).join('\n');
        const logPath = save('app-logcat.txt', scoped);
        const fatals = crashLines(logs, runStartEpoch, pids);
        report.runtimeLogs = { path: logPath, deviceStartEpoch: runStartEpoch, processIds: [...pids],
          scopedLineCount: scoped ? scoped.split('\n').length : 0, fatalLines: fatals,
          collection: 'Up to the last 20000 logcat entries per observed app PID; global log buffer preserved.' };
        if (fatals.length) throw new Error(`Fatal application log entries found: ${fatals.slice(0, 4).join('\n')}`);
        return report.runtimeLogs;
      });
      try { snapshot('final'); } catch (error) { report.evidenceWarning = error.message; }
    }
    const expected = ['android-device-ready', 'apk-available', ...(options.install ? ['install-apk-preserving-data'] : []),
      'package-installed', 'launcher-resolved', 'launch-renders-ui', 'onboarding-or-existing-session',
      'navigate-home', 'navigate-library', 'navigate-history', 'navigate-profile', 'navigate-scan',
      'camera-guide-or-permission-screen', 'return-home', 'app-process-alive', 'no-fatal-runtime-logs'];
    for (const name of expected) if (!report.cases.some(item => item.name === name)) {
      report.cases.push({ name, status: 'blocked', error: 'Not executed because a prerequisite did not pass.' });
    }
    report.finishedAt = new Date().toISOString();
    report.counts = Object.fromEntries(['passed', 'failed', 'blocked'].map(status => [status, report.cases.filter(item => item.status === status).length]));
    report.status = report.counts.failed ? 'failed' : report.counts.blocked ? 'blocked' : 'passed';
    report.exitCode = report.counts.failed ? 1 : report.counts.blocked ? 2 : 0;
    const reportPath = save('report.json', `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(options.output, 'latest-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Android smoke ${report.status}: ${JSON.stringify(report.counts)}\nReport: ${reportPath}`);
    return report.exitCode;
  }
}

module.exports = { parseArgs, parseDevices, selectDevice, parseUiXml, findNode, crashLines, LABELS, main };
if (require.main === module) {
  main().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
