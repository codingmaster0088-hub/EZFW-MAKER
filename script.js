// --- DATABASE & CONSTANTS ---

const AIRCRAFT_DATABASE = {
    "ALA": { "2/0": 119310, "2/9": 122962, "2/10": 123037, "2/11": 123112, "3/0": 119390, "3/9": 123042, "3/10": 123117, "3/11": 123192, "4/0": 119470, "4/9": 123122, "4/10": 123197, "4/11": 123272 },
    "ALB": { "2/0": 119858, "2/9": 123510, "2/10": 123585, "2/11": 123660, "3/0": 119938, "3/9": 123590, "3/10": 123665, "3/11": 123740, "4/0": 120018, "4/9": 123670, "4/10": 123745, "4/11": 123820 },
    "ALD": { "2/0": 118977, "2/9": 122629, "2/10": 122704, "2/11": 122779, "3/0": 119057, "3/9": 122709, "3/10": 122784, "3/11": 122859, "4/0": 119137, "4/9": 122789, "4/10": 122864, "4/11": 122939 },
    "AJE": { "2/4": 43140, "2/5": 43215, "2/6": 43290, "3/4": 43220, "3/5": 43295, "3/6": 43370 },
    "AJF": { "2/4": 42871, "2/5": 42946, "2/6": 43021, "3/4": 42951, "3/5": 43026, "3/6": 43101 },
    "AJG": { "2/4": 42591, "2/5": 42666, "2/6": 42741, "3/4": 42671, "3/5": 42746, "3/6": 42821 },
    "AJH": { "2/4": 42574, "2/5": 42649, "2/6": 42724, "3/4": 42654, "3/5": 42729, "3/6": 42804 },
    "BBG": { "2/0": 42534, "2/4": 42914, "2/5": 43009, "3/0": 42629, "3/4": 43009, "3/5": 43104 },
    "BBH": { "2/0": 42534, "2/4": 42914, "2/5": 43009, "3/0": 42629, "3/4": 43009, "3/5": 43104 },
    "SXA": { "2/4": 43557, "2/5": 43632, "2/6": 43707, "3/4": 43642, "3/5": 43717, "3/6": 43792 },
    "ATR_GENERIC": { "2/2": 14015, "3/2": 14095, "2/0": 13865, "3/0": 13945 }
};

const baggageOut = { DXB: 18, SHJ: 19, AUH: 19, SIN: 18, CAN: 14, DOH: 18, JED: 19, BKK: 12, MLE: 13, KUL: 16, RUH: 19, MAA: 12, MCT: 20 };
const baggageIn = { MAA: 30, MLE: 35, BKK: 30, KUL: 35, SIN: 40, CAN: 40, DXB: 40, SHJ: 40, AUH: 40, DOH: 40, JED: 45, RUH: 45, MCT: 38 };

const ADULT_WEIGHT = 75;
const CHILD_WEIGHT = 35;
const INFANT_WEIGHT = 10;
const ULD_WEIGHT = 68;
const PMC_WEIGHT = 97;

let tableData = []; 
let loadControllerName = '';
let currentMode = 'ACTUAL'; 
let editingRow = null;
let activeIntervals = {};

function showPopup(message) {
    const popup = document.getElementById('customPopup');
    const msg = document.getElementById('popupMessage');
    msg.innerText = message;
    popup.style.display = 'flex';
    setTimeout(() => { popup.style.display = 'none'; }, 2000);
}

window.onload = function() { 
    checkLogin(); 
};

function checkLogin() {
    const savedName = localStorage.getItem('loadControllerName');
    if (savedName) {
        loadControllerName = savedName;
        document.getElementById('welcome').style.display = 'none';
        document.getElementById('selection-page').style.display = 'flex';
        document.getElementById('welcomeUser').innerText = loadControllerName;
        loadSavedData();
        startTypingAnimations();
    } else {
        document.getElementById('welcome').style.display = 'flex';
        document.getElementById('selection-page').style.display = 'none';
        document.getElementById('form-page').style.display = 'none';
    }
}

function login() {
  const controllerNameInput = document.getElementById('controllerName').value.trim();
  if (controllerNameInput === "") {
    alert("PLEASE ENTER THE LOAD CONTROLLER NAME.");
    return;
  }
  loadControllerName = controllerNameInput.toUpperCase();
  localStorage.setItem('loadControllerName', loadControllerName);
  
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('flightDate', today);
  
  showPopup("WELCOME OFFICER");
  setTimeout(checkLogin, 1500); 
}

