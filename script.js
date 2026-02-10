const aircraftWeights = {
  "BOEING": 43215, 
  "AIRBUS": 123500,
  "ATR": 13999
};

const baggageOut = {
  DXB: 18, SHJ: 19, AUH: 19, SIN: 18, CAN: 14, DOH: 18, JED: 19,
  BKK: 12, MLE: 13, KUL: 16, RUH: 19, MAA: 12, MCT: 20
};
const baggageIn = {
  MAA: 30, MLE: 35, BKK: 30, KUL: 35, SIN: 40, CAN: 40, DXB: 40, SHJ: 40,
  AUH: 40, DOH: 40, JED: 45, RUH: 45, MCT: 38
};

const ADULT_WEIGHT = 75;
const CHILD_WEIGHT = 35;
const INFANT_WEIGHT = 10;
const ULD_WEIGHT = 68;
const PMC_WEIGHT = 97;

const BOEING_MAX_EZFW = 62731;
const AIRBUS_MAX_EZFW = 173000;
const ATR_MAX_EZFW = 21000;

let tableData = []; 
let loadControllerName = '';
let editingRow = null;

// --- INITIALIZATION & LOGIC / LOGOUT ---

window.onload = function() {
    checkLogin();
};

function checkLogin() {
    const savedName = localStorage.getItem('loadControllerName');
    if (savedName) {
        loadControllerName = savedName;
        document.getElementById('welcome').style.display = 'none';
        document.getElementById('form-page').style.display = 'block';
        document.getElementById('displayControllerName').textContent = loadControllerName;
        
        loadSavedData(); 
    } else {
        document.getElementById('welcome').style.display = 'flex';
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
  
  checkLogin();
}

function logout() {
    if(confirm("ARE YOU SURE YOU WANT TO LOG OUT? ALL DATA WILL BE CLEARED.")) {
        localStorage.clear();
        location.reload();
    }
}

// --- DATA PERSISTENCE ---

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
        renderTableFromData();
    }
}

// --- APP LOGIC ---

function toggleAirbusInputs() {
    const acType = document.getElementById('acType').value;
    const airbusFields = document.querySelectorAll('.airbus-field');
    
    if (acType === 'AIRBUS') {
        airbusFields.forEach(field => field.style.display = 'flex');
    } else {
        airbusFields.forEach(field => {
            field.style.display = 'none';
        });
        document.getElementById('uld').value = '';
        document.getElementById('pmc').value = '';
    }
    calculateEZFW();
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
  const bagPayingPax = adult + child; 

  const bagInput = document.getElementById('bag');
  let perPaxBagWeight = 0;

  if (from === 'CAN' && (dest === 'DAC' || dest === 'CGP')) {
      perPaxBagWeight = 31;
  }
  else if ((from === 'DAC' && dest === 'CGP') || (from === 'CGP' && dest === 'DAC')) {
    perPaxBagWeight = 15;
  } 
  else if ((from === 'DAC' && dest === 'CXB') || (from === 'CXB' && dest === 'DAC')) {
    perPaxBagWeight = 10;
  }
  else if (dest === 'DAC' || dest === 'CGP' || dest === 'CXB') {
    perPaxBagWeight = baggageIn[from] || 0;
  } else {
    perPaxBagWeight = baggageOut[dest] || 0;
  }
  
  bagInput.value = (bagPayingPax * perPaxBagWeight).toFixed(0);
}

function calculateEZFW() {
  const adult = parseInt(document.getElementById('adult').value) || 0;
  const child = parseInt(document.getElementById('child').value) || 0;
  const infant = parseInt(document.getElementById('infant').value) || 0;
  
  const totalBagWeight = parseFloat(document.getElementById('bag').value) || 0;
  const cgo = parseFloat(document.getElementById('cgo').value) || 0;
  
  const uldCount = parseFloat(document.getElementById('uld').value) || 0;
  const pmcCount = parseFloat(document.getElementById('pmc').value) || 0;

  const acType = document.getElementById('acType').value;
  
  if(!acType) return 0;

  const totalPassengerWeight = (adult * ADULT_WEIGHT) + (child * CHILD_WEIGHT) + (infant * INFANT_WEIGHT);
  const aircraftBaseWeight = aircraftWeights[acType] || 0;
  
  let extraWeight = 0;
  if(acType === 'AIRBUS') {
      extraWeight = (uldCount * ULD_WEIGHT) + (pmcCount * PMC_WEIGHT);
  }

  const ezfw = totalPassengerWeight + totalBagWeight + cgo + extraWeight + aircraftBaseWeight;
  document.getElementById('ezfw').value = ezfw.toFixed(0);
  return ezfw;
}

