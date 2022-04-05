const deepgramListenEndpoint = 'wss://api.deepgram.com/v1/listen';
const deepgramRequestInterval = 300; // milliseconds

let tabStates = {};
let audioContext;
let mediaRecorder;
let socket;

let prevTabId;
let activeTabId;
let toLang = 'en';

function TokenService({endpoint, refreshIn} = {refreshIn: 10}) {
  let token;
  let _service;
  
  async function _fetchToken() {
    if (!token) {
      token = await fetch(endpoint)
        .then(resp => resp.json());

      setTimeout(() => {
        token = null;
        _fetchToken();
      }, 60000 * refreshIn);
    }
    return token;
  }

  _service = {
    init: () => { _fetchToken(); return _service; },
    get: async () => token
  }

  return _service; 
}

const dgTokenService = TokenService({
  endpoint: 'http://localhost:8080/api/deepgram/token',
  refreshIn: 9
}).init();

const azureTokenService = TokenService({
  endpoint: 'http://localhost:8080/api/azuretranslator/token',
  refreshIn: 10
}).init();


function sendToContentScript(tabId, evt, callback) {
  if (tabId === activeTabId) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabId, {...evt, tabId, toLang}, callback);
    });
  } else {
    chrome.tabs.sendMessage(tabId, {...evt, tabId, toLang}, callback);
  }
}

// Load any preferences
function loadPreferences() {
  chrome.storage.local.get(['___dgLang'], (result) => {
    if (result && result.___dgLang) {
      toLang = result.___dgLang;
    } else {
      toLang = 'en';
    }
  });
}

function onError(err) {
  console.log(err);
  stopAudioCapture();
}

function stopAudioCapture() {
  console.log(`Stopping audio recorder, context,...`);
  if (socket && socket.readyState === socket.OPEN) 
    socket.close();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') 
    mediaRecorder.stop();
}

function translate(transcript, onSuccess) {
  azureTokenService.get()
    .then((token) => _translateWithToken(token, transcript, onSuccess));
}

function _translateWithToken(token, transcript, onSuccess) {
  // TODO: Detect if from/to are same and skip translation 
  if (transcript.trim() === '')
    return;

  const data = JSON.stringify([{Text: transcript}]);
  fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${toLang}`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': token.key,
      'Ocp-Apim-Subscription-Region': token.region,
      'Content-Type': 'application/json; charset=UTF-8',
      'Content-Length': data.length
    },
    body: data
  }).then(resp => resp.json())
  .then(onSuccess);
}

function parseDeepgramMessage(message) {
  const data = JSON.parse(message.data);
  if (data.channel.alternatives) {
    const transcript = data.channel.alternatives
      .map(t => t.transcript)
      .join(' '); 

    if (toLang === 'en') {
      sendToContentScript(activeTabId, {
        type: 'text',
        lang: toLang,
        text: transcript
      });
    } else {
      translate(transcript, (translations) => {
        if (translations) {
          sendToContentScript(activeTabId, {
            type: 'text',
            lang: toLang,
            text: translations[0].translations[0].text
          })
        }
      });
    }
  }  
}

async function _startAudioCaptureForStream(stream) {
  dgTokenService.get()
    .then((token) => _startAudioCaptureForStreamWithToken(token, stream));
}

async function _startAudioCaptureForStreamWithToken(token, stream) {
  mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm'});
  mediaRecorder.onerror = onError;

  socket = new WebSocket(deepgramListenEndpoint, ['token', token.key]);
  socket.onclose = () => console.log('Socket onclosed');
  socket.onerror = onError;
  socket.onmessage = parseDeepgramMessage;
  
  mediaRecorder.ondataavailable = (evt) => {
    if (socket && socket.readyState === socket.OPEN) 
      socket.send(evt.data);
  }
  mediaRecorder.onstop = () => {
    console.log('Stopping mediaRecorder, trying to close socket too...');
    if (socket && socket.readyState === socket.OPEN) 
      socket.close;
  }
  mediaRecorder.start(deepgramRequestInterval);
}

function _startNewAudioCapture(tabId) {
  console.log('Starting new audio capture')
  chrome.tabCapture.capture(
    {audio: true, video: false},
    (stream) => {
      audioContext = new AudioContext();
      audioContext.createMediaStreamSource(stream)
        .connect(audioContext.destination);
      tabStates[tabId].stream = stream;
      tabStates[tabId].audioContext = audioContext;
      _startAudioCaptureForStream(stream);
    }
  )
}

function _startExistingAudioCapture(tabId) {
  console.log('Starting audio capture for existing tab');
  _startAudioCaptureForStream(tabStates[tabId].stream);
}

function startAudioCapture(tabId) {
  chrome.tabCapture.getCapturedTabs((infos) => {
    if (infos.some(info => info.tabId === tabId)) {
      console.log('start existing audio capture')
      _startExistingAudioCapture(tabId);
    } else {
      console.log('start existing audio capture')
      _startNewAudioCapture(tabId);
    }
  })
}

function onActivateTab(tabInfo) {
  console.log(`Tab[${tabInfo.tabId}] activated!`);
  prevTabId = activeTabId;
  activeTabId = tabInfo.tabId;
  if (prevTabId) {
    sendToContentScript(prevTabId, {type: 'pause'});
    stopAudioCapture();
  }
  if (tabStates[activeTabId] && tabStates[activeTabId].isopen) {
    startAudioCapture(activeTabId);
  }
}

function onExtensionAction() {
  if (tabStates[activeTabId] && tabStates[activeTabId].isopen) {
    sendToContentScript(activeTabId, {type: 'close'}, stopAudioCapture);
    tabStates[activeTabId].isopen = false;
  } else {
    sendToContentScript(activeTabId, {type: 'open'}, 
      () => startAudioCapture(activeTabId));
    if (tabStates[activeTabId]) {
      tabStates[activeTabId].isopen = true;
    } else {
      tabStates[activeTabId] = {isopen: true};
    }
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === 'complete') {
    if (tabStates[activeTabId] && tabStates[activeTabId].isopen) {
      sendToContentScript(activeTabId, {type: 'open'},
        () => startAudioCapture(activeTabId));
    }
  }
})

function setLangPreference(lang) {
  console.log('setting toLang', lang);
  toLang = lang;
  chrome.storage.local.set({'___dgLang': lang});
}

function onContentMessage(evt, sender, callback) {
  if (evt.type === 'stoptran') {
    stopAudioCapture();
  } else if (evt.type === 'starttran') {
    startAudioCapture(evt.tabId);
  } else if (evt.type === 'lang') {
    setLangPreference(evt.lang);
  }
  if (callback) callback();
}

////////// initialize and start extension /////////////
loadPreferences();
chrome.tabs.onActivated.addListener(onActivateTab);
chrome.browserAction.onClicked.addListener(onExtensionAction);
chrome.runtime.onMessage.addListener(onContentMessage);