function selectMode(mode) {
    currentMode = 'ACTUAL'; 
    document.getElementById('selection-page').style.display = 'none';
    document.getElementById('form-page').style.display = 'block';
    
    document.getElementById('displayControllerName').textContent = loadControllerName;
    
    setupInputsForMode();
    renderTableFromData(); 
    startTypingAnimations();
}

function goToDash() {
    document.getElementById('form-page').style.display = 'none';
    document.getElementById('selection-page').style.display = 'flex';
    clearInputs();
    startTypingAnimations();
}

function logout() {
    showPopup("BYE BYE OFFICER");
    setTimeout(() => {
        localStorage.clear();
        location.reload();
    }, 2000);
}

function startTypingAnimations() {
    runTypewriter("dashboardTyping", "INVENTED BY RADOAN RASEL", 120);
    runTypewriter("headerTyping", "INVENTED BY RADOAN RASEL", 120);
}

function runTypewriter(elementId, text, speed) {
    if (activeIntervals[elementId]) {
        clearInterval(activeIntervals[elementId]);
    }
    const elem = document.getElementById(elementId);
    if (!elem) return;
    
    let i = 0;
    elem.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            elem.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(activeIntervals[elementId]);
            setTimeout(() => {
                runTypewriter(elementId, text, speed);
            }, 3000);
        }
    }
    activeIntervals[elementId] = setInterval(type, speed);
}

function setupInputsForMode() {
    const regContainer = document.getElementById('acRegContainer');
    const crewContainer = document.getElementById('crewConfContainer');
    const paxBreakdowns = document.querySelectorAll('.pax-breakdown');
    const totalPaxInput = document.getElementById('totalPax');

    regContainer.innerHTML = `
      <input list="acRegList" type="text" id="acReg" placeholder="A/C REG (e.g. HS-SXA)" oninput="handleRegInput()" onchange="this.className='has-value'">
      <datalist id="acRegList">
        <option value="S2-ALA"><option value="S2-ALB"><option value="S2-ALD">
        <option value="S2-AJE"><option value="S2-AJF"><option value="S2-AJG"><option value="S2-AJH">
        <option value="PK-BBG"><option value="PK-BBH">
        <option value="HS-SXA">
        <option value="S2-AKA"><option value="S2-AKB"><option value="S2-AKC"><option value="S2-AKD"><option value="S2-AKE">
      </datalist>
    `;
    crewContainer.style.display = 'flex';
    paxBreakdowns.forEach(el => el.style.display = 'flex');
    
    totalPaxInput.readOnly = true;
    totalPaxInput.style.backgroundColor = '#e0e0e0';
    totalPaxInput.oninput = null; 

    toggleAirbusInputs();
}

function handleFlightNoInput() {
    const flt = document.getElementById('fltNo').value;
    if(!flt) return;
    const fltNum = parseInt(flt);
    let org = "", des = "";

    if (fltNum === 341) { org = "DAC"; des = "DXB"; }
    else if (fltNum === 342) { org = "DXB"; des = "DAC"; }
    else if (fltNum === 344) { org = "DXB"; des = "DAC"; }
    else if (fltNum >= 141 && fltNum <= 159 && fltNum % 2 !== 0) { org = "DAC"; des = "CXB"; }
    else if (fltNum >= 142 && fltNum <= 160 && fltNum % 2 === 0) { org = "CXB"; des = "DAC"; }
    else if ([201, 203].includes(fltNum)) { org = "DAC"; des = "CCU"; }
    else if ([202, 204].includes(fltNum)) { org = "CCU"; des = "DAC"; }
    else if ([205, 207].includes(fltNum)) { org = "DAC"; des = "MAA"; }
    else if ([206, 208].includes(fltNum)) { org = "MAA"; des = "DAC"; }
    else if ([345, 347].includes(fltNum)) { org = "DAC"; des = "SHJ"; }
    else if ([346, 348].includes(fltNum)) { org = "SHJ"; des = "DAC"; }
    else if (fltNum === 349) { org = "DAC"; des = "AUH"; }
    else if (fltNum === 350) { org = "AUH"; des = "DAC"; }
    else if ([333, 335].includes(fltNum)) { org = "DAC"; des = "DOH"; }
    else if ([334, 336].includes(fltNum)) { org = "DOH"; des = "DAC"; }
    else if ([321, 323].includes(fltNum)) { org = "DAC"; des = "MCT"; }
    else if ([322, 324].includes(fltNum)) { org = "MCT"; des = "DAC"; }
    else if ([315, 317].includes(fltNum)) { org = "DAC"; des = "KUL"; }
    else if ([316, 318].includes(fltNum)) { org = "KUL"; des = "DAC"; }
    else if ([307, 309].includes(fltNum)) { org = "DAC"; des = "SIN"; }
    else if ([308, 310].includes(fltNum)) { org = "SIN"; des = "DAC"; }
    else if ([217, 219].includes(fltNum)) { org = "DAC"; des = "BKK"; }
    else if ([218, 220].includes(fltNum)) { org = "BKK"; des = "DAC"; }
    else if ([325, 327].includes(fltNum)) { org = "DAC"; des = "CAN"; }
    else if ([326, 328].includes(fltNum)) { org = "CAN"; des = "DAC"; }
    else if ([337, 339].includes(fltNum)) { org = "DAC"; des = "MLE"; }
    else if ([338, 340].includes(fltNum)) { org = "MLE"; des = "DAC"; }
    else if ([361, 363].includes(fltNum)) { org = "DAC"; des = "JED"; }
    else if ([362, 364].includes(fltNum)) { org = "JED"; des = "DAC"; }
    else if ([381, 383].includes(fltNum)) { org = "DAC"; des = "RUH"; }
    else if ([382, 384].includes(fltNum)) { org = "RUH"; des = "DAC"; }
    
    if (org && des) {
        document.getElementById('from').value = org;
        document.getElementById('destination').value = des;
        document.getElementById('from').className = 'has-value';
        document.getElementById('destination').className = 'has-value';
        updateTotalBaggageWeight();
    }
}

