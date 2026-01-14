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
const PASSENGER_WEIGHT = 75;

const BOEING_MAX_EZFW = 62731;
const AIRBUS_MAX_EZFW = 173000;
const ATR_MAX_EZFW = 21000;

let history = [];
let isReportStarted = false;
let loadControllerName = '';
let editingRow = null;

function showForm() {
  const controllerNameInput = document.getElementById('controllerName').value.trim();
  if (controllerNameInput === "") {
    alert("PLEASE ENTER THE LOAD CONTROLLER NAME.");
    return;
  }
  loadControllerName = controllerNameInput.toUpperCase();

  document.getElementById('welcome').style.display = 'none';
  document.getElementById('form-page').style.display = 'block';
  document.getElementById('flightDate').valueAsDate = new Date();
}

function updateTotalBaggageWeight() {
  const from = document.getElementById('from').value;
  const dest = document.getElementById('destination').value;
  const pax = parseInt(document.getElementById('pax').value) || 0;
  const bagInput = document.getElementById('bag');
  let perPaxBagWeight = 0;

  // Logic 1: DAC <-> CGP (15 KG)
  if ((from === 'DAC' && dest === 'CGP') || (from === 'CGP' && dest === 'DAC')) {
    perPaxBagWeight = 15;
  } 
  // Logic 2: DAC <-> CXB (10 KG)
  else if ((from === 'DAC' && dest === 'CXB') || (from === 'CXB' && dest === 'DAC')) {
    perPaxBagWeight = 10;
  }
  // Logic 3: International & Other Domestic Incoming
  else if (dest === 'DAC' || dest === 'CGP' || dest === 'CXB') {
    perPaxBagWeight = baggageIn[from] || 0;
  } else {
    // International Outgoing
    perPaxBagWeight = baggageOut[dest] || 0;
  }
  
  bagInput.value = (pax * perPaxBagWeight).toFixed(0);
}

function calculateEZFW() {
  const pax = parseInt(document.getElementById('pax').value) || 0;
  const totalBagWeight = parseFloat(document.getElementById('bag').value) || 0;
  const cgo = parseFloat(document.getElementById('cgo').value) || 0;
  const acType = document.getElementById('acType').value;
  
  if(!acType) return 0;

  const totalPassengerWeight = pax * PASSENGER_WEIGHT;
  const aircraftBaseWeight = aircraftWeights[acType] || 0;
  const ezfw = totalPassengerWeight + totalBagWeight + cgo + aircraftBaseWeight;
  document.getElementById('ezfw').value = ezfw.toFixed(0);
  return ezfw;
}

// --- Sorts the table rows by Flight Number ---
function sortResultTable() {
    const tableBody = document.querySelector('#resultTable tbody');
    const rows = Array.from(tableBody.rows);

    rows.sort((a, b) => {
        // Extract number from "BS-321" string in Cell 2 (index 2)
        const fltA = parseInt(a.cells[2].textContent.replace(/\D/g, '')) || 0;
        const fltB = parseInt(b.cells[2].textContent.replace(/\D/g, '')) || 0;
        
        return fltA - fltB;
    });

    // Re-append rows in new order
    rows.forEach(row => tableBody.appendChild(row));
}