function addRow() {
  const dateValue = document.getElementById('flightDate').value;
  const sessionValue = document.getElementById('time').value;

  if (!dateValue || !sessionValue) {
      alert('PLEASE SELECT A SESSION AND DATE BEFORE ADDING A FLIGHT.');
      return;
  }

  const currentEZFW = calculateEZFW();
  const acType = document.getElementById('acType').value;
  const fltNoInput = document.getElementById('fltNo').value;
  
  if(!acType || !fltNoInput) {
     alert('PLEASE FILL A/C TYPE AND FLIGHT NUMBER');
     return;
  }

  // Determine Status
  let statusText = "WITHIN LIMIT";
  let isLimitCrossed = false;

  if (acType === 'AIRBUS' && currentEZFW > AIRBUS_MAX_EZFW) isLimitCrossed = true;
  else if (acType === 'BOEING' && currentEZFW > BOEING_MAX_EZFW) isLimitCrossed = true;
  else if (acType === 'ATR' && currentEZFW > ATR_MAX_EZFW) isLimitCrossed = true;

  if (isLimitCrossed) {
      statusText = "LIMIT CROSSED";
  }

  const rowObject = {
    acType: acType,
    fltNo: 'BS-' + fltNoInput,
    origin: document.getElementById('from').value || '',
    dest: document.getElementById('destination').value || '',
    adult: document.getElementById('adult').value || 0,
    child: document.getElementById('child').value || 0,
    infant: document.getElementById('infant').value || 0,
    bag: document.getElementById('bag').value || 0,
    cgo: document.getElementById('cgo').value || 0,
    uld: (acType === 'AIRBUS') ? (document.getElementById('uld').value || 0) : '-',
    pmc: (acType === 'AIRBUS') ? (document.getElementById('pmc').value || 0) : '-',
    ezfw: document.getElementById('ezfw').value,
    status: statusText,
    isLimitCrossed: isLimitCrossed
  };

  if (editingRow) {
      // Update existing
      const index = editingRow.rowIndex - 1; // Adjust for header
      tableData[index] = rowObject;
      editingRow = null;
      document.getElementById('addBtn').textContent = 'ADD';
  } else {
      // Add new
      tableData.push(rowObject);
  }

  // Sort Data by Flight Number
  tableData.sort((a, b) => {
      const fltA = parseInt(a.fltNo.replace(/\D/g, '')) || 0;
      const fltB = parseInt(b.fltNo.replace(/\D/g, '')) || 0;
      return fltA - fltB;
  });

  saveDataLocally();
  renderTableFromData();
  clearInputs();
  document.getElementById('fltNo').focus();
}

