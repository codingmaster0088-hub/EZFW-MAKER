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
    "ATR_GENERIC": { "2/2": 14015, "3/2": 14095, "2/0": 13865, "3/0": 13945 }
};

const MAX_ZFW = { "AIRBUS": 173000, "BOEING": 62731, "ATR": 21000 };
const baggageOut = { DXB: 18, SHJ: 19, AUH: 19, SIN: 18, CAN: 14, DOH: 18, JED: 19, BKK: 12, MLE: 13, KUL: 16, RUH: 19, MAA: 12, MCT: 20 };
const baggageIn = { MAA: 30, MLE: 35, BKK: 30, KUL: 35, SIN: 40, CAN: 40, DXB: 40, SHJ: 40, AUH: 40, DOH: 40, JED: 45, RUH: 45, MCT: 38 };

const ADULT_WEIGHT = 75;
const CHILD_WEIGHT = 35;
const INFANT_WEIGHT = 10;
const ULD_WEIGHT = 68;
const PMC_WEIGHT = 97;

let tableData =[]; 
let loadControllerName = '';
let currentMode = ''; 
let editingRow = null;

function showPopup(message) {
    const popup = document.getElementById('customPopup');
    const msg = document.getElementById('popupMessage');
    msg.innerText = message;
    popup.style.display = 'flex';
    setTimeout(() => { popup.style.display = 'none'; }, 2000);
}

window.onload = function() { checkLogin(); };