function handleRegInput() {
    let inputRaw = document.getElementById('acReg').value.toUpperCase();
    document.getElementById('acReg').value = inputRaw;
    
    let key = inputRaw;
    if(inputRaw.includes("-")) key = inputRaw.split("-")[1];

    const crewConfList = document.getElementById('crewConfList');
    crewConfList.innerHTML = ''; 
    
    let options = [];
    if (["ALA", "ALB", "ALD"].includes(key)) {
        options = ["2/0", "2/9", "2/10", "2/11", "3/0", "3/9", "3/10", "3/11", "4/0", "4/9", "4/10", "4/11"];
    } else if (["AJE", "AJF", "AJG", "AJH", "BBG", "BBH", "SXA"].includes(key)) {
        if(key.startsWith("BB")) options = ["2/0", "2/4", "2/5", "3/0", "3/4", "3/5"];
        else options = ["2/4", "2/5", "2/6", "3/4", "3/5", "3/6"];
    } else if (key.startsWith("AK")) {
        options = ["2/2", "3/2", "2/0", "3/0"];
    }

    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        crewConfList.appendChild(el);
    });

    toggleAirbusInputs(key);
    calculateEZFW(); 
}

function getAircraftType(input) {
    if (!input) return "BOEING";
    input = input.toUpperCase();
    
    let key = input;
    if (input.includes("-")) key = input.split("-")[1];
    
    if (key.startsWith("AL")) return "AIRBUS";
    if (key.startsWith("AK")) return "ATR";
    if (key.startsWith("AJ") || key.startsWith("BB") || key === "SXA") return "BOEING";
    
    return "BOEING"; 
}

function getAircraftMaxZFW(regCode) {
    let key = regCode.toUpperCase();
    if (key.includes("-")) key = key.split("-")[1];
    
    if (key === "SXA") return 61000;
    if (key === "BBG") return 61688;
    
    const type = getAircraftType(key);
    if (type === "AIRBUS") return 173000;
    if (type === "BOEING") return 62731;
    if (type === "ATR") return 21000;
    return 62731;
}

function toggleAirbusInputs(regKey) {
    const reg = regKey || document.getElementById('acReg').value;
    const type = getAircraftType(reg);
    const airbusFields = document.querySelectorAll('.airbus-field');
    
    if (type === 'AIRBUS') {
        airbusFields.forEach(field => field.style.display = 'flex');
    } else {
        airbusFields.forEach(field => field.style.display = 'none');
        document.getElementById('uld').value = '';
        document.getElementById('pmc').value = '';
    }
}

function calculateEZFW() {
    let dow = 0;
    let totalPassengerWeight = 0;
    let extraWeight = 0;
    
    const totalBag = parseFloat(document.getElementById('bag').value) || 0;
    const cgo = parseFloat(document.getElementById('cgo').value) || 0;

    let inputRaw = document.getElementById('acReg').value.toUpperCase();
    let key = inputRaw;
    if(inputRaw.includes("-")) key = inputRaw.split("-")[1];

    const crewConf = document.getElementById('crewConf').value;
    
    if (key === "SXA") dow = AIRCRAFT_DATABASE["SXA"][crewConf] || 0;
    else if (key.startsWith("AK")) dow = AIRCRAFT_DATABASE["ATR_GENERIC"][crewConf] || 0;
    else if (AIRCRAFT_DATABASE[key]) dow = AIRCRAFT_DATABASE[key][crewConf] || 0;

    const adult = parseInt(document.getElementById('adult').value) || 0;
    const child = parseInt(document.getElementById('child').value) || 0;
    const infant = parseInt(document.getElementById('infant').value) || 0;
    const uldCount = parseFloat(document.getElementById('uld').value) || 0;
    const pmcCount = parseFloat(document.getElementById('pmc').value) || 0;

    const type = getAircraftType(key);
    totalPassengerWeight = (adult * ADULT_WEIGHT) + (child * CHILD_WEIGHT) + (infant * INFANT_WEIGHT);
    
    if(type === 'AIRBUS') extraWeight = (uldCount * ULD_WEIGHT) + (pmcCount * PMC_WEIGHT);

    const ezfw = totalPassengerWeight + totalBag + cgo + extraWeight + dow;
    document.getElementById('ezfw').value = ezfw > 0 ? ezfw.toFixed(0) : "";
}

