const $ = (s) => document.querySelector(s);
const KEY = 'buddy-v2';

let state = JSON.parse(localStorage.getItem(KEY) || 'null') || {
  screen: 'home',
  step: 0,
  memories: [],
  stops: 5,
};

const steps = [
  { place: 'Hotel', title: 'Good morning, traveler.', text: 'Breakfast first. Buddy will keep today simple and stay with you.' },
  { place: 'Walk to bus stop', title: 'Head for the bus stop.', text: 'Take your time. You are looking for the blue Athens city bus.' },
  { place: 'Bus 230', title: 'Look for 230 — AKROPOLI', text: 'Blue bus. Route 230. Destination AKROPOLI.' },
  { place: 'On the bus', title: 'You are on the right bus.', text: 'Buddy will count the stops. Keep your phone away and enjoy Athens.' },
  { place: 'Acropolis', title: 'You made it to the Acropolis.', text: 'This is the moment. Look up. Be here.' },
  { place: 'Return', title: 'Ready to head back?', text: 'Buddy remembers your hotel. One touch starts the return.' },
  { place: 'Hotel', title: 'Welcome back.', text: 'Your day and the memories you captured are waiting for you.' },
];

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function btn(text, tone, action) {
  return `<button class="btn ${tone}" onclick="${action}">${text}</button>`;
}

function shell(content) {
  return `<div class="app"><header class="brand"><h1>BUDDY</h1><p>Your travel companion</p></header><div class="mapline"></div>${content}</div>`;
}

function home() {
  return shell(`<section class="card hero"><span class="eyebrow">First Journey · Athens</span><h2>Adventure is waiting.</h2><p>Buddy keeps the directions simple and the memories effortless.</p>${btn(state.step ? 'Continue Journey' : 'Start Athens Journey', 'navy', "go('journey')")}${btn('My Memories', 'plum', "go('memories')")}</section><section class="card"><div class="step">Founding rule</div><p class="quiet">One visual. One message. One obvious action.<br>Don't count the miles, count the moments.</p></section>`);
}

function journey() {
  const current = steps[state.step];
  const transit = state.step === 3
    ? `<div class="card"><div class="step">Stops remaining</div><div class="big-number">${state.stops}</div>${btn('Next Stop', 'paper', 'nextStop()')}${btn('Repeat My Stop', 'navy', "say('Route 230. Get off at Akropoli.')")}</div>`
    : '';

  return shell(`<button class="back" onclick="go('home')">← Home</button><section class="card hero"><span class="eyebrow">${current.place}</span><h2>${current.title}</h2><p>${current.text}</p></section>${transit}<button class="capture" onclick="capture()">TAP ONCE<small>TO CAPTURE A MEMORY</small></button><div class="nav">${state.step > 0 ? btn('Back', 'paper', 'prev()') : ''}${state.step < steps.length - 1 ? btn('Continue', 'leaf', 'next()') : btn('Finish Day', 'gold', "go('memories')")}</div>${btn('Am I going the right direction?', 'navy', 'direction()')}${btn('Return to Hotel', 'plum', 'returnHotel()')}`);
}

function memories() {
  const list = state.memories.length
    ? state.memories.map((memory, index) => `<article class="memory" onclick="openMemory(${index})"><time>${new Date(memory.time).toLocaleString()}</time><h3>${memory.place}</h3><p>${memory.note || 'A moment worth keeping.'}</p>${memory.voice ? '<p class="eyebrow">Voice reflection kept</p>' : ''}${memory.photos?.length ? `<div class="photos">${memory.photos.slice(0, 3).map((photo) => `<img src="${photo}" alt="Memory photo">`).join('')}</div>` : ''}</article>`).join('')
    : `<p class="quiet">Your captured moments will appear here.</p>`;

  return shell(`<button class="back" onclick="go('home')">← Home</button><section class="card hero"><span class="eyebrow">Travel Journal</span><h2>My Memories</h2><p>${state.memories.length} moment${state.memories.length === 1 ? '' : 's'} kept.</p></section><section class="card">${list}</section>`);
}

function render() {
  $('#app').innerHTML = state.screen === 'journey' ? journey() : state.screen === 'memories' ? memories() : home();
  save();
}

function go(screen) {
  state.screen = screen;
  render();
}