function addRow() {
  if (!isReportStarted) {
    const dateValue = document.getElementById('flightDate').value;
    if (!dateValue || !document.getElementById('time').value) {
      alert('PLEASE SELECT A SESSION AND DATE BEFORE ADDING A FLIGHT.');
      return;
    }
    document.getElementById('storeSession').textContent = document.getElementById('time').value;
    document.getElementById('storeDate').textContent = dateValue;
    
    document.getElementById('time').style.display = 'none';
    document.getElementById('flightDate').style.display = 'none';
    isReportStarted = true;
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
  let statusClass = "status-ok";
  let isLimitCrossed = false;

  if (acType === 'AIRBUS' && currentEZFW > AIRBUS_MAX_EZFW) isLimitCrossed = true;
  else if (acType === 'BOEING' && currentEZFW > BOEING_MAX_EZFW) isLimitCrossed = true;
  else if (acType === 'ATR' && currentEZFW > ATR_MAX_EZFW) isLimitCrossed = true;

  if (isLimitCrossed) {
      statusText = "LIMIT CROSSED";
      statusClass = "status-bad";
  }

  // --- UPDATE EXISTING ROW LOGIC ---
  if (editingRow) {
    editingRow.cells[1].textContent = acType;
    editingRow.cells[2].textContent = 'BS-' + fltNoInput;
    editingRow.cells[3].textContent = document.getElementById('from').value || '';
    editingRow.cells[4].textContent = document.getElementById('destination').value || '';
    editingRow.cells[5].textContent = document.getElementById('pax').value || 0;
    editingRow.cells[6].textContent = document.getElementById('bag').value || 0;
    editingRow.cells[7].textContent = document.getElementById('cgo').value || 0;
    
    const ezfwCell = editingRow.cells[8];
    ezfwCell.textContent = document.getElementById('ezfw').value;
    
    // Reset Style and apply new status
    ezfwCell.style.color = ''; 
    ezfwCell.style.fontWeight = '';
    if (isLimitCrossed) {
      ezfwCell.style.color = '#f44336';
      ezfwCell.style.fontWeight = 'bold';
    }

    const statusCell = editingRow.cells[9];
    statusCell.textContent = statusText;
    statusCell.className = statusClass;

    // Reset Edit Mode
    clearInputs();
    
    // Auto Sort after Edit
    sortResultTable();
    return; 
  }
  
  // --- CREATE NEW ROW LOGIC ---
  const tbody = document.querySelector('#resultTable tbody');
  const mainRow = tbody.insertRow();
  
  // 1. Edit Button
  const editCell = mainRow.insertCell();
  const editBtn = document.createElement('button');
  editBtn.textContent = 'EDIT';
  editBtn.className = 'edit-btn';
  editBtn.onclick = function() { editRow(this); };
  editCell.appendChild(editBtn);
  
  const rowData = {
    acType: acType,
    fltNo: 'BS-' + fltNoInput,
    origin: document.getElementById('from').value || '',
    dest: document.getElementById('destination').value || '',
    pax: document.getElementById('pax').value || 0,
    bag: document.getElementById('bag').value || 0,
    cgo: document.getElementById('cgo').value || 0,
    ezfw: document.getElementById('ezfw').value
  };

  // Insert Data Cells
  Object.values(rowData).forEach(text => {
    mainRow.insertCell().textContent = text;
  });

  const statusCell = mainRow.insertCell();
  statusCell.textContent = statusText;
  statusCell.className = statusClass;

  const actionCell = mainRow.insertCell();
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'DELETE';
  deleteBtn.className = 'delete-btn';
  deleteBtn.onclick = function() {
    deleteRow(this);
  };
  actionCell.appendChild(deleteBtn);

  const ezfwCell = mainRow.cells[8]; // Index adjusted for Edit Column
  if (isLimitCrossed) {
    ezfwCell.style.color = '#f44336';
    ezfwCell.style.fontWeight = 'bold';
  }

  history.push(1);
  clearInputs();
  document.getElementById('fltNo').focus();

  // Auto Sort after Add
  sortResultTable();
}

function editRow(btn) {
  const row = btn.parentNode.parentNode;
  editingRow = row;

  // Indices shifted by 1 due to Edit Column
  // 0: Edit, 1: AC, 2: Flt, 3: Origin, 4: Dest, 5: Pax, 6: Bag, 7: Cgo, 8: EZFW
  
  document.getElementById('acType').value = row.cells[1].textContent;
  
  const fullFltNo = row.cells[2].textContent;
  document.getElementById('fltNo').value = fullFltNo.replace('BS-', '');

  document.getElementById('from').value = row.cells[3].textContent;
  document.getElementById('destination').value = row.cells[4].textContent;
  document.getElementById('pax').value = row.cells[5].textContent;
  document.getElementById('bag').value = row.cells[6].textContent;
  document.getElementById('cgo').value = row.cells[7].textContent;
  document.getElementById('ezfw').value = row.cells[8].textContent;
  
  // Styling for selects
  document.getElementById('acType').className = 'has-value';
  document.getElementById('from').className = 'has-value';
  document.getElementById('destination').className = 'has-value';

  document.getElementById('addBtn').textContent = 'UPDATE';
}

function clearInputs() {
    document.getElementById('fltNo').value = '';
    document.getElementById('pax').value = '';
    document.getElementById('bag').value = '';
    document.getElementById('cgo').value = '';
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

function deleteRow(btn) {
    const row = btn.parentNode.parentNode;
    // If deleting the row currently being edited, cancel edit mode
    if (row === editingRow) {
        clearInputs();
    }
    row.parentNode.removeChild(row);
}

function goBack() {
  const tbody = document.querySelector('#resultTable tbody');
  if (tbody.rows.length > 0) {
      // If removing last row and it was being edited, reset edit mode
      if (tbody.rows[tbody.rows.length - 1] === editingRow) {
          clearInputs();
      }
      tbody.deleteRow(-1);
  }
}

function newReport() {
  isReportStarted = false;
  document.getElementById('time').style.display = 'block';
  document.getElementById('flightDate').style.display = 'block';
  document.querySelector('#resultTable tbody').innerHTML = '';
  history = [];
  
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
      select.selectedIndex = 0;
      select.className = '';
  });

  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
      if(input.id !== 'controllerName') {
          input.value = '';
      }
  });
  document.getElementById('flightDate').valueAsDate = new Date();
  
  // Reset Edit State
  editingRow = null;
  document.getElementById('addBtn').textContent = 'ADD';
}