function updatePaxAndCalc() {
    const adult = parseInt(document.getElementById('adult').value) || 0;
    const child = parseInt(document.getElementById('child').value) || 0;
    const infant = parseInt(document.getElementById('infant').value) || 0;
    document.getElementById('totalPax').value = adult + child + infant;
    updateTotalBaggageWeight();
    calculateEZFW();
}

function updateTotalBaggageWeight() {
  const from = document.getElementById('from').value;
  const dest = document.getElementById('destination').value;
  
  const adult = parseInt(document.getElementById('adult').value) || 0;
  const child = parseInt(document.getElementById('child').value) || 0;
  let bagPayingPax = adult + child; 

  const bagInput = document.getElementById('bag');
  let perPaxBagWeight = 0;

  if (from === 'CAN' && (dest === 'DAC' || dest === 'CGP')) perPaxBagWeight = 31;
  else if ((from === 'DAC' && dest === 'CGP') || (from === 'CGP' && dest === 'DAC')) perPaxBagWeight = 15;
  else if ((from === 'DAC' && dest === 'CXB') || (from === 'CXB' && dest === 'DAC')) perPaxBagWeight = 10;
  else if (from === 'DAC' && dest === 'CCU') perPaxBagWeight = 12;
  else if (from === 'CCU' && dest === 'DAC') perPaxBagWeight = 21;
  else if (dest === 'DAC' || dest === 'CGP' || dest === 'CXB' || dest === 'CCU') perPaxBagWeight = baggageIn[from] || 0;
  else perPaxBagWeight = baggageOut[dest] || 0;
  
  bagInput.value = (bagPayingPax * perPaxBagWeight).toFixed(0);
}