function next() {
  state.step = Math.min(steps.length - 1, state.step + 1);
  if (state.step === 3) state.stops = 5;
  render();
}

function prev() {
  state.step = Math.max(0, state.step - 1);
  render();
}

function nextStop() {
  state.stops = Math.max(0, state.stops - 1);
  if (state.stops === 1) toast('Get ready — your stop is next.');
  if (state.stops === 0) {
    state.step = 4;
    toast('AKROPOLI — this is your stop.');
  }
  render();
}

function capture() {
  const memory = {
    time: new Date().toISOString(),
    place: steps[state.step].place,
    note: '',
    photos: [],
    voice: false,
  };
  state.memories.unshift(memory);
  save();
  toast('Captured. Time and place saved.');
  captureSheet(0);
}

function captureSheet(index) {
  const memory = state.memories[index];
  if (!memory) return;
  document.querySelector('#modal')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="modal"><section class="sheet"><div class="eyebrow">Captured automatically</div><h2>${memory.place}</h2><p>Buddy already kept the time and place. Add a photo, your voice, or a few words — or simply save the moment.</p>${btn('Take Photo', 'navy', `photos(${index})`)}<button id="voiceBtn" class="btn leaf" onclick="voice(${index})">${memory.voice ? 'Record Another Voice Reflection' : 'Record Voice Reflection'}</button><textarea id="memoryNote" class="note" placeholder="Write a few words…">${memory.note || ''}</textarea>${memory.photos?.length ? `<div class="photos">${memory.photos.map((photo) => `<img src="${photo}" alt="Memory photo">`).join('')}</div>` : ''}${btn('Save Memory', 'gold', `saveMemory(${index})`)}${btn('Close', 'paper', 'closeModal()')}</section></div>`);
}

function saveMemory(index) {
  const note = $('#memoryNote');
  if (note) state.memories[index].note = note.value.trim();
  save();
  closeModal();
  toast('Memory saved. Keep exploring.');
}

function closeModal() {
  if (rec?.state === 'recording') stopVoice();
  document.querySelector('#modal')?.remove();
}

async function photos(index) {
  const input = $('#photoInput');
  input.onchange = async () => {
    const files = [...input.files].slice(0, 6);
    for (const file of files) {
      try {
        state.memories[index].photos.push(await compressImage(file));
      } catch (_) {
        toast('One photo could not be saved.');
      }
    }
    save();
    input.value = '';
    captureSheet(index);
    toast(`${files.length} photo${files.length === 1 ? '' : 's'} kept.`);
  };
  input.click();
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

let rec = null;
let voiceStream = null;
let voiceMemoryIndex = null;

async function voice(index) {
  if (rec?.state === 'recording') {
    stopVoice();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast('Microphone recording is not available here.');
    return;
  }
  try {
    voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceMemoryIndex = index;
    rec = new MediaRecorder(voiceStream);
    rec.onstop = () => {
      voiceStream?.getTracks().forEach((track) => track.stop());
      if (voiceMemoryIndex !== null && state.memories[voiceMemoryIndex]) {
        state.memories[voiceMemoryIndex].voice = true;
        save();
      }
      rec = null;
      voiceStream = null;
      voiceMemoryIndex = null;
      const button = document.getElementById('voiceBtn');
      if (button) button.textContent = 'Record Another Voice Reflection';
      toast('Voice reflection kept.');
    };
    rec.start();
    const button = document.getElementById('voiceBtn');
    if (button) button.textContent = 'Stop Voice Recording';
    toast('Recording — tap the same button to stop.');
  } catch (_) {
    toast('Buddy could not access the microphone.');
  }
}

function stopVoice() {
  if (rec?.state === 'recording') rec.stop();
}

function openMemory(index) {
  captureSheet(index);
}

function direction() {
  say(`Yes. You are heading toward ${steps[state.step].place}. Buddy is with you.`);
  toast('Yes — you are going the right direction.');
}

function returnHotel() {
  state.step = 6;
  render();
  say('Returning to your hotel. Buddy remembers the way.');
}

function say(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}

function toast(text) {
  document.querySelector('.toast')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="toast">${text}</div>`);
  setTimeout(() => document.querySelector('.toast')?.remove(), 2600);
}

render();
