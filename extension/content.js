const dgWrapperDivStyle = 'padding:2px 1px;position:fixed;z-index:100000;left:10%;background-color:#FFFCEB;color:black;width:80%';
const dgWrapperDiv = `<div id="___dgWrapper" style="top:0;${dgWrapperDivStyle}">
  <div style="border-bottom: 1px solid; display:flex;justify-content:flex-end;align-items:center;height:28px;padding:2px;font-size:14px;">
    <span style="flex-grow:10;font-weight:bolder;font-size:16px;">Transcriber</span>
    <button id="___dgToTop" style="margin:0;font-size:12px;">top &uarr;</button>
    <button id="___dgToBottom" style="margin:0 20px;font-size:12px;">bottom &darr;</button>
    <label for="___dgLang" style="font-size:12px;width:auto !important;">Lang:</label>
    <select id="___dgLang" style="font-size:12px;padding:0;margin:0;width:auto !important;">
      <option value="en">English (default)</option>
      <option value="fr">French</option>
      <option value="de">German</option>
      <option value="hu">Hungarian</option>
      <option value="ja">Japanese</option>
      <option value="vi">Vietnamese</option>
    </select>
  </div>
  <div id="___dgTranscript" style="resize:vertical;overflow-y:auto;height:60px;font-size:16px;line-height:1.15">
    <span id="___dgPrevious" style="color:#999"></span>
    <span id="___dgCurrent" style="font-weight:bold"></span>
  </div>
</div>`;

let prevTranslations = '';
let currTranslation = '';
let isTranslating = false;

function sendToBackground(evt, callback) {
  chrome.runtime.sendMessage(evt, callback);
}

window.addEventListener('message', (evt) => {
  // only accept our messages
  if (evt.source !== window) {
    return;
  }
  if (evt.data.type && evt.data.type === '___dgLang') {
    sendToBackground({type: 'lang', lang: evt.data.lang});
  }
});

function getDisplayDiv() {
  return document.getElementById('___dgWrapper');
}

function changeSelectedLang(evt) {
  window.postMessage({type: '___dgLang', lang: evt.target.value});
}

function setSelectedLang(lang) {
  if (lang) {
    document.getElementById('___dgLang').value = lang;
  }
}

function setDisplayToTop() {
  getDisplayDiv().style.cssText=`top:0;${dgWrapperDivStyle}`;
}

function setDisplayToBottom() {
  getDisplayDiv().style.cssText=`bottom:0;${dgWrapperDivStyle}`;
}

function createDisplay(lang) {
  if (!getDisplayDiv()) {
    let template = document.createElement('template');
    template.innerHTML = dgWrapperDiv;
    document.getElementsByTagName('body')[0].append(template.content.firstChild);
    document.getElementById('___dgLang').addEventListener('change', changeSelectedLang);
    document.getElementById('___dgToTop').addEventListener('click', setDisplayToTop);
    document.getElementById('___dgToBottom').addEventListener('click', setDisplayToBottom);
    setSelectedLang(lang);
  }
  return getDisplayDiv();
}

function _displayTranslation(prev, curr) {
  document.getElementById('___dgPrevious').innerText = prev;
  document.getElementById('___dgCurrent').innerText = curr;
  document.getElementById('___dgTranscript').scrollTop = 1000000;
}

function updateDisplay(text) {
  if (text) {
    prevTranslations += ' ' + currTranslation;
    currTranslation = text;
    _displayTranslation(prevTranslations, currTranslation);
  }
}

function pauseTranslations() {
  const s = prevTranslations + ' ' + currTranslation;
  if (s.trim() !== '') {
    _displayTranslation(s, '[paused]...');
  }
}

function showDisplay() {
  const el = getDisplayDiv();
  if (!el) return false;
  el.style.display = 'block';
  return true;
}

function hideDisplay() {
  const el = getDisplayDiv();
  if (!el) return false;
  el.style.display = 'none';
  return true;
}

chrome.runtime.onMessage.addListener((evt, sender, callback) => {
  if (evt.type === 'close') {
    hideDisplay();
  }
  else {
    createDisplay(evt.toLang);
    if (evt.type === 'open') {
      showDisplay();
    } else if (evt.type === 'text') {
      updateDisplay(evt.text);
    } else if (evt.type === 'pause') {
      pauseTranslations();
    }
    if (evt.toLang) {
     setSelectedLang(evt.toLang);
    }
  }
  if (callback) {
    callback();
  }
});