// --- FLST AUTO GENERATOR ---
function generateFromFLST() {
    const text = document.getElementById('flstInput').value.trim();
    const session = document.getElementById('time').value;
    const flightDate = document.getElementById('flightDate').value;

    if(!text || !session || !flightDate) {
        alert("PLEASE FILL FLST, SESSION, AND DATE.");
        return;
    }

    const lines = text.split('\n');
    const parsedFlights = {}; 
    const intlStations = ["CCU", "SIN", "MLE", "BKK", "MCT", "CAN", "MAA", "DOH", "DXB", "AUH", "SHJ", "RUH", "JED", "KUL"];

    lines.forEach(line => {
        if(line.trim() === "") return;
        const parts = line.trim().split(/\s+/);
        if(parts.length < 5) return; 

        let bsIndex = parts.indexOf("BS");
        if(bsIndex === -1) return;

        let fltNo = parseInt(parts[bsIndex + 1]);
        if(isNaN(fltNo)) return;

        let origin = parts[bsIndex + 2];
        let dest = parts[bsIndex + 3];

        if (!intlStations.includes(origin) && !intlStations.includes(dest)) {
            return; 
        }

        let timeStr = "";
        let isPM = false;
        for(let i=0; i<parts.length; i++) {
            if(/\d{2}:\d{2}/.test(parts[i])) {
                timeStr = parts[i];
                if(parts[i+1] === "PM") isPM = true;
                if(parts[i+1] === "AM") isPM = false;
                break;
            }
        }

        let timeMins = 0;
        if(timeStr) {
            let [hh, mm] = timeStr.split(':').map(Number);
            if(isPM && hh < 12) hh += 12;
            if(!isPM && hh === 12) hh = 0;
            timeMins = hh * 60 + mm;
        }

        let reg = "";
        for(let i=0; i<parts.length; i++) {
            if(parts[i].startsWith("S2-") || parts[i].startsWith("PK-") || parts[i].startsWith("HS-") || parts[i] === "SXA") {
                reg = parts[i];
                break;
            }
        }

        let pax = 0;
        for(let i = parts.length - 1; i >= 0; i--) {
            if(!isNaN(parts[i]) && parts[i].length <= 3) {
                pax = parseInt(parts[i]);
                break;
            }
        }

        parsedFlights[fltNo] = { fltNo, origin, dest, timeMins, reg, pax };
    });

    let flightsToAdd = [];
    let startMins = 0, endMins = 0;
    if(session === "MORNING") { startMins = 360; endMins = 840; }
    else if(session === "EVENING") { startMins = 845; endMins = 1435; }

    Object.values(parsedFlights).forEach(flt => {
        if(flt.fltNo % 2 !== 0) { 
            if(flt.timeMins >= startMins && flt.timeMins <= endMins) {
                flightsToAdd.push(flt);
                let arrivalFlt = parsedFlights[flt.fltNo + 1];
                if(arrivalFlt) flightsToAdd.push(arrivalFlt);
            }
        }
    });

    flightsToAdd.forEach(flt => {
        let key = flt.reg;
        if(key && key.includes("-")) key = key.split("-")[1];
        
        let type = getAircraftType(key || "");

        let crewConf = "";
        if(key) {
            if (type === "AIRBUS") crewConf = "2/10";
            else if (type === "BOEING") crewConf = "2/5";
            else if (type === "ATR") crewConf = "2/2";
        }

        let dow = 0;
        if(key) {
            if (key === "SXA") dow = AIRCRAFT_DATABASE["SXA"][crewConf] || 0;
            else if (key.startsWith("AK")) dow = AIRCRAFT_DATABASE["ATR_GENERIC"][crewConf] || 0;
            else if (AIRCRAFT_DATABASE[key]) dow = AIRCRAFT_DATABASE[key][crewConf] || 0;
        }

        // Apply Pax Limits
        let finalPax = flt.pax;
        if (type === "ATR" && finalPax > 72) finalPax = 72;
        else if (type === "BOEING" && finalPax > 189) finalPax = 189;
        else if (type === "AIRBUS" && finalPax > 436) finalPax = 436;

        let perPaxBagWeight = 0;
        let from = flt.origin;
        let dest = flt.dest;
        if (from === 'CAN' && (dest === 'DAC' || dest === 'CGP')) perPaxBagWeight = 31;
        else if ((from === 'DAC' && dest === 'CGP') || (from === 'CGP' && dest === 'DAC')) perPaxBagWeight = 15;
        else if ((from === 'DAC' && dest === 'CXB') || (from === 'CXB' && dest === 'DAC')) perPaxBagWeight = 10;
        else if (from === 'DAC' && dest === 'CCU') perPaxBagWeight = 12;
        else if (from === 'CCU' && dest === 'DAC') perPaxBagWeight = 21;
        else if (dest === 'DAC' || dest === 'CGP' || dest === 'CXB' || dest === 'CCU') perPaxBagWeight = baggageIn[from] || 0;
        else perPaxBagWeight = baggageOut[dest] || 0;

        let bagWeight = finalPax * perPaxBagWeight;
        let paxWeight = finalPax * 75; 
        let ezfw = dow + paxWeight + bagWeight;

        let maxZfw = getAircraftMaxZFW(flt.reg || type);
        let isLimitCrossed = ezfw > maxZfw;
        let statusText = isLimitCrossed ? "LIMIT CROSSED" : "WITHIN LIMIT";
        let finalEZFWValue = isLimitCrossed ? maxZfw : ezfw;

        let displayReg = flt.reg || type;
        if (key === "SXA") displayReg = "HS-SXA";

        const rowObject = {
            reg: displayReg,
            regCode: key || type,
            crewConf: crewConf,
            fltNo: 'BS-' + flt.fltNo,
            origin: flt.origin,
            dest: flt.dest,
            adult: finalPax,
            child: 0,
            infant: 0,
            totalPax: finalPax,
            bag: bagWeight,
            cgo: 0,
            uld: '-',
            pmc: '-',
            ezfw: finalEZFWValue.toFixed(0),
            rawEzfw: ezfw.toFixed(0),
            status: statusText,
            isLimitCrossed: isLimitCrossed,
            mode: 'ACTUAL'
        };

        tableData.push(rowObject);
    });

    tableData.sort((a, b) => {
        const fltA = parseInt(a.fltNo.replace(/\D/g, '')) || 0;
        const fltB = parseInt(b.fltNo.replace(/\D/g, '')) || 0;
        return fltA - fltB;
    });

    saveDataLocally();
    renderTableFromData();
    document.getElementById('flstInput').value = ''; 
    alert("FLIGHTS GENERATED SUCCESSFULLY!");
}

