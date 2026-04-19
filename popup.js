document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & UI ELEMENTS ---
    let allPrompts = [];
    let fuse;
    let currentPromptForVariables = null; // Store prompt object for variable modal

    // Views
    const mainView = document.getElementById('mainView');
    const formView = document.getElementById('formView');
    const variableModal = document.getElementById('variableModal');

    // Buttons
    const newEntryBtn = document.getElementById('newEntryBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importInput = document.getElementById('importInput');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const copyBtn = document.getElementById('copyBtn');
    const cancelVariableBtn = document.getElementById('cancelVariableBtn');

    // Inputs & Lists
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');
    const promptsList = document.getElementById('promptsList');
    const formTitle = document.getElementById('formTitle');
    const promptIdInput = document.getElementById('promptId');
    const newTitleInput = document.getElementById('newTitle');
    const newPromptInput = document.getElementById('newPrompt');
    const newTagsInput = document.getElementById('newTags');
    const variableInputsContainer = document.getElementById('variableInputs');

    // --- INITIALIZATION ---
    initialize();

    async function initialize() {
        await loadAndRenderAll();
        checkForPendingPrompt(); // Check for prompt from context menu
    }

    // --- DATA & RENDERING ---
    async function loadAndRenderAll() {
        const data = await chrome.storage.local.get('prompts');
        allPrompts = data.prompts || [];
        initializeFuse(allPrompts);
        renderFilteredPrompts();
        populateTagFilter();
    }

    function renderFilteredPrompts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedTag = tagFilter.value;

        let filtered = allPrompts;

        // 1. Fuzzy Search (if search term exists)
        if (searchTerm) {
            filtered = fuse.search(searchTerm).map(result => result.item);
        }

        // 2. Tag Filter
        if (selectedTag) {
            filtered = filtered.filter(p => p.tags.includes(selectedTag));
        }

        renderPromptsList(filtered);
    }
    
    function renderPromptsList(prompts) {
        promptsList.innerHTML = '';
        if (prompts.length === 0) {
            promptsList.innerHTML = '<p style="text-align:center; color:#888;">No prompts found.</p>';
            return;
        }
        prompts.forEach(p => {
            const entry = document.createElement('div');
            entry.className = 'prompt-entry';
            entry.dataset.id = p.id;
            entry.innerHTML = `
                <div class="prompt-title">
                    ${p.title}
                    <div class="prompt-actions">
                        <span class="edit-btn" title="Edit">Edit</span>
                        <span class="delete-btn" title="Delete">Del</span>
                    </div>
                </div>
                <div class="prompt-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</div>
            `;
            promptsList.appendChild(entry);
        });
    }

    function populateTagFilter() {
        const allTags = new Set(allPrompts.flatMap(p => p.tags));
        const currentSelection = tagFilter.value;
        tagFilter.innerHTML = '<option value="">All Tags</option>';
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
        tagFilter.value = currentSelection;
    }

    // --- CRUD & DATA OPERATIONS ---
    async function saveData() {
        const id = promptIdInput.value;
        const promptData = {
            title: newTitleInput.value.trim(),
            prompt: newPromptInput.value.trim(),
            tags: newTagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
        };

        if (!promptData.title || !promptData.prompt) {
            alert('Title and prompt are required.');
            return;
        }

        if (id) { // Editing existing
            allPrompts = allPrompts.map(p => p.id === id ? { ...p, ...promptData } : p);
        } else { // Creating new
            promptData.id = `prompt_${Date.now()}`;
            allPrompts.push(promptData);
        }

        await chrome.storage.local.set({ prompts: allPrompts });
        switchView('main');
        await loadAndRenderAll();
    }
    
    async function deletePrompt(id) {
        if (!confirm('Are you sure you want to delete this prompt?')) return;
        allPrompts = allPrompts.filter(p => p.id !== id);
        await chrome.storage.local.set({ prompts: allPrompts });
        await loadAndRenderAll();
    }

    function editPrompt(id) {
        const prompt = allPrompts.find(p => p.id === id);
        if (!prompt) return;

        formTitle.textContent = 'Edit Prompt';
        promptIdInput.value = prompt.id;
        newTitleInput.value = prompt.title;
        newPromptInput.value = prompt.prompt;
        newTagsInput.value = prompt.tags.join(', ');
        switchView('form');
    }

    // --- FEATURE IMPLEMENTATIONS ---

    // Fuzzy Search
    function initializeFuse(prompts) {
        fuse = new Fuse(prompts, {
            keys: ['title', 'prompt', 'tags'],
            includeScore: true,
            threshold: 0.4
        });
    }

    // Import/Export
    function exportData() {
        if (allPrompts.length === 0) {
            alert('No prompts to export.');
            return;
        }
        const jsonString = JSON.stringify(allPrompts, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: `prompts_export_${new Date().toISOString().slice(0, 10)}.json`,
            saveAs: true
        });
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedPrompts = JSON.parse(e.target.result);
                if (Array.isArray(importedPrompts) && confirm('This will overwrite existing prompts. Continue?')) {
                    await chrome.storage.local.set({ prompts: importedPrompts });
                    await loadAndRenderAll();
                }
            } catch (err) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    }
    
    // Context Menu
    async function checkForPendingPrompt() {
        const { newPromptFromSelection } = await chrome.storage.local.get('newPromptFromSelection');
        if (newPromptFromSelection) {
            switchView('form');
            newPromptInput.value = newPromptFromSelection;
            await chrome.storage.local.remove('newPromptFromSelection');
        }
    }

    // Variables System
    function handlePromptClick(id) {
        const prompt = allPrompts.find(p => p.id === id);
        if (!prompt) return;

        const variables = prompt.prompt.match(/#(\w+)#/g);
        if (!variables) {
            navigator.clipboard.writeText(prompt.prompt);
            // You can add a small "Copied!" notification here
            alert('Prompt copied to clipboard!');
        } else {
            currentPromptForVariables = prompt;
            const uniqueVariables = [...new Set(variables)];
            variableInputsContainer.innerHTML = '';
            uniqueVariables.forEach(v => {
                const varName = v.slice(1, -1);
                const group = document.createElement('div');
                group.className = 'variable-group';
                group.innerHTML = `<label for="var-${varName}">${varName}</label><input type="text" id="var-${varName}" data-variable="${v}" placeholder="Enter value for ${varName}">`;
                variableInputsContainer.appendChild(group);
            });
            variableModal.classList.remove('hidden');
        }
    }
    
    function generateAndCopyVariablePrompt() {
        if (!currentPromptForVariables) return;
        let finalPrompt = currentPromptForVariables.prompt;
        const inputs = variableInputsContainer.querySelectorAll('input');
        inputs.forEach(input => {
            const variablePlaceholder = input.dataset.variable;
            const userValue = input.value;
            finalPrompt = finalPrompt.replace(new RegExp(variablePlaceholder, 'g'), userValue);
        });
        navigator.clipboard.writeText(finalPrompt);
        variableModal.classList.add('hidden');
        alert('Generated prompt copied to clipboard!');
    }


    // --- UI & EVENT LISTENERS ---
    function switchView(viewName) {
        mainView.classList.toggle('hidden', viewName !== 'main');
        formView.classList.toggle('hidden', viewName !== 'form');
        
        if (viewName === 'form') { // Reset form if opening for 'new'
            if (!promptIdInput.value) {
                formTitle.textContent = 'New Prompt';
                newTitleInput.value = '';
                newPromptInput.value = '';
                newTagsInput.value = '';
            }
        } else {
            promptIdInput.value = ''; // Clear ID when leaving form
        }
    }

    // Main view clicks
    newEntryBtn.addEventListener('click', () => switchView('form'));
    exportBtn.addEventListener('click', exportData);
    importInput.addEventListener('change', importData);
    searchInput.addEventListener('input', renderFilteredPrompts);
    tagFilter.addEventListener('change', renderFilteredPrompts);
    
    // Delegate clicks for prompt list
    promptsList.addEventListener('click', (e) => {
        const entry = e.target.closest('.prompt-entry');
        if (!entry) return;
        const id = entry.dataset.id;
        
        if (e.target.classList.contains('edit-btn')) {
            editPrompt(id);
        } else if (e.target.classList.contains('delete-btn')) {
            deletePrompt(id);
        } else {
            handlePromptClick(id); // Click on entry itself
        }
    });

    // Form view clicks
    saveBtn.addEventListener('click', saveData);
    cancelBtn.addEventListener('click', () => switchView('main'));
    
    // Modal clicks
    copyBtn.addEventListener('click', generateAndCopyVariablePrompt);
    cancelVariableBtn.addEventListener('click', () => variableModal.classList.add('hidden'));
});