function checkLogin() {
    const savedName = localStorage.getItem('loadControllerName');
    if (savedName) {
        loadControllerName = savedName;
        document.getElementById('welcome').style.display = 'none';
        document.getElementById('selection-page').style.display = 'flex';
        document.getElementById('welcomeUser').innerText = loadControllerName;
        loadSavedData(); 
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
    currentMode = mode;
    document.getElementById('selection-page').style.display = 'none';
    document.getElementById('form-page').style.display = 'block';
    
    document.getElementById('displayControllerName').textContent = loadControllerName;
    document.getElementById('displayMode').textContent = `[${mode} MODE]`;
    
    setupInputsForMode();
    renderTableFromData(); 
}

function goToDash() {
    document.getElementById('form-page').style.display = 'none';
    document.getElementById('selection-page').style.display = 'flex';
    currentMode = '';
    clearInputs();
}

function logout() {
    showPopup("BYE BYE OFFICER");
    setTimeout(() => {
        localStorage.clear();
        location.reload();
    }, 2000);
}

function setupInputsForMode() {
    const regContainer = document.getElementById('acRegContainer');
    const crewContainer = document.getElementById('crewConfContainer');
    const paxBreakdowns = document.querySelectorAll('.pax-breakdown');
    const totalPaxInput = document.getElementById('totalPax');
    
    const thAdt = document.getElementById('th-adt');
    const thChd = document.getElementById('th-chd');
    const thInf = document.getElementById('th-inf');
    const thUld = document.getElementById('th-uld');
    const thPmc = document.getElementById('th-pmc');

    regContainer.innerHTML = '';
    
    if (currentMode === 'TRADITIONAL') {
        regContainer.innerHTML = `
            <select id="acReg" onchange="handleRegInput(); this.className='has-value'">
                <option value="" disabled selected>A/C REG</option>
                <option value="ATR">ATR</option>
                <option value="BOEING">BOEING</option>
                <option value="AIRBUS">AIRBUS</option>
            </select>
        `;
        crewContainer.style.display = 'none'; 
        paxBreakdowns.forEach(el => el.style.display = 'none'); 
        
        totalPaxInput.readOnly = false; 
        totalPaxInput.style.backgroundColor = '#fff';
        totalPaxInput.placeholder = "ENTER TOTAL PAX";
        totalPaxInput.oninput = function() { updateTotalBaggageWeight(); calculateEZFW(); };

        thAdt.textContent = "PAX";
        thChd.style.display = 'none';
        thInf.style.display = 'none';
        thUld.style.display = 'none';
        thPmc.style.display = 'none';
        
    } else {
        regContainer.innerHTML = `
          <input list="acRegList" type="text" id="acReg" placeholder="A/C REG (e.g. AJE)" oninput="handleRegInput()" onchange="this.className='has-value'">
          <datalist id="acRegList">
            <option value="S2-ALA"><option value="S2-ALB"><option value="S2-ALD">
            <option value="S2-AJE"><option value="S2-AJF"><option value="S2-AJG"><option value="S2-AJH">
            <option value="PK-BBG"><option value="PK-BBH">
            <option value="S2-AKA"><option value="S2-AKB"><option value="S2-AKC"><option value="S2-AKD"><option value="S2-AKE">
          </datalist>
        `;
        crewContainer.style.display = 'flex';
        paxBreakdowns.forEach(el => el.style.display = 'flex');
        
        totalPaxInput.readOnly = true;
        totalPaxInput.style.backgroundColor = '#e0e0e0';
        totalPaxInput.oninput = null; 

        thAdt.textContent = "ADT";
        thChd.style.display = '';
        thInf.style.display = '';
        thUld.style.display = '';
        thPmc.style.display = '';
    }
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
    if (currentMode === 'TRADITIONAL') {
        const val = document.getElementById('acReg').value;
        toggleAirbusInputs(val); 
        calculateEZFW(); 
        return;
    }

    let inputRaw = document.getElementById('acReg').value.toUpperCase();
    document.getElementById('acReg').value = inputRaw;
    
    let key = inputRaw;
    if(inputRaw.includes("-")) key = inputRaw.split("-")[1];

    const crewConfList = document.getElementById('crewConfList');
    crewConfList.innerHTML = ''; 
    
    let options = [];
    if (["ALA", "ALB", "ALD"].includes(key)) {
        options =["2/0", "2/9", "2/10", "2/11", "3/0", "3/9", "3/10", "3/11", "4/0", "4/9", "4/10", "4/11"];
    } else if (["AJE", "AJF", "AJG", "AJH", "BBG", "BBH"].includes(key)) {
        if(key.startsWith("BB")) options =["2/0", "2/4", "2/5", "3/0", "3/4", "3/5"];
        else options =["2/4", "2/5", "2/6", "3/4", "3/5", "3/6"];
    } else if (key.startsWith("AK")) {
        options =["2/2", "3/2", "2/0", "3/0"];
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
    
    if (currentMode === 'TRADITIONAL') {
        if (input === 'ATR' || input === 'BOEING' || input === 'AIRBUS') return input;
    }
    
    let key = input;
    if (input.includes("-")) key = input.split("-")[1];
    
    if (key.startsWith("AL")) return "AIRBUS";
    if (key.startsWith("AK")) return "ATR";
    if (key.startsWith("AJ") || key.startsWith("BB")) return "BOEING";
    
    return "BOEING"; 
}

function toggleAirbusInputs(regKey) {
    const reg = regKey || document.getElementById('acReg').value;
    const type = getAircraftType(reg);
    const airbusFields = document.querySelectorAll('.airbus-field');
    
    if (currentMode === 'ACTUAL' && type === 'AIRBUS') {
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

    if (currentMode === 'TRADITIONAL') {
        const acRegVal = document.getElementById('acReg').value.toUpperCase();
        let type = getAircraftType(acRegVal); 
        
        if(type === 'ATR') dow = 14015;
        else if(type === 'BOEING') dow = 43000;
        else if(type === 'AIRBUS') dow = 123500;
        
        const totalPax = parseInt(document.getElementById('totalPax').value) || 0;
        totalPassengerWeight = totalPax * 75;
        
    } else {
        let inputRaw = document.getElementById('acReg').value.toUpperCase();
        let key = inputRaw;
        if(inputRaw.includes("-")) key = inputRaw.split("-")[1];

        const crewConf = document.getElementById('crewConf').value;
        
        if (key.startsWith("AK")) dow = AIRCRAFT_DATABASE["ATR_GENERIC"][crewConf] || 0;
        else if (AIRCRAFT_DATABASE[key]) dow = AIRCRAFT_DATABASE[key][crewConf] || 0;

        const adult = parseInt(document.getElementById('adult').value) || 0;
        const child = parseInt(document.getElementById('child').value) || 0;
        const infant = parseInt(document.getElementById('infant').value) || 0;
        const uldCount = parseFloat(document.getElementById('uld').value) || 0;
        const pmcCount = parseFloat(document.getElementById('pmc').value) || 0;

        const type = getAircraftType(key);
        totalPassengerWeight = (adult * ADULT_WEIGHT) + (child * CHILD_WEIGHT) + (infant * INFANT_WEIGHT);
        
        if(type === 'AIRBUS') extraWeight = (uldCount * ULD_WEIGHT) + (pmcCount * PMC_WEIGHT);
    }

    const ezfw = totalPassengerWeight + totalBag + cgo + extraWeight + dow;
    document.getElementById('ezfw').value = ezfw > 0 ? ezfw.toFixed(0) : "";
}

function updatePaxAndCalc() {
    if(currentMode === 'TRADITIONAL') return; 
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
  
  let bagPayingPax = 0;
  if(currentMode === 'TRADITIONAL') {
      bagPayingPax = parseInt(document.getElementById('totalPax').value) || 0;
  } else {
      const adult = parseInt(document.getElementById('adult').value) || 0;
      const child = parseInt(document.getElementById('child').value) || 0;
      bagPayingPax = adult + child; 
  }

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
    const intlStations =["CCU", "SIN", "MLE", "BKK", "MCT", "CAN", "MAA", "DOH", "DXB", "AUH", "SHJ", "RUH", "JED", "KUL"];

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
            let[hh, mm] = timeStr.split(':').map(Number);
            if(isPM && hh < 12) hh += 12;
            if(!isPM && hh === 12) hh = 0;
            timeMins = hh * 60 + mm;
        }

        let reg = "";
        for(let i=0; i<parts.length; i++) {
            if(parts[i].startsWith("S2-") || parts[i].startsWith("PK-")) {
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

    let flightsToAdd =[];
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
        if(currentMode === "ACTUAL" && key) {
            if (type === "AIRBUS") crewConf = "2/10";
            else if (type === "BOEING") crewConf = "2/5";
            else if (type === "ATR") crewConf = "2/2";
        }

        let dow = 0;
        if(currentMode === "ACTUAL" && key) {
            if (key.startsWith("AK")) dow = AIRCRAFT_DATABASE["ATR_GENERIC"][crewConf] || 0;
            else if (AIRCRAFT_DATABASE[key]) dow = AIRCRAFT_DATABASE[key][crewConf] || 0;
        } else {
            if(type === 'ATR') dow = 14015;
            else if(type === 'BOEING') dow = 43000;
            else if(type === 'AIRBUS') dow = 123500;
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

        let maxZfw = MAX_ZFW[type] || 62731;
        let statusText = ezfw > maxZfw ? "LIMIT CROSSED" : "WITHIN LIMIT";

        const rowObject = {
            reg: currentMode === 'ACTUAL' ? (flt.reg || type) : type,
            regCode: currentMode === 'ACTUAL' ? (key || type) : type,
            crewConf: crewConf,
            fltNo: 'BS-' + flt.fltNo,
            origin: flt.origin,
            dest: flt.dest,
            adult: currentMode === 'ACTUAL' ? finalPax : 0,
            child: 0,
            infant: 0,
            totalPax: currentMode === 'TRADITIONAL' ? finalPax : 0,
            bag: bagWeight,
            cgo: 0,
            uld: '-',
            pmc: '-',
            ezfw: ezfw.toFixed(0),
            status: statusText,
            isLimitCrossed: ezfw > maxZfw,
            mode: currentMode
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

  const currentEZFW = document.getElementById('ezfw').value;
  let type = getAircraftType(regInput);
  
  const maxZfw = MAX_ZFW[type];
  let statusText = "WITHIN LIMIT";
  let isLimitCrossed = false;
  if (parseFloat(currentEZFW) > maxZfw) {
      isLimitCrossed = true;
      statusText = "LIMIT CROSSED";
  }

  let displayReg = regInput;
  if (currentMode === 'ACTUAL') {
      let key = regInput;
      if(regInput.includes("-")) key = regInput.split("-")[1];
      if(["BBG","BBH"].includes(key)) displayReg = "PK-" + key;
      else if(key.length === 3) displayReg = "S2-" + key;
  } else {
      displayReg = type; // Ensure "ATR", "BOEING", "AIRBUS" in traditional
  }

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
    ezfw: currentEZFW,
    status: statusText,
    isLimitCrossed: isLimitCrossed,
    mode: currentMode,
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
        
        if (currentMode === 'TRADITIONAL') {
            tr.insertCell().textContent = row.totalPax; 
        } else {
            tr.insertCell().textContent = row.adult;
            tr.insertCell().textContent = row.child;
            tr.insertCell().textContent = row.infant;
        }

        tr.insertCell().textContent = row.bag;
        tr.insertCell().textContent = row.cgo;
        
        if (currentMode === 'ACTUAL') {
            tr.insertCell().textContent = row.uld;
            tr.insertCell().textContent = row.pmc;
        }

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
  if(data.mode !== currentMode) selectMode(data.mode);

  const tr = document.querySelector('#resultTable tbody').rows[index];
  editingRow = tr;

  document.getElementById('acReg').value = data.regCode;
  
  if(currentMode === 'ACTUAL') {
      handleRegInput();
      document.getElementById('crewConf').value = data.crewConf;
  } else {
      toggleAirbusInputs(data.regCode); // Trigger visibility if needed
  }

  document.getElementById('fltNo').value = data.fltNo.replace('BS-', '');
  document.getElementById('from').value = data.origin;
  document.getElementById('destination').value = data.dest;
  
  if(currentMode === 'ACTUAL') {
      document.getElementById('adult').value = data.adult;
      document.getElementById('child').value = data.child;
      document.getElementById('infant').value = data.infant;
      updatePaxAndCalc();
      document.getElementById('uld').value = data.uld === '-' ? '' : data.uld;
      document.getElementById('pmc').value = data.pmc === '-' ? '' : data.pmc;
  } else {
      document.getElementById('totalPax').value = data.totalPax;
      updateTotalBaggageWeight(); 
      calculateEZFW();
  }

  document.getElementById('bag').value = data.bag;
  document.getElementById('cgo').value = data.cgo;
  
  document.getElementById('ezfw').value = data.ezfw; // Temporarily restore the exact saved value if custom edited, though oninput updates it.
  
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

function newReport() {
    if(confirm("START NEW REPORT? CURRENT TABLE DATA WILL BE CLEARED.")) {
        tableData =[];
        saveDataLocally();
        renderTableFromData();
        
        document.getElementById('acReg').value = '';
        document.getElementById('crewConf').value = '';
        if(currentMode === 'ACTUAL') {
             document.getElementById('crewConf').innerHTML = ''; 
        }
        clearInputs();
    }
}

function getReportHeaderHTML() {
    const session = document.getElementById('time').value || "SESSION";
    const dateVal = document.getElementById('flightDate').value || "DATE";
    return `
    <div class="report-header" style="text-align:center; margin-bottom: 25px; font-family: Arial, sans-serif; color: #000;">
        <h1 style="margin:0; font-size: 32px; font-weight: bold; text-transform: uppercase;">US BANGLA AIRLINES</h1>
        <h3 style="margin:5px 0; font-size: 20px; font-weight: normal; text-transform: uppercase;">EZFW FOR ${session}</h3>
        <h3 style="margin:5px 0; font-size: 20px; font-weight: normal; text-transform: uppercase;">DATE: ${dateVal}</h3>
    </div>`;
}

function getReportFooterHTML() {
    return `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; width: 100%; font-family: Arial, sans-serif;">
        <div style="background: yellow; color: black; padding: 12px; border: 1px solid #000; font-weight: bold; font-size: 14px; height: fit-content;">
            NOTE: PLEASE CROSS-CHECK WITH LOAD CONTROLLER FOR ACTUAL ZFW.
        </div>
        <div style="background: #87CEEB; color: black; padding: 20px; border: 1px solid #000; text-align: center; min-width: 220px;">
            <p style="margin: 0; font-size: 11px; font-weight: bold;">PREPARED BY</p>
            <h3 style="margin: 8px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">${loadControllerName}</h3>
            <p style="margin: 0; font-size: 11px; font-weight: bold;">LOAD CONTROL OFFICER</p>
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
    tableClone.style.color = '#000';
    tableClone.style.fontFamily = 'Arial, sans-serif';
    
    for(let i=0; i<tableClone.rows.length; i++) {
        const row = tableClone.rows[i];
        for(let j=0; j<row.cells.length; j++) {
            row.cells[j].style.border = '1px solid #000';
            row.cells[j].style.padding = '10px';
            row.cells[j].style.textAlign = 'center';
            row.cells[j].style.fontSize = '13px';
            if(i===0) {
                row.cells[j].style.fontWeight = 'bold';
                row.cells[j].style.backgroundColor = '#00bcd4'; 
                row.cells[j].style.color = '#fff';
            }
        }
        if(i > 0) {
            const fltCellText = row.cells[1].textContent;
            const fltNum = parseInt(fltCellText.replace(/\D/g, ''));
            if (!isNaN(fltNum)) {
                if (fltNum % 2 === 0) row.style.backgroundColor = '#ADD8E6'; 
                else row.style.backgroundColor = '#fff'; 
            } else {
                row.style.backgroundColor = '#fff';
            }
            const statCell = row.cells[row.cells.length - 1];
            if(statCell.textContent.includes("LIMIT CROSSED")) {
                statCell.style.color = 'red';
                statCell.style.fontWeight = 'bold';
            } else {
                statCell.style.color = 'green';
                statCell.style.fontWeight = 'bold';
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
  
  const blob = new Blob([`<html><head><title>EZFW REPORT</title><style>body { font-family: Arial, sans-serif; padding: 20px; text-transform: uppercase; }</style></head><body>${header}${table}${footer}</body></html>`], {type: 'text/html'});
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
    reportContainer.style.width = '1000px';
    reportContainer.style.padding = '40px'; 
    reportContainer.style.background = '#fff';
    reportContainer.style.fontFamily = 'Arial, sans-serif';
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