function addRow() {
  const regInput = document.getElementById('acReg').value;
  const fltNoInput = document.getElementById('fltNo').value;
  
  if(!regInput || !fltNoInput) {
     alert('PLEASE FILL AIRCRAFT AND FLIGHT NUMBER');
     return;
  }

  const currentEZFW = parseFloat(document.getElementById('ezfw').value) || 0;
  let type = getAircraftType(regInput);
  
  const maxZfw = getAircraftMaxZFW(regInput);
  let statusText = "WITHIN LIMIT";
  let isLimitCrossed = false;
  let displayEZFW = currentEZFW;

  if (currentEZFW > maxZfw) {
      isLimitCrossed = true;
      statusText = "LIMIT CROSSED";
      displayEZFW = maxZfw; 
  }

  let displayReg = regInput;
  let key = regInput;
  if(regInput.includes("-")) key = regInput.split("-")[1];
  
  if(["BBG","BBH"].includes(key)) displayReg = "PK-" + key;
  else if(key === "SXA") displayReg = "HS-SXA";
  else if(key.length === 3) displayReg = "S2-" + key;

  const rowObject = {
    reg: displayReg,
    regCode: regInput, 
    crewConf: document.getElementById('crewConf').value,
    fltNo: 'BS-' + fltNoInput,
    origin: document.getElementById('from').value || '',
    dest: document.getElementById('destination').value || '',
    adult: document.getElementById('adult').value || 0,
    child: document.getElementById('child').value || 0,
    infant: document.getElementById('infant').value || 0,
    bag: document.getElementById('bag').value || 0,
    cgo: document.getElementById('cgo').value || 0,
    uld: document.getElementById('uld').value || '-',
    pmc: document.getElementById('pmc').value || '-',
    ezfw: displayEZFW.toFixed(0),
    rawEzfw: currentEZFW.toFixed(0),
    status: statusText,
    isLimitCrossed: isLimitCrossed,
    mode: 'ACTUAL',
    totalPax: document.getElementById('totalPax').value 
  };

  if (editingRow) {
      const index = editingRow.rowIndex - 1; 
      tableData[index] = rowObject;
      editingRow = null;
      document.getElementById('addBtn').textContent = 'ADD';
  } else {
      tableData.push(rowObject);
  }

  tableData.sort((a, b) => {
      const fltA = parseInt(a.fltNo.replace(/\D/g, '')) || 0;
      const fltB = parseInt(b.fltNo.replace(/\D/g, '')) || 0;
      return fltA - fltB;
  });

  saveDataLocally();
  renderTableFromData();
  clearInputs();
  document.getElementById('acReg').focus();
}

function renderTableFromData() {
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = '';

    tableData.forEach((row, index) => {
        const tr = tbody.insertRow();
        const editCell = tr.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = 'EDIT';
        editBtn.className = 'edit-btn';
        editBtn.onclick = function() { editRow(index); };
        editCell.appendChild(editBtn);

        tr.insertCell().textContent = row.reg;
        tr.insertCell().textContent = row.fltNo;
        tr.insertCell().textContent = row.origin;
        tr.insertCell().textContent = row.dest;
        
        tr.insertCell().textContent = row.adult;
        tr.insertCell().textContent = row.child;
        tr.insertCell().textContent = row.infant;

        tr.insertCell().textContent = row.bag;
        tr.insertCell().textContent = row.cgo;
        
        tr.insertCell().textContent = row.uld;
        tr.insertCell().textContent = row.pmc;

        const ezfwCell = tr.insertCell();
        ezfwCell.textContent = row.ezfw;
        if(row.isLimitCrossed) {
            ezfwCell.style.color = '#f44336';
            ezfwCell.style.fontWeight = 'bold';
        }

        const statusCell = tr.insertCell();
        statusCell.textContent = row.status;
        statusCell.className = row.isLimitCrossed ? 'status-bad' : 'status-ok';

        const actionCell = tr.insertCell();
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'DELETE';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = function() { deleteRow(index); };
        actionCell.appendChild(deleteBtn);
    });
}

function editRow(index) {
  const data = tableData[index];
  const tr = document.querySelector('#resultTable tbody').rows[index];
  editingRow = tr;

  document.getElementById('acReg').value = data.regCode;
  handleRegInput();
  
  document.getElementById('crewConf').value = data.crewConf;
  document.getElementById('fltNo').value = data.fltNo.replace('BS-', '');
  document.getElementById('from').value = data.origin;
  document.getElementById('destination').value = data.dest;
  
  document.getElementById('adult').value = data.adult;
  document.getElementById('child').value = data.child;
  document.getElementById('infant').value = data.infant;
  updatePaxAndCalc();
  
  document.getElementById('uld').value = data.uld === '-' ? '' : data.uld;
  document.getElementById('pmc').value = data.pmc === '-' ? '' : data.pmc;

  document.getElementById('bag').value = data.bag;
  document.getElementById('cgo').value = data.cgo;
  
  document.getElementById('ezfw').value = data.rawEzfw || data.ezfw; 
  document.getElementById('addBtn').textContent = 'UPDATE';
}