// --- DOWNLOAD HTML (For PDF Printing) ---
function downloadTable() {
  const session = document.getElementById('storeSession').textContent || document.getElementById('time').value;
  const dateVal = document.getElementById('storeDate').textContent || document.getElementById('flightDate').value;
  
  const headerHTML = `
    <div class="report-header" style="text-align:center; margin-bottom: 20px;">
        <h1 style="margin:0; font-size: 24px;">US BANGLA AIRLINES</h1>
        <h3 style="margin:5px 0; font-size: 18px;">EZFW FOR ${session}</h3>
        <h3 style="margin:5px 0; font-size: 18px;">DATE: ${dateVal}</h3>
    </div>
  `;

  const originalTable = document.getElementById('resultTable');
  const tableClone = originalTable.cloneNode(true);
  
  // Remove "ACTION" (Last) and "EDIT" (First) columns
  tableClone.rows[0].deleteCell(-1); 
  tableClone.rows[0].deleteCell(0);

  for (let i = 1; i < tableClone.rows.length; i++) {
      tableClone.rows[i].deleteCell(-1);
      tableClone.rows[i].deleteCell(0);
  }

  // Highlight Arrival & Status
  const rows = tableClone.querySelectorAll('tbody tr');
  rows.forEach(row => {
      const fltCellText = row.cells[1].textContent;
      const fltNum = parseInt(fltCellText.replace(/\D/g, ''));
      const statusCell = row.cells[8];
      
      if (!isNaN(fltNum) && fltNum % 2 === 0) {
          row.style.backgroundColor = '#ADD8E6'; 
          row.style.color = '#000000';
      }

      if(statusCell.textContent.trim() === "LIMIT CROSSED") {
          statusCell.style.color = 'red';
          statusCell.style.fontWeight = 'bold';
      } else {
          statusCell.style.color = 'green';
          statusCell.style.fontWeight = 'bold';
      }
  });

  const tableHTML = tableClone.outerHTML;
  
  const blob = new Blob([`
    <html>
      <head>
        <title>EZFW REPORT</title>
        <style>
          body { font-family: sans-serif; padding: 20px; text-transform: uppercase; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
          th { background-color: #ddd; color: #000; font-weight: bold; }
          .footer-text { font-weight: bold; font-size: 12px; margin: 2px 0; }
        </style>
      </head>
      <body>
        ${headerHTML}
        ${tableHTML}
        <div style="margin-top: 40px; text-align: left;">
            <p class="footer-text">CALCULATED BY,</p>
            <p class="footer-text">${loadControllerName}</p>
            <p class="footer-text">LOAD CONTROL OFFICER</p>
        </div>
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
  URL.revokeObjectURL(url);
}

// --- DOWNLOAD JPG ---
function downloadJPG() {
    const session = document.getElementById('storeSession').textContent || document.getElementById('time').value;
    const dateVal = document.getElementById('storeDate').textContent || document.getElementById('flightDate').value;

    const reportContainer = document.createElement('div');
    reportContainer.style.position = 'absolute';
    reportContainer.style.left = '-9999px';
    reportContainer.style.top = '0';
    reportContainer.style.width = '800px';
    reportContainer.style.padding = '20px';
    reportContainer.style.background = '#fff';
    reportContainer.style.fontFamily = 'sans-serif';
    reportContainer.style.textTransform = 'uppercase';

    // Add Header
    reportContainer.innerHTML = `
        <div style="text-align:center; margin-bottom: 20px; color: #000;">
            <h1 style="margin:0; font-size: 24px;">US BANGLA AIRLINES</h1>
            <h3 style="margin:5px 0; font-size: 18px; font-weight: normal;">EZFW FOR ${session}</h3>
            <h3 style="margin:5px 0; font-size: 18px; font-weight: normal;">DATE: ${dateVal}</h3>
        </div>
    `;

    const originalTable = document.getElementById('resultTable');
    const tableClone = originalTable.cloneNode(true);
    
    // Remove Action Column (Last) and Edit Column (First)
    tableClone.rows[0].deleteCell(-1);
    tableClone.rows[0].deleteCell(0);

    for (let i = 1; i < tableClone.rows.length; i++) {
        tableClone.rows[i].deleteCell(-1);
        tableClone.rows[i].deleteCell(0);
    }

    tableClone.style.width = '100%';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.style.color = '#000';

    // Iterate rows for styling
    for(let i=0; i<tableClone.rows.length; i++) {
        const row = tableClone.rows[i];
        
        for(let j=0; j<row.cells.length; j++) {
            row.cells[j].style.border = '1px solid #000';
            row.cells[j].style.padding = '8px';
            row.cells[j].style.textAlign = 'center';
            row.cells[j].style.fontSize = '12px';
        }

        if(i===0) {
            row.style.backgroundColor = '#ddd';
            for(let j=0; j<row.cells.length; j++) {
               row.cells[j].style.fontWeight = 'bold';
            }
        } else {
            const fltCellText = row.cells[1].textContent;
            const fltNum = parseInt(fltCellText.replace(/\D/g, ''));
            
            if (!isNaN(fltNum) && fltNum % 2 === 0) {
                row.style.backgroundColor = '#ADD8E6';
            } else {
                row.style.backgroundColor = '#fff';
            }

            const statusCell = row.cells[8];
            if(statusCell.textContent.trim() === "LIMIT CROSSED") {
                 statusCell.style.color = 'red';
                 statusCell.style.fontWeight = 'bold';
            } else {
                 statusCell.style.color = 'green';
                 statusCell.style.fontWeight = 'bold';
            }
        }
    }
    reportContainer.appendChild(tableClone);

    // Add Footer
    const footer = document.createElement('div');
    footer.style.marginTop = '40px';
    footer.style.textAlign = 'left';
    footer.style.color = '#000';
    footer.innerHTML = `
        <p style="font-weight: bold; font-size: 12px; margin: 2px 0;">CALCULATED BY,</p>
        <p style="font-weight: bold; font-size: 12px; margin: 2px 0;">${loadControllerName}</p>
        <p style="font-weight: bold; font-size: 12px; margin: 2px 0;">LOAD CONTROL OFFICER</p>
    `;
    reportContainer.appendChild(footer);

    document.body.appendChild(reportContainer);

    // Generate JPG
    html2canvas(reportContainer, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `EZFW_REPORT_${dateVal}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
        document.body.removeChild(reportContainer);
    });
}