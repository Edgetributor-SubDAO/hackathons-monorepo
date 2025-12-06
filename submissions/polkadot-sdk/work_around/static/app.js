// Initialize CodeMirror editor
let editor;
let currentTab = 'contract';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror
    const textarea = document.getElementById('codeEditor');
    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        lineWrapping: true,
        autofocus: true
    });

    // Load initial code
    loadCode();
    
    // Set default code if empty after a short delay
    setTimeout(() => {
        if (!editor.getValue().trim()) {
            const defaultCode = `def multiplyy_numbers(a, b):
    return a * b

def main():
    print(multiplyy_numbers(1, 2))

if __name__ == "__main__":
    main()`;
            editor.setValue(defaultCode);
        }
    }, 500);
    
    // Load deployment info if available
    loadDeployment();
    
    // Auto-refresh contract info
    setInterval(() => {
        if (currentTab === 'contract') {
            loadContractInfo();
        }
    }, 10000); // Every 10 seconds
});

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`/api/${endpoint}`, options);
        const result = await response.json();
        return result;
    } catch (error) {
        addLog('error', `API Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Code Management
async function loadCode() {
    addLog('info', 'Loading code from main.py...');
    const result = await apiCall('load-code');
    if (result.success) {
        editor.setValue(result.code);
        addLog('success', 'Code loaded successfully');
    } else {
        addLog('error', `Failed to load code: ${result.error}`);
    }
}

async function saveCode() {
    const code = editor.getValue();
    addLog('info', 'Saving code to main.py...');
    const result = await apiCall('save-code', 'POST', { code });
    if (result.success) {
        addLog('success', 'Code saved successfully');
    } else {
        addLog('error', `Failed to save code: ${result.error}`);
    }
}

async function extractFunctions() {
    const code = editor.getValue();
    addLog('info', 'Extracting functions from code...');
    const result = await apiCall('extract-functions', 'POST', { code });
    if (result.success) {
        addLog('success', `Found ${result.functions.length} function(s)`);
        result.functions.forEach(func => {
            addLog('info', `  - ${func.name}(${func.args.join(', ')})`);
        });
    } else {
        addLog('error', `Failed to extract functions: ${result.error}`);
    }
}

// IPFS Upload
function uploadToIPFS() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

async function confirmUpload() {
    const code = editor.getValue();
    
    if (!code.trim()) {
        addLog('error', 'Cannot upload: Code is empty');
        closeUploadModal();
        return;
    }
    
    closeUploadModal();
    addLog('info', 'Starting IPFS upload...');
    addLog('info', '  - Compiling Python to WASM...');
    addLog('info', '  - Uploading to IPFS...');
    
    const result = await apiCall('deploy', 'POST', { code });
    
    if (result.success) {
        addLog('success', '✅ Upload successful!');
        addLog('info', `  IPFS Hash: ${result.ipfs_hash}`);
        addLog('info', `  WASM File: ${result.wasm_file}`);
        if (result.functions && result.functions.length > 0) {
            addLog('info', `  Functions: ${result.functions.join(', ')}`);
        }
        
        // Update UI
        document.getElementById('ipfsHash').innerHTML = 
            `<span>${result.ipfs_hash}</span>`;
        document.getElementById('wasmFile').textContent = result.wasm_file;
        
        // Load functions
        setTimeout(() => {
            loadFunctions();
            loadContractInfo();
        }, 1000);
    } else {
        addLog('error', `❌ Upload failed: ${result.error}`);
    }
}

// Contract Info
async function loadDeployment() {
    const result = await apiCall('load-deployment');
    if (result.success) {
        const dep = result.deployment;
        if (dep.ipfs_hash) {
            document.getElementById('ipfsHash').innerHTML = 
                `<span>${dep.ipfs_hash}</span>`;
            loadFunctions();
            loadContractInfo();
        }
    }
}

async function loadContractInfo() {
    const result = await apiCall('contract-info');
    if (result.success) {
        if (result.ipfs_hash) {
            document.getElementById('ipfsHash').innerHTML = 
                `<span>${result.ipfs_hash}</span>`;
        }
        if (result.wasm_file) {
            document.getElementById('wasmFile').textContent = result.wasm_file;
        }
        if (result.deployment_type) {
            document.getElementById('deploymentType').textContent = 
                result.deployment_type === 'ipfs-only' ? 'IPFS Only' : result.deployment_type;
        }
    } else if (result.error && !result.error.includes('No deployment')) {
        addLog('warning', `Failed to load info: ${result.error}`);
    }
}

// Functions
async function loadFunctions() {
    const result = await apiCall('get-functions');
    const functionsList = document.getElementById('functionsList');
    const functionSelect = document.getElementById('functionSelect');
    
    if (result.success && result.functions.length > 0) {
        functionsList.innerHTML = '';
        functionSelect.innerHTML = '<option value="">Select a function...</option>';
        
        result.functions.forEach(funcName => {
            // Add to functions list
            const funcItem = document.createElement('div');
            funcItem.className = 'function-item';
            funcItem.innerHTML = `
                <div class="function-name">${funcName}</div>
                <div class="function-args">Click to execute</div>
            `;
            funcItem.onclick = () => {
                switchTab('execute');
                functionSelect.value = funcName;
            };
            functionsList.appendChild(funcItem);
            
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = funcName;
            option.textContent = funcName;
            functionSelect.appendChild(option);
        });
    } else {
        functionsList.innerHTML = '<div class="empty-state">No functions found. Deploy first.</div>';
        functionSelect.innerHTML = '<option value="">No functions available</option>';
    }
}

// Execution
async function executeFunction() {
    const functionName = document.getElementById('functionSelect').value;
    const argsInput = document.getElementById('functionArgs').value.trim();
    const resultBox = document.getElementById('executeResult');
    
    if (!functionName) {
        resultBox.className = 'result-box error';
        resultBox.textContent = 'Please select a function';
        resultBox.style.display = 'block';
        return;
    }
    
    // Parse arguments
    let args = [];
    if (argsInput) {
        args = argsInput.split(',').map(arg => {
            const trimmed = arg.trim();
            // Try to parse as number, otherwise keep as string
            const num = Number(trimmed);
            return isNaN(num) ? trimmed : num;
        });
    }
    
    addLog('info', `Executing ${functionName}(${args.join(', ')})...`);
    resultBox.style.display = 'none';
    
    const result = await apiCall('execute', 'POST', {
        function_name: functionName,
        args: args
    });
    
    if (result.success) {
        resultBox.className = 'result-box success';
        resultBox.textContent = `Result: ${JSON.stringify(result.result)}`;
        resultBox.style.display = 'block';
        addLog('success', `✅ ${functionName}(${args.join(', ')}) = ${result.result}`);
    } else {
        resultBox.className = 'result-box error';
        resultBox.textContent = `Error: ${result.error}`;
        resultBox.style.display = 'block';
        addLog('error', `❌ Execution failed: ${result.error}`);
    }
}

// Tabs
function switchTab(tabName, clickedElement) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        // Find the tab button by text content
        document.querySelectorAll('.tab').forEach(tab => {
            if (tab.textContent.includes(tabName === 'contract' ? 'Contract' : 
                                         tabName === 'execute' ? 'Execute' : 'Logs')) {
                tab.classList.add('active');
            }
        });
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load data if needed
    if (tabName === 'contract') {
        loadContractInfo();
        loadFunctions();
    }
}

// Logs
function addLog(type, message) {
    const logs = document.getElementById('logs');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    logEntry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-message">${message}</span>
    `;
    
    logs.appendChild(logEntry);
    logs.scrollTop = logs.scrollHeight;
}

function clearLogs() {
    const logs = document.getElementById('logs');
    logs.innerHTML = '';
    addLog('info', 'Logs cleared');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCode();
    }
    
    // Ctrl/Cmd + Enter to upload
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        uploadToIPFS();
    }
});

// Allow Enter key in function args to execute
document.getElementById('functionArgs').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        executeFunction();
    }
});