function deleteRow(index) {
    tableData.splice(index, 1);
    saveDataLocally();
    renderTableFromData();
    if(editingRow) clearInputs();
}

function clearInputs() {
    document.getElementById('fltNo').value = '';
    document.getElementById('adult').value = '';
    document.getElementById('child').value = '';
    document.getElementById('infant').value = '';
    document.getElementById('totalPax').value = '';
    document.getElementById('bag').value = '';
    document.getElementById('cgo').value = '';
    document.getElementById('uld').value = '';
    document.getElementById('pmc').value = '';
    document.getElementById('ezfw').value = '';
    
    const fromSelect = document.getElementById('from');
    fromSelect.selectedIndex = 0;
    fromSelect.className = '';

    const destSelect = document.getElementById('destination');
    destSelect.selectedIndex = 0;
    destSelect.className = '';
    
    editingRow = null;
    document.getElementById('addBtn').textContent = 'ADD';
}

function saveDataLocally() {
    localStorage.setItem('session', document.getElementById('time').value);
    localStorage.setItem('flightDate', document.getElementById('flightDate').value);
    localStorage.setItem('tableData', JSON.stringify(tableData));
}

function loadSavedData() {
    const savedSession = localStorage.getItem('session');
    const savedDate = localStorage.getItem('flightDate');
    if(savedSession) document.getElementById('time').value = savedSession;
    if(savedDate) document.getElementById('flightDate').value = savedDate;
    else document.getElementById('flightDate').valueAsDate = new Date();

    const savedTable = localStorage.getItem('tableData');
    if(savedTable) {
        tableData = JSON.parse(savedTable);
    }
}

function goBack() {
    if(tableData.length > 0) {
        tableData.pop();
        saveDataLocally();
        renderTableFromData();
    }
}

// --- NEW REPORT FUNCTION ---
function newReport() {
    if(confirm("START NEW REPORT? CURRENT TABLE DATA WILL BE CLEARED.")) {
        tableData = [];
        saveDataLocally();
        renderTableFromData();
        
        document.getElementById('acReg').value = '';
        document.getElementById('crewConf').value = '';
        clearInputs();
    }
}

// --- NEW MODERN AVIATION EXPORTS ---

function getReportHeaderHTML() {
    const session = document.getElementById('time').value || "SESSION";
    const dateVal = document.getElementById('flightDate').value || "DATE";
    return `
    <div class="report-header" style="text-align:center; margin-bottom: 30px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0b2265; position: relative; padding-bottom: 15px; border-bottom: 3px double #0b2265;">
        <div style="display: inline-block; vertical-align: middle; margin-right: 15px;">
            <span style="font-size: 38px; font-weight: 900; letter-spacing: 2px; color: #0b2265; text-transform: uppercase;">US-BANGLA AIRLINES</span>
        </div>
        <div style="font-size: 14px; color: #e11a22; font-weight: bold; letter-spacing: 4px; margin-top: 5px; text-transform: uppercase;">LOAD CONTROL DEPARTMENT</div>
        <h2 style="margin: 15px 0 5px 0; font-size: 20px; font-weight: 700; color: #333; text-transform: uppercase; background: #f4f6f9; display: inline-block; padding: 6px 20px; border-radius: 20px; border: 1px solid #ddd;">
            EZFW REPORT FOR ${session}
        </h2>
        <div style="margin-top: 8px; font-size: 15px; color: #555; font-weight: 600;">DATE: <span style="color: #0b2265;">${dateVal}</span></div>
    </div>`;
}

function getReportFooterHTML() {
    return `
    <div style="display: flex; justify-content: space-between; align-items: stretch; margin-top: 40px; width: 100%; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="background: #fff5f5; color: #c53030; padding: 20px; border-left: 5px solid #e11a22; font-weight: bold; font-size: 13px; max-width: 55%; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; align-items: center;">
            <div>
                <span style="font-size: 14px; text-transform: uppercase; color: #e11a22; display: block; margin-bottom: 5px;">⚠️ Verification Alert</span>
                NOTE: PLEASE CROSS-CHECK WITH THE DUTY LOAD CONTROLLER FOR THE ACTUAL ZERO FUEL WEIGHT (ZFW) BEFORE DEPARTURE.
            </div>
        </div>
        <div style="background: linear-gradient(135deg, #0b2265 0%, #1a365d 100%); color: white; padding: 20px; border-radius: 6px; text-align: center; min-width: 260px; box-shadow: 0 4px 10px rgba(11,34,101,0.15);">
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #9bb1ff; text-transform: uppercase;">REPORT PREPARED BY</p>
            <h3 style="margin: 8px 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff;">${loadControllerName}</h3>
            <div style="display: inline-block; height: 1px; width: 40px; background: #e11a22; margin-bottom: 8px;"></div>
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">LOAD CONTROL OFFICER</p>
        </div>
    </div>`;
}

