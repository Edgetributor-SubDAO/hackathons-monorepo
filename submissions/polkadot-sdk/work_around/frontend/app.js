// Python Smart Contract IDE - Frontend JavaScript

let editor;
let deploymentData = null;

// Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false
    });

    // Load main.py on startup
    loadFile();
});

// API Base URL
const API_BASE = 'http://localhost:5001/api';

// Load file from server
async function loadFile() {
    try {
        const response = await fetch(`${API_BASE}/read-file`);
        const data = await response.json();
        if (data.success) {
            editor.setValue(data.content || 'def add_numbers(a, b):\n    return a + b\n\ndef main():\n    print(add_numbers(1, 2))\n\nif __name__ == "__main__":\n    main()');
            addLog('File loaded successfully', 'success');
        }
    } catch (error) {
        addLog(`Error loading file: ${error.message}`, 'error');
    }
}

// Save file
async function saveFile() {
    const content = editor.getValue();
    try {
        const response = await fetch(`${API_BASE}/save-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        const data = await response.json();
        if (data.success) {
            addLog('File saved successfully', 'success');
        } else {
            addLog(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error saving file: ${error.message}`, 'error');
    }
}

// Get functions from main.py
async function getFunctions() {
    try {
        const response = await fetch(`${API_BASE}/get-functions`);
        const data = await response.json();
        if (data.success) {
            displayFunctions(data.functions);
            addLog(`Found ${data.functions.length} function(s)`, 'info');
        } else {
            addLog(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    }
}

// Display functions
function displayFunctions(functions) {
    const container = document.getElementById('functions-list');
    container.innerHTML = '';
    
    if (functions.length === 0) {
        container.innerHTML = '<p class="placeholder">No functions found</p>';
        return;
    }
    
    functions.forEach(func => {
        const div = document.createElement('div');
        div.className = 'function-item';
        div.innerHTML = `
            <h4>${func.name}</h4>
            <div class="args">Parameters: ${func.args.join(', ')}</div>
        `;
        container.appendChild(div);
    });
}

// Deploy contract
async function deployContract() {
    const privateKey = document.getElementById('private-key').value.trim();
    
    if (!privateKey) {
        addLog('Please enter your private key', 'error');
        return;
    }
    
    // Update status
    updateDeploymentStatus('deploying', 'Deploying contract...');
    
    try {
        const response = await fetch(`${API_BASE}/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ private_key: privateKey })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateDeploymentStatus('success', `Contract deployed at: ${data.contract_address}`);
            deploymentData = {
                address: data.contract_address,
                privateKey: privateKey
            };
            displayContractInfo(data.contract_address);
            loadInteractionPanel();
            addLog(`✅ Deployment successful! Address: ${data.contract_address}`, 'success');
        } else {
            updateDeploymentStatus('error', data.error);
            addLog(`❌ Deployment failed: ${data.error}`, 'error');
        }
    } catch (error) {
        updateDeploymentStatus('error', error.message);
        addLog(`❌ Error: ${error.message}`, 'error');
    }
}

// Update deployment status
function updateDeploymentStatus(status, message) {
    const statusBox = document.getElementById('deployment-status');
    statusBox.className = `status-box status-${status}`;
    statusBox.innerHTML = `<div>${message}</div>`;
}

// Display contract info
function displayContractInfo(address) {
    const contractInfo = document.getElementById('contract-info');
    const addressSpan = document.getElementById('contract-address');
    addressSpan.textContent = address;
    contractInfo.style.display = 'block';
}

// Load interaction panel
async function loadInteractionPanel() {
    try {
        const response = await fetch(`${API_BASE}/get-deployment`);
        const data = await response.json();
        
        if (data.success && data.functions) {
            displayInteractionPanel(data.functions);
        }
    } catch (error) {
        addLog(`Error loading interaction panel: ${error.message}`, 'error');
    }
}

// Display interaction panel - fully dynamic based on ABI
function displayInteractionPanel(functionsData) {
    const panel = document.getElementById('interaction-panel');
    panel.innerHTML = '';
    
    if (!functionsData || (!functionsData.state_changing && !functionsData.view)) {
        panel.innerHTML = '<p class="placeholder">No functions found in contract</p>';
        return;
    }
    
    // Display state-changing functions first
    if (functionsData.state_changing && functionsData.state_changing.length > 0) {
        const section = document.createElement('div');
        section.innerHTML = '<h4 style="color: #858585; margin-bottom: 10px; font-size: 12px;">State-Changing Functions</h4>';
        panel.appendChild(section);
        
        functionsData.state_changing.forEach(func => {
            const form = createFunctionForm(func, 'state_changing');
            panel.appendChild(form);
        });
    }
    
    // Display view functions
    if (functionsData.view && functionsData.view.length > 0) {
        const section = document.createElement('div');
        section.innerHTML = '<h4 style="color: #858585; margin-top: 20px; margin-bottom: 10px; font-size: 12px;">View Functions (Read-Only)</h4>';
        panel.appendChild(section);
        
        functionsData.view.forEach(func => {
            const form = createFunctionForm(func, 'view');
            panel.appendChild(form);
        });
    }
}

// Create function form dynamically
function createFunctionForm(func, type) {
    const form = document.createElement('div');
    form.className = 'interaction-form';
    
    const funcName = func.name;
    const inputs = func.inputs || [];
    const outputs = func.outputs || [];
    
    // Build parameter inputs
    let paramsHtml = '';
    if (inputs.length > 0) {
        paramsHtml = inputs.map((input, idx) => {
            const inputType = input.type || 'int256';
            const inputName = input.name || `param${idx}`;
            const inputTypeLabel = getInputTypeLabel(inputType);
            
            return `
                <div class="param-group">
                    <label>${inputName} (${inputTypeLabel}):</label>
                    <input 
                        type="${getInputType(inputType)}" 
                        id="param-${funcName}-${idx}" 
                        class="input-field" 
                        placeholder="Enter ${inputName}"
                        data-type="${inputType}"
                    >
                </div>
            `;
        }).join('');
    }
    
    // Build function signature display
    const paramNames = inputs.map(inp => `${inp.name || 'param'}: ${inp.type || 'int256'}`).join(', ');
    const returnType = outputs.length > 0 ? ` → ${outputs[0].type}` : '';
    
    // Create buttons based on function type
    let buttonsHtml = '';
    if (type === 'state_changing') {
        buttonsHtml = `
            <div class="interaction-buttons">
                <button class="btn-call" onclick="callStateChangingFunction('${funcName}', ${inputs.length})">
                    📤 Call (Send Transaction)
                </button>
            </div>
        `;
    } else {
        buttonsHtml = `
            <div class="interaction-buttons">
                <button class="btn-view" onclick="callViewFunction('${funcName}', ${inputs.length})">
                    👁️ View (Read)
                </button>
            </div>
        `;
    }
    
    form.innerHTML = `
        <h4>${funcName}(${paramNames})${returnType}</h4>
        ${paramsHtml}
        ${buttonsHtml}
        <div id="result-${funcName}" class="result-box" style="display: none;"></div>
    `;
    
    return form;
}

// Get input type for HTML input element
function getInputType(abiType) {
    if (abiType.includes('int') || abiType.includes('uint')) {
        return 'number';
    } else if (abiType.includes('bool')) {
        return 'text'; // Will handle as boolean
    } else {
        return 'text';
    }
}

// Get human-readable type label
function getInputTypeLabel(abiType) {
    if (abiType.includes('int256')) return 'int256';
    if (abiType.includes('uint256')) return 'uint256';
    if (abiType.includes('int128')) return 'int128';
    if (abiType.includes('uint128')) return 'uint128';
    if (abiType.includes('bool')) return 'bool';
    if (abiType.includes('address')) return 'address';
    if (abiType.includes('string')) return 'string';
    if (abiType.includes('bytes')) return 'bytes';
    return abiType;
}

// Call state-changing function
async function callStateChangingFunction(functionName, paramCount) {
    if (!deploymentData) {
        addLog('Please deploy contract first', 'error');
        return;
    }
    
    if (!deploymentData.privateKey) {
        const privateKey = prompt('Enter your private key to send transaction:');
        if (!privateKey) {
            addLog('Private key required for state-changing functions', 'error');
            return;
        }
        deploymentData.privateKey = privateKey;
    }
    
    // Get parameters and their types
    const params = [];
    const paramTypes = [];
    
    for (let i = 0; i < paramCount; i++) {
        const input = document.getElementById(`param-${functionName}-${i}`);
        if (input) {
            const value = input.value.trim();
            const type = input.getAttribute('data-type') || 'int256';
            
            if (!value) {
                addLog(`Parameter ${i} is required`, 'error');
                return;
            }
            
            params.push(value);
            paramTypes.push(type);
        }
    }
    
    addLog(`Calling ${functionName}(${params.join(', ')})...`, 'info');
    
    try {
        const response = await fetch(`${API_BASE}/call-function`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function_name: functionName,
                params: params,
                param_types: paramTypes,
                private_key: deploymentData.privateKey
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const resultBox = document.getElementById(`result-${functionName}`);
            resultBox.style.display = 'block';
            let resultText = `TX Hash: ${data.tx_hash}`;
            if (data.result !== null && data.result !== undefined) {
                resultText += ` | Result: ${data.result}`;
            }
            resultBox.textContent = resultText;
            addLog(`✅ ${functionName} called successfully. TX: ${data.tx_hash}`, 'success');
        } else {
            addLog(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        addLog(`❌ Error: ${error.message}`, 'error');
    }
}

// Call view function (read-only)
async function callViewFunction(functionName, paramCount = 0) {
    // Get parameters if function has them
    const params = [];
    const paramTypes = [];
    
    for (let i = 0; i < paramCount; i++) {
        const input = document.getElementById(`param-${functionName}-${i}`);
        if (input) {
            const value = input.value.trim();
            const type = input.getAttribute('data-type') || 'int256';
            
            if (value) {
                params.push(value);
                paramTypes.push(type);
            }
        }
    }
    
    addLog(`Reading ${functionName}${params.length > 0 ? `(${params.join(', ')})` : ''}...`, 'info');
    
    try {
        const response = await fetch(`${API_BASE}/view-function`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function_name: functionName,
                params: params,
                param_types: paramTypes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const resultBox = document.getElementById(`result-${functionName}`);
            resultBox.style.display = 'block';
            resultBox.textContent = `Result: ${JSON.stringify(data.result)}`;
            addLog(`✅ ${functionName}: ${JSON.stringify(data.result)}`, 'success');
        } else {
            addLog(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        addLog(`❌ Error: ${error.message}`, 'error');
    }
}

// Add log to terminal
function addLog(message, type = 'info') {
    const terminal = document.getElementById('terminal');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    terminal.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
}

// Clear logs
function clearLogs() {
    document.getElementById('terminal').innerHTML = '';
    addLog('Terminal cleared', 'info');
}

// Copy address
function copyAddress() {
    const address = document.getElementById('contract-address').textContent;
    navigator.clipboard.writeText(address).then(() => {
        addLog('Address copied to clipboard', 'success');
    });
}

// File upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.py')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            editor.setValue(e.target.result);
            saveFile();
            addLog(`File ${file.name} loaded`, 'success');
        };
        reader.readAsText(file);
    } else {
        addLog('Please upload a .py file', 'error');
    }
}

// Event Listeners
document.getElementById('save-btn').addEventListener('click', saveFile);
document.getElementById('get-functions-btn').addEventListener('click', getFunctions);
document.getElementById('deploy-btn').addEventListener('click', deployContract);
document.getElementById('upload-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
});
document.getElementById('file-input').addEventListener('change', handleFileUpload);
document.getElementById('clear-logs').addEventListener('click', clearLogs);
document.getElementById('copy-address').addEventListener('click', copyAddress);

// Make functions global for onclick handlers
window.callStateChangingFunction = callStateChangingFunction;
window.callViewFunction = callViewFunction;

// Check for existing deployment on load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE}/get-deployment`);
        const data = await response.json();
        if (data.success) {
            deploymentData = {
                address: data.contract_address,
                privateKey: '' // Will be asked when needed
            };
            displayContractInfo(data.contract_address);
            loadInteractionPanel();
            addLog('Found existing deployment', 'info');
        }
    } catch (error) {
        // No existing deployment
    }
});