function renderTableFromData() {
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = '';

    tableData.forEach((row, index) => {
        const tr = tbody.insertRow();
        
        // Edit Button
        const editCell = tr.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = 'EDIT';
        editBtn.className = 'edit-btn';
        editBtn.onclick = function() { editRow(index); };
        editCell.appendChild(editBtn);

        // Data Cells
        tr.insertCell().textContent = row.acType;
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

        // Delete Button
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

  document.getElementById('acType').value = data.acType;
  toggleAirbusInputs(); 

  document.getElementById('fltNo').value = data.fltNo.replace('BS-', '');
  document.getElementById('from').value = data.origin;
  document.getElementById('destination').value = data.dest;
  
  document.getElementById('adult').value = data.adult;
  document.getElementById('child').value = data.child;
  document.getElementById('infant').value = data.infant;
  updatePaxAndCalc(); 

  document.getElementById('bag').value = data.bag;
  document.getElementById('cgo').value = data.cgo;

  if (data.acType === 'AIRBUS') {
      document.getElementById('uld').value = data.uld;
      document.getElementById('pmc').value = data.pmc;
  }

  document.getElementById('ezfw').value = data.ezfw;
  
  document.getElementById('acType').className = 'has-value';
  document.getElementById('from').className = 'has-value';
  document.getElementById('destination').className = 'has-value';

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

function goBack() {
    if(tableData.length > 0) {
        tableData.pop();
        saveDataLocally();
        renderTableFromData();
    }
}

function newReport() {
    if(confirm("START NEW REPORT? CURRENT TABLE DATA WILL BE CLEARED.")) {
        tableData = [];
        saveDataLocally();
        renderTableFromData();
        clearInputs();
    }
}

// --- REPORT GENERATION HELPERS (ATTACHMENT 2 STYLE) ---

function getReportHeaderHTML() {
    const session = document.getElementById('time').value || "SESSION";
    const dateVal = document.getElementById('flightDate').value || "DATE";
    // Increased Font Sizes for Visibility
    return `
    <div class="report-header" style="text-align:center; margin-bottom: 25px; font-family: Arial, sans-serif; color: #000;">
        <h1 style="margin:0; font-size: 32px; font-weight: bold; text-transform: uppercase;">US BANGLA AIRLINES</h1>
        <h3 style="margin:5px 0; font-size: 20px; font-weight: normal; text-transform: uppercase;">EZFW FOR ${session}</h3>
        <h3 style="margin:5px 0; font-size: 20px; font-weight: normal; text-transform: uppercase;">DATE: ${dateVal}</h3>
    </div>`;
}

function getReportFooterHTML() {
    // Left Warning, Right Signature (Attachment 1 style)
    return `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; width: 100%; font-family: Arial, sans-serif;">
        
        <!-- Left Side: Warning -->
        <div style="background: yellow; color: black; padding: 12px; border: 1px solid #000; font-weight: bold; font-size: 14px; height: fit-content;">
            NOTE: PLEASE CROSS-CHECK WITH LOAD CONTROLLER FOR ACTUAL ZFW.
        </div>

        <!-- Right Side: Signature -->
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
    
    // Remove Action (Last) and Edit (First)
    tableClone.rows[0].deleteCell(-1); 
    tableClone.rows[0].deleteCell(0);

    for (let i = 1; i < tableClone.rows.length; i++) {
        tableClone.rows[i].deleteCell(-1);
        tableClone.rows[i].deleteCell(0);
    }
    
    // Styling matching Attachment 2 (Arial, Black Text)
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
            
            // Header Styling (Cyan Background)
            if(i===0) {
                row.cells[j].style.fontWeight = 'bold';
                row.cells[j].style.backgroundColor = '#00bcd4'; // Cyan
                row.cells[j].style.color = '#fff';
            }
        }

        // Logic Change: Background based on Flight Number (Odd/Even)
        if(i > 0) {
            const fltCellText = row.cells[1].textContent;
            const fltNum = parseInt(fltCellText.replace(/\D/g, ''));
            
            if (!isNaN(fltNum)) {
                if (fltNum % 2 === 0) {
                     // Arrival / Even -> Skyblue
                     row.style.backgroundColor = '#ADD8E6'; 
                } else {
                     // Departure / Odd -> White
                     row.style.backgroundColor = '#fff'; 
                }
            } else {
                // Fallback to white if no flight number found
                row.style.backgroundColor = '#fff';
            }
            
            // Status Color
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

// --- DOWNLOAD HTML ---
function downloadTable() {
  const dateVal = document.getElementById('flightDate').value;
  const header = getReportHeaderHTML();
  const footer = getReportFooterHTML();
  const table = getCleanTableClone().outerHTML;
  
  const blob = new Blob([`
    <html>
      <head>
        <title>EZFW REPORT</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        ${header}
        ${table}
        ${footer}
      </body>
    </html>
  `], {type: 'text/html'});
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EZFW_REPORT_${dateVal}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- DOWNLOAD JPG ---
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
    
    // Add Footer to container
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