function getCleanTableClone() {
    const originalTable = document.getElementById('resultTable');
    const tableClone = originalTable.cloneNode(true);
    
    tableClone.rows[0].deleteCell(-1); 
    tableClone.rows[0].deleteCell(0);

    for (let i = 1; i < tableClone.rows.length; i++) {
        tableClone.rows[i].deleteCell(-1);
        tableClone.rows[i].deleteCell(0);
    }
    
    tableClone.style.width = '100%';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.style.color = '#1e293b';
    tableClone.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    tableClone.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
    
    for(let i=0; i<tableClone.rows.length; i++) {
        const row = tableClone.rows[i];
        for(let j=0; j<row.cells.length; j++) {
            row.cells[j].style.border = '1px solid #e2e8f0';
            row.cells[j].style.padding = '12px 10px';
            row.cells[j].style.textAlign = 'center';
            row.cells[j].style.fontSize = '14px'; // Increased font size for best view experience
            row.cells[j].style.fontWeight = 'bold'; // Made all table cell values BOLD

            if(i===0) {
                row.cells[j].style.fontWeight = '700';
                row.cells[j].style.backgroundColor = '#0b2265'; 
                row.cells[j].style.color = '#ffffff';
                row.cells[j].style.textTransform = 'uppercase';
                row.cells[j].style.letterSpacing = '0.5px';
                row.cells[j].style.border = '1px solid #0b2265';
            }
        }
        if(i > 0) {
            const fltCellText = row.cells[1].textContent;
            const fltNum = parseInt(fltCellText.replace(/\D/g, ''));
            if (!isNaN(fltNum)) {
                if (fltNum % 2 === 0) {
                    row.style.backgroundColor = '#bae6fd'; // Applied soft Sky Blue color for Arrival Flights
                } else {
                    row.style.backgroundColor = '#ffffff'; 
                }
            } else {
                row.style.backgroundColor = '#ffffff';
            }
            const statCell = row.cells[row.cells.length - 1];
            const ezfwCell = row.cells[row.cells.length - 2];
            if(statCell.textContent.includes("LIMIT CROSSED")) {
                statCell.innerHTML = '<span style="background-color: #fee2e2; color: #ef4444; padding: 6px 12px; border-radius: 12px; font-weight: bold; font-size: 13px;">LIMIT CROSSED</span>';
                ezfwCell.style.color = '#ef4444';
                ezfwCell.style.fontWeight = 'bold';
            } else {
                statCell.innerHTML = '<span style="background-color: #dcfce7; color: #22c55e; padding: 6px 12px; border-radius: 12px; font-weight: bold; font-size: 13px;">WITHIN LIMIT</span>';
                ezfwCell.style.fontWeight = 'bold';
                ezfwCell.style.color = '#1e293b';
            }
        }
    }
    return tableClone;
}

function downloadTable() {
  const dateVal = document.getElementById('flightDate').value;
  const header = getReportHeaderHTML();
  const footer = getReportFooterHTML();
  const table = getCleanTableClone().outerHTML;
  
  const blob = new Blob([`<html><head><title>EZFW REPORT</title><style>body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; background-color: #fff; text-transform: uppercase; }</style></head><body>${header}${table}${footer}</body></html>`], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EZFW_REPORT_${dateVal}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadJPG() {
    const dateVal = document.getElementById('flightDate').value;
    const reportContainer = document.createElement('div');
    reportContainer.style.position = 'absolute';
    reportContainer.style.left = '-9999px';
    reportContainer.style.width = '1050px';
    reportContainer.style.padding = '45px'; 
    reportContainer.style.background = '#ffffff';
    reportContainer.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    reportContainer.style.textTransform = 'uppercase';

    reportContainer.innerHTML = getReportHeaderHTML();
    reportContainer.appendChild(getCleanTableClone());
    const footerDiv = document.createElement('div');
    footerDiv.innerHTML = getReportFooterHTML();
    reportContainer.appendChild(footerDiv);
    document.body.appendChild(reportContainer);

    html2canvas(reportContainer, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `EZFW_REPORT_${dateVal}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
        document.body.removeChild(reportContainer);
    });
}
