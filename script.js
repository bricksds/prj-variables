class FigmaVariablesUI {
    constructor() {
        this.apiData = null;
        this.filteredData = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromLocalStorage();
    }

    bindEvents() {
        // Fetch button
        document.getElementById('fetchVariables').addEventListener('click', () => {
            this.fetchVariables();
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.fetchVariables();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearchInput(e);
        });

        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            this.clearSearch();
        });

        document.getElementById('typeFilter').addEventListener('change', () => {
            this.filterData();
        });

        document.getElementById('locationFilter').addEventListener('change', () => {
            this.filterData();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterData();
        });

        // Export buttons
        document.getElementById('exportCssBtn').addEventListener('click', () => {
            this.exportCSS();
        });

        document.getElementById('exportScssBtn').addEventListener('click', () => {
            this.exportSCSS();
        });

        document.getElementById('exportXmlBtn').addEventListener('click', () => {
            this.exportXML();
        });





        // Enter key on inputs
        ['figmaToken', 'fileKey'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.fetchVariables();
                }
            });
        });
    }

    loadFromLocalStorage() {
        const token = localStorage.getItem('figmaToken');
        const fileKey = localStorage.getItem('figmaFileKey');
        
        if (token) {
            document.getElementById('figmaToken').value = token;
        }
        if (fileKey) {
            document.getElementById('fileKey').value = fileKey;
        }
    }

    saveToLocalStorage() {
        const token = document.getElementById('figmaToken').value;
        const fileKey = document.getElementById('fileKey').value;
        
        if (token) localStorage.setItem('figmaToken', token);
        if (fileKey) localStorage.setItem('figmaFileKey', fileKey);
    }

    async fetchVariables() {
        console.log('🚀 fetchVariables called');
        
        const token = document.getElementById('figmaToken').value.trim();
        const fileKey = document.getElementById('fileKey').value.trim();

        console.log('📝 Token length:', token.length);
        console.log('📝 FileKey:', fileKey);

        if (!token || !fileKey) {
            console.error('❌ Missing token or fileKey');
            this.showError('Please provide both Figma access token and file key.');
            return;
        }

        this.saveToLocalStorage();
        this.showLoading();
        console.log('⏳ Loading state shown');

        try {
            console.log('🌐 Starting API call...');
            const url = `https://api.figma.com/v1/files/${fileKey}/variables/local`;
            console.log('🔗 URL:', url);
            
            // Try direct API call first
            let response;
            try {
                console.log('📡 Attempting direct API call...');
                response = await fetch(url, {
                    headers: {
                        'X-FIGMA-TOKEN': token
                    }
                });
                console.log('✅ Direct API call successful, status:', response.status);
            } catch (corsError) {
                console.warn('⚠️ CORS error, trying proxy:', corsError.message);
                // If CORS error, try using local proxy
                response = await fetch('/api/figma-proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fileKey: fileKey,
                        token: token
                    })
                });
                console.log('✅ Proxy call successful, status:', response.status);
            }

            if (!response.ok) {
                console.error('❌ Response not OK:', response.status);
                const errorText = await response.text();
                console.error('❌ Error text:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }
                throw new Error(`HTTP ${response.status}: ${errorData.message || errorText}`);
            }

            console.log('📦 Parsing JSON response...');
            const data = await response.json();
            console.log('✅ Data received:', data);
            
            this.apiData = data;
            this.filteredData = data;
            
            console.log('🎯 Calling displayResults...');
            this.hideLoading();
            this.hideError();
            this.displayResults();

        } catch (error) {
            console.error('💥 Fetch error:', error);
            this.hideLoading();
            this.showError(this.getErrorMessage(error));
        }
    }

    getErrorMessage(error) {
        const message = error.message;
        
        if (message.includes('401')) {
            return 'Authentication failed. Please check your Figma access token.';
        } else if (message.includes('403')) {
            return 'Access denied. Make sure you have permission to access this file.';
        } else if (message.includes('404')) {
            return 'File not found. Please check your file key.';
        } else if (message.includes('CORS')) {
            return 'CORS error. You may need to use a proxy or run this from a server.';
        } else {
            return `Error: ${message}`;
        }
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').classList.remove('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
    }

    hideError() {
        document.getElementById('errorState').classList.add('hidden');
    }

    displayResults() {
        console.log('🎯 displayResults called');
        console.log('📊 apiData:', this.apiData);
        
        if (!this.apiData || !this.apiData.meta) {
            console.error('❌ Invalid API response format');
            this.showError('Invalid API response format.');
            return;
        }

        console.log('📈 Updating stats...');
        this.updateStats();
        
        console.log('🏗️ Rendering collections...');
        this.renderCollections();
        
        console.log('🎨 Rendering tokens by type...');
        this.renderTokensByType();
        
        console.log('👁️ Showing results section...');
        document.getElementById('resultsSection').classList.remove('hidden');
        
        console.log('✅ displayResults completed');
    }

    updateStats() {
        const collections = this.filteredData?.meta?.variableCollections || {};
        const variables = this.filteredData?.meta?.variables || {};
        
        // Count only local collections and variables
        const localCollections = Object.values(collections).filter(c => !c.remote);
        const localVariables = Object.values(variables).filter(v => {
            if (v.remote) return false;
            const collection = collections[v.variableCollectionId];
            return collection && !collection.remote;
        });

        document.getElementById('collectionsCount').textContent = localCollections.length;
        document.getElementById('variablesCount').textContent = localVariables.length;
        document.getElementById('remoteCount').textContent = 0;
        document.getElementById('localCount').textContent = localVariables.length;
    }

    renderCollections() {
        const collectionsContainer = document.getElementById('collectionsContainer');
        if (!this.filteredData || !this.filteredData.meta || !this.filteredData.meta.variableCollections) {
            collectionsContainer.innerHTML = '<div class="empty-state">No collections found</div>';
            return;
        }

        // Filter to show only local collections
        const collections = Object.values(this.filteredData.meta.variableCollections)
            .filter(collection => !collection.remote);
        
        if (collections.length === 0) {
            collectionsContainer.innerHTML = '<div class="empty-state">No local collections found</div>';
            return;
        }

        collectionsContainer.innerHTML = collections.map(collection => `
            <div class="collection-card">
                <div class="collection-header">
                    <h3>${this.escapeHtml(collection.name)}</h3>
                    <span class="collection-badge local">
                        Local
                    </span>
                </div>
                <div class="collection-info">
                    <p><strong>ID:</strong> ${collection.id}</p>
                    <p><strong>Modes:</strong> ${collection.modes ? collection.modes.length : 0}</p>
                    ${collection.modes ? `
                        <div class="modes-list">
                            ${collection.modes.map(mode => `
                                <span class="mode-badge">${this.escapeHtml(mode.name)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderVariables() {
        const container = document.getElementById('variablesContainer');
        const variables = this.filteredData?.meta?.variables || {};
        
        // Filter to show only local variables from local collections
        const localVariables = Object.values(variables).filter(variable => {
            if (variable.remote) return false;
            const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
            return collection && !collection.remote;
        });
        
        if (localVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No local variables found.</div>';
            return;
        }
        
        container.innerHTML = localVariables.map(variable => {
            const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
            const collectionName = collection ? collection.name : 'Unknown Collection';
            
            return `
                <div class="variable-card">
                    <div class="variable-header">
                        <h4>${this.escapeHtml(variable.name)}</h4>
                        <div class="variable-badges">
                            <span class="type-badge ${variable.resolvedType.toLowerCase()}">${variable.resolvedType}</span>
                            <span class="location-badge local">
                                Local
                            </span>
                        </div>
                    </div>
                    <div class="variable-info">
                        <p><strong>Collection:</strong> ${this.escapeHtml(collectionName)}</p>
                        <p><strong>ID:</strong> ${variable.id}</p>
                        ${variable.description ? `<p><strong>Description:</strong> ${this.escapeHtml(variable.description)}</p>` : ''}
                        ${variable.scopes ? `<p><strong>Scopes:</strong> ${variable.scopes.join(', ')}</p>` : ''}
                        
                        ${variable.valuesByMode ? this.renderValuesByMode(variable) : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTokensByType() {
        this.renderColorTokens();
        this.renderFontTokens();
        this.renderSpacingTokens();
        this.renderBorderTokens();
        this.renderSizeTokens();
        this.renderOpacityTokens();
    }

    renderColorTokens() {
        const container = document.getElementById('colorContainer');
        const { localVariables } = this.getLocalVariables();
        
        const colorVariables = localVariables.filter(variable => variable.resolvedType === 'COLOR');
        const categorizedColors = this.categorizeColorVariables(colorVariables);
        
        document.getElementById('colorCount').textContent = `${colorVariables.length} colors`;
        
        if (colorVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No color tokens found</div>';
            return;
        }

        let html = '';
        
        // Renderizar cada subcategoría de color
        const subcategories = [
            { key: 'brand', title: 'Brand Colors', icon: 'fas fa-star', description: 'Primary brand and identity colors' },
            { key: 'semantic', title: 'Semantic Colors', icon: 'fas fa-exclamation-triangle', description: 'Success, warning, error, and info colors' },
            { key: 'neutral', title: 'Neutral Colors', icon: 'fas fa-circle', description: 'Grays, blacks, whites, and neutral tones' },
            { key: 'interactive', title: 'Interactive Colors', icon: 'fas fa-hand-pointer', description: 'Buttons, links, and interactive elements' },
            { key: 'surface', title: 'Surface Colors', icon: 'fas fa-layer-group', description: 'Backgrounds and surface colors' },
            { key: 'other', title: 'Other Colors', icon: 'fas fa-palette', description: 'Additional color tokens' }
        ];

        subcategories.forEach(subcategory => {
            const variables = categorizedColors[subcategory.key];
            if (variables && variables.length > 0) {
                html += `
                    <div class="color-subcategory">
                        <div class="subcategory-header">
                            <div class="subcategory-title">
                                <h4><i class="${subcategory.icon}"></i> ${subcategory.title}</h4>
                                <p class="subcategory-description">${subcategory.description}</p>
                            </div>
                            <span class="subcategory-count">${variables.length} colors</span>
                        </div>
                        <div class="color-tokens-grid">
                            ${variables.map(variable => {
                                const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
                                const collectionName = collection ? collection.name : 'Unknown Collection';
                                
                                // Get the first mode's value as preview
                                const firstMode = collection.modes[0];
                                const resolvedValue = this.resolveVariableValue(variable.valuesByMode[firstMode.modeId], firstMode.modeId);
                                const colorValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
                                
                                return `
                                    <div class="color-token-card">
                                        <div class="color-preview" style="background-color: ${colorValue}">
                                            <div class="color-overlay">
                                                <span class="color-hex">${colorValue}</span>
                                            </div>
                                        </div>
                                        <div class="color-info">
                                            <div class="color-name" title="${this.escapeHtml(variable.name)}">${this.escapeHtml(variable.name)}</div>
                                            <div class="color-value">${colorValue}</div>
                                            <div class="color-collection">${collectionName}</div>
                                        </div>
                                        <div class="color-modes">
                                            ${collection.modes.map(mode => {
                                                const modeValue = this.convertValueForCSS(
                                                    this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId),
                                                    variable.resolvedType,
                                                    variable.name
                                                );
                                                return `
                                                    <div class="color-mode-item">
                                                        <div class="mode-color-preview" style="background-color: ${modeValue}"></div>
                                                        <span class="mode-name">${this.escapeHtml(mode.name)}</span>
                                                        <span class="mode-value">${modeValue}</span>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }

    renderFontTokens() {
        const container = document.getElementById('fontContainer');
        const { localVariables } = this.getLocalVariables();
        
        // Incluir todas las variables que puedan ser relacionadas con fuentes
        const fontVariables = localVariables.filter(variable => {
            // Incluir variables de tipo STRING (font-family, font-style, etc.)
            if (variable.resolvedType === 'STRING') {
                return this.isFontVariable(variable.name);
            }
            
            // Incluir variables de tipo FLOAT que puedan ser font-size, line-height, letter-spacing
            if (variable.resolvedType === 'FLOAT') {
                const name = variable.name.toLowerCase();
                return name.includes('font') || 
                       name.includes('size') || 
                       name.includes('weight') ||
                       name.includes('line-height') || 
                       name.includes('lineheight') ||
                       name.includes('letter-spacing') || 
                       name.includes('letterspacing') ||
                       name.includes('text') ||
                       name.includes('typography');
            }
            
            // Incluir variables BOOLEAN para font-style (italic, etc.)
            if (variable.resolvedType === 'BOOLEAN') {
                return this.isFontVariable(variable.name);
            }
            
            return false;
        });
        
        const categorizedFonts = this.categorizeFontVariables(fontVariables);
        
        document.getElementById('fontCount').textContent = `${fontVariables.length} font values`;
        
        if (fontVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No font tokens found</div>';
            return;
        }

        let html = '';
        
        // Renderizar cada subcategoría de font
        const subcategories = [
            { key: 'family', title: 'Font Family', icon: 'fas fa-font' },
            { key: 'size', title: 'Font Size', icon: 'fas fa-text-height' },
            { key: 'weight', title: 'Font Weight', icon: 'fas fa-bold' },
            { key: 'lineHeight', title: 'Line Height', icon: 'fas fa-align-left' },
            { key: 'letterSpacing', title: 'Letter Spacing', icon: 'fas fa-expand-arrows-alt' },
            { key: 'style', title: 'Font Style', icon: 'fas fa-italic' },
            { key: 'decoration', title: 'Text Decoration', icon: 'fas fa-underline' }
        ];

        subcategories.forEach(subcategory => {
            const variables = categorizedFonts[subcategory.key];
            if (variables.length > 0) {
                html += `
                    <div class="font-subcategory">
                        <div class="subcategory-header">
                            <h4><i class="${subcategory.icon}"></i> ${subcategory.title}</h4>
                            <span class="subcategory-count">${variables.length} tokens</span>
                        </div>
                        <div class="font-tokens-grid">
                            ${variables.map(variable => {
                                const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
                                const collectionName = collection ? collection.name : 'Unknown Collection';
                                
                                // Get the first mode's value as preview
                                const firstMode = collection.modes[0];
                                const resolvedValue = this.resolveVariableValue(variable.valuesByMode[firstMode.modeId], firstMode.modeId);
                                const fontValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
                                
                                return `
                                    <div class="font-token-card">
                                        <div class="font-preview">
                                            ${subcategory.key === 'size' ? 
                                                `<div class="font-size-preview" style="font-size: ${fontValue};">Aa</div>` :
                                                `<div class="font-value">${fontValue}</div>`
                                            }
                                        </div>
                                        <div class="font-info">
                                            <div class="font-name">${this.escapeHtml(variable.name)}</div>
                                            <div class="font-value-text">${fontValue}</div>
                                            ${subcategory.key === 'size' ? 
                                                `<div class="font-size-scale">
                                                    <div class="size-indicator" style="width: ${Math.min(parseFloat(fontValue) * 2, 100)}px"></div>
                                                </div>` : ''
                                            }
                                        </div>
                                        <div class="font-modes">
                                            ${collection.modes.map(mode => `
                                                <div class="mode-item">
                                                    <span class="mode-name">${mode.name}</span>
                                                    <span class="mode-value">${this.convertValueForCSS(
                                                        this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId),
                                                        variable.resolvedType,
                                                        variable.name
                                                    )}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <div class="font-collection">${collectionName}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }

    renderSpacingTokens() {
        const container = document.getElementById('spacingContainer');
        const { localVariables } = this.getLocalVariables();
        
        const spacingVariables = localVariables.filter(variable => 
            variable.resolvedType === 'FLOAT' && 
            this.isSpacingVariable(variable.name)
        );
        
        document.getElementById('spacingCount').textContent = `${spacingVariables.length} spacing values`;
        
        if (spacingVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No spacing tokens found</div>';
            return;
        }
        
        container.innerHTML = spacingVariables.map(variable => {
            const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
            const firstMode = collection.modes[0];
            const resolvedValue = this.resolveVariableValue(variable.valuesByMode[firstMode.modeId], firstMode.modeId);
            
            return `
                <div class="spacing-token-card">
                    <div class="spacing-visual" style="width: ${Math.min(resolvedValue * 2, 100)}px"></div>
                    <div class="spacing-info">
                        <div class="spacing-name">${this.escapeHtml(variable.name)}</div>
                        <div class="spacing-value">${resolvedValue}px</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderBorderTokens() {
        const container = document.getElementById('borderContainer');
        const { localVariables } = this.getLocalVariables();
        
        const borderVariables = localVariables.filter(variable => this.isBorderVariable(variable.name));
        const categorizedBorders = this.categorizeBorderVariables(borderVariables);
        
        document.getElementById('borderCount').textContent = `${borderVariables.length} border values`;
        
        if (borderVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No border tokens found</div>';
            return;
        }

        let html = '';
        
        // Renderizar cada subcategoría de border
        const subcategories = [
            { key: 'radius', title: 'Border Radius', icon: 'fas fa-circle' },
            { key: 'width', title: 'Border Width', icon: 'fas fa-square' }
        ];

        subcategories.forEach(subcategory => {
            const variables = categorizedBorders[subcategory.key];
            if (variables.length > 0) {
                html += `
                    <div class="border-subcategory">
                        <div class="subcategory-header">
                            <h4><i class="${subcategory.icon}"></i> ${subcategory.title}</h4>
                            <span class="subcategory-count">${variables.length} tokens</span>
                        </div>
                        <div class="border-tokens-grid">
                            ${variables.map(variable => {
                                const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
                                const collectionName = collection ? collection.name : 'Unknown Collection';
                                
                                // Get the first mode's value as preview
                                const firstMode = collection.modes[0];
                                const resolvedValue = this.resolveVariableValue(variable.valuesByMode[firstMode.modeId], firstMode.modeId);
                                const borderValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
                                
                                return `
                                    <div class="border-token-card">
                                        <div class="border-preview">
                                            <div class="border-value">${borderValue}</div>
                                        </div>
                                        <div class="border-info">
                                            <div class="border-name">${this.escapeHtml(variable.name)}</div>
                                            <div class="border-value-text">${borderValue}</div>
                                        </div>
                                        <div class="border-modes">
                                            ${collection.modes.map(mode => `
                                                <div class="mode-item">
                                                    <span class="mode-name">${mode.name}</span>
                                                    <span class="mode-value">${this.convertValueForCSS(
                                                        this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId),
                                                        variable.resolvedType,
                                                        variable.name
                                                    )}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <div class="border-collection">${collectionName}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }

    renderSizeTokens() {
        const container = document.getElementById('sizeContainer');
        const { localVariables } = this.getLocalVariables();
        
        const sizeVariables = localVariables.filter(variable => this.isSizeVariable(variable.name));
        const categorizedSizes = this.categorizeSizeVariables(sizeVariables);
        
        document.getElementById('sizeCount').textContent = `${sizeVariables.length} size values`;
        
        if (sizeVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No size tokens found</div>';
            return;
        }

        let html = '';
        
        // Renderizar cada subcategoría de size
        const subcategories = [
            { key: 'icon', title: 'Icon Size', icon: 'fas fa-icons' }
        ];

        subcategories.forEach(subcategory => {
            const variables = categorizedSizes[subcategory.key];
            if (variables.length > 0) {
                html += `
                    <div class="size-subcategory">
                        <div class="subcategory-header">
                            <h4><i class="${subcategory.icon}"></i> ${subcategory.title}</h4>
                            <span class="subcategory-count">${variables.length} tokens</span>
                        </div>
                        <div class="size-tokens-grid">
                            ${variables.map(variable => {
                                const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
                                const collectionName = collection ? collection.name : 'Unknown Collection';
                                
                                // Get the first mode's value as preview
                                const firstMode = collection.modes[0];
                                const resolvedValue = this.resolveVariableValue(variable.valuesByMode[firstMode.modeId], firstMode.modeId);
                                const sizeValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
                                
                                return `
                                    <div class="size-token-card">
                                        <div class="size-preview">
                                            <div class="size-value">${sizeValue}</div>
                                        </div>
                                        <div class="size-info">
                                            <div class="size-name">${this.escapeHtml(variable.name)}</div>
                                            <div class="size-value-text">${sizeValue}</div>
                                        </div>
                                        <div class="size-modes">
                                            ${collection.modes.map(mode => `
                                                <div class="mode-item">
                                                    <span class="mode-name">${mode.name}</span>
                                                    <span class="mode-value">${this.convertValueForCSS(
                                                        this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId),
                                                        variable.resolvedType,
                                                        variable.name
                                                    )}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <div class="size-collection">${collectionName}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }



    renderOpacityTokens() {
        const container = document.getElementById('opacityContainer');
        const { localVariables } = this.getLocalVariables();
        
        const opacityVariables = localVariables.filter(variable => this.isOpacityVariable(variable.name));
        
        document.getElementById('opacityCount').textContent = `${opacityVariables.length} opacity values`;
        
        if (opacityVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No opacity tokens found</div>';
            return;
        }

        container.innerHTML = opacityVariables.map(variable => {
            const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
            const collectionName = collection ? collection.name : 'Unknown Collection';
            
            // Get the first mode's value as preview
            const firstMode = collection.modes[0];
            const resolvedValue = this.resolveVariableValue(variable.valuesByMode[firstMode.modeId], firstMode.modeId);
            const opacityValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
            
            return `
                <div class="opacity-token-card">
                    <div class="opacity-preview">
                        <div class="opacity-value">${opacityValue}</div>
                    </div>
                    <div class="opacity-info">
                        <div class="opacity-name">${this.escapeHtml(variable.name)}</div>
                        <div class="opacity-value-text">${opacityValue}</div>
                    </div>
                    <div class="opacity-modes">
                        ${collection.modes.map(mode => `
                            <div class="mode-item">
                                <span class="mode-name">${mode.name}</span>
                                <span class="mode-value">${this.convertValueForCSS(
                                    this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId),
                                    variable.resolvedType,
                                    variable.name
                                )}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="opacity-collection">${collectionName}</div>
                </div>
            `;
        }).join('');
    }

    renderTypographyTokens() {
        const container = document.getElementById('typographyContainer');
        const { localVariables } = this.getLocalVariables();
        
        const typographyVariables = localVariables.filter(variable => 
            variable.resolvedType === 'FLOAT' && 
            this.isTypographyVariable(variable.name)
        );
        
        document.getElementById('typographyCount').textContent = `${typographyVariables.length} typography values`;
        
        if (typographyVariables.length === 0) {
            container.innerHTML = '<div class="empty-state">No typography tokens found</div>';
            return;
        }
        
        container.innerHTML = typographyVariables.map(variable => {
            const collection = this.filteredData.meta.variableCollections[variable.variableCollectionId];
            const firstMode = collection.modes[0];
            const resolvedValue = this.resolveVariableValue(variable.valuesByMode[firstMode.modeId], firstMode.modeId);
            
            // Determine the type of typography variable
            const isFontWeight = this.isFontWeightVariable(variable.name);
            const isFontSize = variable.name.toLowerCase().includes('size') || variable.name.toLowerCase().includes('font');
            
            let previewStyle = '';
            let displayValue = '';
            let label = '';
            
            if (isFontWeight) {
                const fontWeightValue = this.convertFontWeightValue(resolvedValue);
                previewStyle = `font-weight: ${fontWeightValue}; font-size: 16px;`;
                displayValue = fontWeightValue;
                label = 'Weight';
            } else if (isFontSize) {
                previewStyle = `font-size: ${resolvedValue}px;`;
                displayValue = `${resolvedValue}px`;
                label = 'Size';
            } else {
                // Other typography values (line-height, letter-spacing, etc.)
                previewStyle = `font-size: 16px;`;
                displayValue = `${resolvedValue}px`;
                label = 'Value';
            }
            
            return `
                <div class="typography-token-card">
                    <div class="typography-preview" style="${previewStyle}">
                        ${this.escapeHtml(variable.name)}
                    </div>
                    <div class="typography-info">
                        <div class="typography-detail">
                            <div class="typography-label">${label}</div>
                            <div class="typography-value">${displayValue}</div>
                        </div>
                        <div class="typography-detail">
                            <div class="typography-label">Variable</div>
                            <div class="typography-value">${this.escapeHtml(variable.name)}</div>
                        </div>
                        <div class="typography-detail">
                            <div class="typography-label">Type</div>
                            <div class="typography-value">${isFontWeight ? 'Font Weight' : isFontSize ? 'Font Size' : 'Typography'}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }


    isSpacingVariable(name) {
        const lowerName = name.toLowerCase();
        
        // Excluir explícitamente line-height y otras propiedades tipográficas
        if (lowerName.includes('line-height') || 
            lowerName.includes('lineheight') || 
            lowerName.includes('letter-spacing') || 
            lowerName.includes('letterspacing')) {
            return false;
        }
        
        // Detectar tokens de spacing con estructura específica
        if (lowerName.includes('spacing/') || 
            lowerName.includes('spacing-inline') ||
            lowerName.includes('spacing-inset') ||
            lowerName.includes('spacing-stack')) {
            return true;
        }
        
        const spacingKeywords = ['spacing', 'margin', 'padding', 'gap', 'space'];
        return spacingKeywords.some(keyword => lowerName.includes(keyword));
    }

    isTypographyVariable(name) {
        const typographyKeywords = ['font', 'text', 'size', 'line-height', 'letter-spacing', 'weight'];
        return typographyKeywords.some(keyword => 
            name.toLowerCase().includes(keyword)
        );
    }

    isFontVariable(name) {
        const lowerName = name.toLowerCase();
        
        // Excluir explícitamente tokens que NO son de fuente
        if (lowerName.includes('spacing/') && !lowerName.includes('letter-spacing') ||
            lowerName.includes('border/') || 
            lowerName.includes('color/') ||
            lowerName.includes('margin') ||
            lowerName.includes('padding') ||
            lowerName.includes('gap') ||
            lowerName.includes('radius') ||
            lowerName.includes('width') && !lowerName.includes('font-width') ||
            lowerName.includes('height') && !lowerName.includes('line-height')) {
            return false;
        }
        
        // Detectar variables de fuente más específicamente
        const fontKeywords = [
            'font-family', 'fontfamily', 'family',
            'font-size', 'fontsize', 
            'font-weight', 'fontweight', 'weight',
            'line-height', 'lineheight',
            'letter-spacing', 'letterspacing',
            'font-style', 'fontstyle', 
            'text-decoration', 'textdecoration', 'decoration',
            'font', 'text', 'typography'
        ];
        
        // Detectar específicamente variables de tipografía
        const isLineHeight = lowerName.includes('line-height') || lowerName.includes('lineheight');
        const isLetterSpacing = lowerName.includes('letter-spacing') || lowerName.includes('letterspacing');
        const isFontSize = lowerName.includes('font-size') || lowerName.includes('fontsize');
        const isTextSize = lowerName.includes('text') && lowerName.includes('size');
        const isTypographySize = lowerName.includes('typography') && lowerName.includes('size');
        
        // También incluir variables que contengan 'font', 'text' o 'typography'
        const isFontKeyword = fontKeywords.some(keyword => lowerName.includes(keyword));
        const isFontPrefix = lowerName.includes('font') && 
                           !lowerName.includes('font-color') && 
                           !lowerName.includes('font-background') &&
                           !lowerName.includes('font-border');
        
        // Incluir variables que contengan 'size' si están en contexto de tipografía
        const isSizeInTypographyContext = lowerName.includes('size') && 
                                        (lowerName.includes('text') || 
                                         lowerName.includes('font') || 
                                         lowerName.includes('typography') ||
                                         lowerName.includes('heading') ||
                                         lowerName.includes('body') ||
                                         lowerName.includes('caption') ||
                                         lowerName.includes('label'));
        
        return isFontKeyword || isFontPrefix || isLineHeight || isLetterSpacing || 
               isFontSize || isTextSize || isTypographySize || isSizeInTypographyContext;
    }

    isBorderVariable(name) {
        const lowerName = name.toLowerCase();
        
        // Detectar tokens de border con estructura específica
        if (lowerName.includes('border/') || 
            lowerName.includes('border-width') ||
            lowerName.includes('border-radius') ||
            lowerName.includes('border-size')) {
            return true;
        }
        
        // Detectar específicamente border/radius y border/width
        if (lowerName.includes('border/radius') || 
            lowerName.includes('border/width') ||
            lowerName.includes('border-radius') ||
            lowerName.includes('border-width')) {
            return true;
        }
        
        const borderKeywords = ['border', 'radius', 'width'];
        return borderKeywords.some(keyword => lowerName.includes(keyword));
    }

    isSizeVariable(name) {
        const lowerName = name.toLowerCase();
        
        // Excluir explícitamente font-size y border-size
        if (lowerName.includes('font-size') || 
            lowerName.includes('fontsize') ||
            lowerName.includes('border-size') ||
            lowerName.includes('bordersize')) {
            return false;
        }
        
        // Detectar tokens de size con estructura específica
        if (lowerName.includes('size/') || 
            lowerName.includes('size-icon') ||
            lowerName.includes('size/icon')) {
            return true;
        }
        
        // Detectar tokens que contengan 'size' pero no sean de font o border
        if (lowerName.includes('size') && 
            !lowerName.includes('font') && 
            !lowerName.includes('border')) {
            return true;
        }
        
        return false;
    }



    isOpacityVariable(name) {
        const lowerName = name.toLowerCase();
        const opacityKeywords = ['opacity', 'alpha', 'transparency', 'level'];
        
        // Check for explicit opacity keywords
        const hasOpacityKeyword = opacityKeywords.some(keyword => lowerName.includes(keyword));
        
        // Check for opacity-level patterns like "opacity-level-1", "level-1", etc.
        const isOpacityLevel = lowerName.includes('level') && 
                              (lowerName.includes('opacity') || 
                               /level-?\d+/.test(lowerName));
        
        return hasOpacityKeyword || isOpacityLevel;
    }

    isFontWeightVariable(name) {
        const fontWeightKeywords = ['weight', 'font-weight', 'bold', 'light', 'medium', 'regular'];
        return fontWeightKeywords.some(keyword => 
            name.toLowerCase().includes(keyword)
        );
    }

    isLineHeightVariable(name) {
        const lowerName = name.toLowerCase();
        return lowerName.includes('line-height') || 
               lowerName.includes('lineheight') ||
               lowerName.includes('leading') ||
               (lowerName.includes('font') && lowerName.includes('line'));
    }

    isLetterSpacingVariable(name) {
        const lowerName = name.toLowerCase();
        return lowerName.includes('letter-spacing') || 
               lowerName.includes('letterspacing') ||
               lowerName.includes('tracking');
    }

    isBorderRadiusVariable(name) {
        const lowerName = name.toLowerCase();
        return lowerName.includes('radius') || 
               lowerName.includes('border-radius') ||
               lowerName.includes('corner');
    }

    convertFontWeightValue(value) {
        // Convert numeric font-weight values to CSS string equivalents
        const fontWeightMap = {
            100: 'thin',
            200: 'extra-light',
            300: 'light',
            400: 'normal',
            500: 'medium',
            600: 'semi-bold',
            700: 'bold',
            800: 'extra-bold',
            900: 'black'
        };
        
        if (typeof value === 'number') {
            return fontWeightMap[value] || value.toString();
        }
        
        return value;
    }

    renderValuesByMode(variable) {
        if (!variable.valuesByMode) return '';
        
        return `
            <div class="values-section">
                <h4>Values by Mode</h4>
                <div class="values-grid">
                    ${Object.entries(variable.valuesByMode).map(([modeId, value]) => `
                        <div class="value-item">
                            <label>${modeId}:</label>
                            <div class="value-display">
                                ${this.renderValue(value, variable.resolvedType)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderValue(value, type) {
        if (type === 'COLOR' && typeof value === 'object' && value.r !== undefined) {
            const r = Math.round(value.r * 255);
            const g = Math.round(value.g * 255);
            const b = Math.round(value.b * 255);
            const a = value.a || 1;
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            
            return `
                <div class="color-value">
                    <div class="color-swatch" style="background-color: rgba(${r}, ${g}, ${b}, ${a})"></div>
                    <div class="color-info">
                        <code>${hex}</code>
                        <small>rgba(${r}, ${g}, ${b}, ${a})</small>
                    </div>
                </div>
            `;
        } else {
            return `<code>${JSON.stringify(value)}</code>`;
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    handleSearchInput(e) {
        const searchTerm = e.target.value;
        const clearBtn = document.getElementById('clearSearchBtn');
        
        // Show/hide clear button
        if (searchTerm.length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }
        
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.filterData();
        }, 300);
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('clearSearchBtn').classList.remove('visible');
        this.filterData();
    }

    filterData() {
        if (!this.apiData) return;

        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;
        const locationFilter = document.getElementById('locationFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;

        const filteredVariables = {};
        const filteredCollections = {};

        // Filter variables
        if (this.apiData.meta.variables) {
            Object.entries(this.apiData.meta.variables).forEach(([id, variable]) => {
                let matches = true;

                // Search filter - enhanced search
                if (searchTerm) {
                    const searchMatches = this.enhancedSearch(variable, searchTerm);
                    if (!searchMatches) {
                    matches = false;
                    }
                }

                // Type filter
                if (typeFilter && variable.resolvedType !== typeFilter) {
                    matches = false;
                }

                // Location filter
                if (locationFilter === 'local' && variable.remote) {
                    matches = false;
                } else if (locationFilter === 'remote' && !variable.remote) {
                    matches = false;
                }

                // Category filter
                if (categoryFilter && !this.matchesCategory(variable, categoryFilter)) {
                    matches = false;
                }

                if (matches) {
                    filteredVariables[id] = variable;
                }
            });
        }

        // Filter collections
        if (this.apiData.meta.variableCollections) {
            Object.entries(this.apiData.meta.variableCollections).forEach(([id, collection]) => {
                let matches = true;

                // Search filter
                if (searchTerm && !collection.name.toLowerCase().includes(searchTerm)) {
                    matches = false;
                }

                // Location filter
                if (locationFilter === 'local' && collection.remote) {
                    matches = false;
                } else if (locationFilter === 'remote' && !collection.remote) {
                    matches = false;
                }

                if (matches) {
                    filteredCollections[id] = collection;
                }
            });
        }

        this.filteredData = {
            ...this.apiData,
            meta: {
                ...this.apiData.meta,
                variables: filteredVariables,
                variableCollections: filteredCollections
            }
        };

        this.updateSearchResultsInfo();
        this.renderCollections();
        this.renderTokensByType();
    }

    enhancedSearch(variable, searchTerm) {
        // Search in variable name
        if (variable.name.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Search in variable description
        if (variable.description && variable.description.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Search in variable values
        if (variable.valuesByMode) {
            for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
                const resolvedValue = this.resolveVariableValue(value, modeId);
                if (typeof resolvedValue === 'string' && resolvedValue.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                if (typeof resolvedValue === 'number' && resolvedValue.toString().includes(searchTerm)) {
                    return true;
                }
            }
        }

        // Search in collection name
        const collection = this.apiData.meta.variableCollections[variable.variableCollectionId];
        if (collection && collection.name.toLowerCase().includes(searchTerm)) {
            return true;
        }

        return false;
    }

    matchesCategory(variable, category) {
        if (!category) return true;
        
        const name = variable.name.toLowerCase();
        
        switch (category) {
            case 'color':
                return variable.resolvedType === 'COLOR';
            case 'font':
                // Verificar específicamente line-height y letter-spacing
                const isLineHeight = name.includes('line-height') || name.includes('lineheight');
                const isLetterSpacing = name.includes('letter-spacing') || name.includes('letterspacing');
                
                // Excluir tokens que claramente no son de fuente
                const isNotSpacing = !name.includes('spacing/') && !name.includes('spacing-inline') && !name.includes('spacing-inset') && !name.includes('spacing-stack');
                const isNotBorder = !name.includes('border/') && !name.includes('border-width') && !name.includes('border-radius');
                const isNotColor = !name.includes('color/');
                
                return (this.isFontVariable(variable.name) || isLineHeight || isLetterSpacing) && isNotSpacing && isNotBorder && isNotColor;
            case 'spacing':
                // Excluir explícitamente line-height y letter-spacing de spacing
                const isNotTypography = !name.includes('line-height') && 
                                      !name.includes('lineheight') && 
                                      !name.includes('letter-spacing') && 
                                      !name.includes('letterspacing');
                return this.isSpacingVariable(variable.name) && isNotTypography;
            case 'border':
                return this.isBorderVariable(variable.name);
            case 'size':
                return this.isSizeVariable(variable.name);
            case 'opacity':
                return this.isOpacityVariable(variable.name);
            default:
                return true;
        }
    }

    updateSearchResultsInfo() {
        const searchTerm = document.getElementById('searchInput').value;
        const resultsInfo = document.getElementById('searchResultsInfo');
        
        if (!searchTerm) {
            resultsInfo.innerHTML = '';
            resultsInfo.classList.remove('has-results');
            return;
        }

        const { localVariables } = this.getLocalVariables();
        const totalResults = localVariables.length;
        
        if (totalResults === 0) {
            resultsInfo.innerHTML = 'No results found';
            resultsInfo.classList.remove('has-results');
        } else {
            resultsInfo.innerHTML = `Found ${totalResults} result${totalResults !== 1 ? 's' : ''}`;
            resultsInfo.classList.add('has-results');
        }
    }

    getLocalVariables() {
        const variables = this.filteredData.meta.variables || {};
        const collections = this.filteredData.meta.variableCollections || {};
        
        // Filter to get only local variables from local collections
        const localVariables = Object.values(variables).filter(variable => {
            if (variable.remote) return false;
            const collection = collections[variable.variableCollectionId];
            return collection && !collection.remote;
        });
        
        const localCollections = Object.values(collections).filter(collection => !collection.remote);
        
        return { localVariables, localCollections };
    }

    resolveVariableValue(value, modeId) {
        // Handle variable references (aliases) - resolve recursively
        if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
            const referencedVariable = this.apiData.meta.variables[value.id];
            if (referencedVariable && referencedVariable.valuesByMode) {
                const referencedValue = referencedVariable.valuesByMode[modeId];
                return this.resolveVariableValue(referencedValue, modeId);
            }
        }
        return value;
    }

    convertValueForCSS(value, type, variableName = '') {
        switch (type) {
            case 'COLOR':
                if (typeof value === 'object' && value.r !== undefined) {
                    const r = Math.round(value.r * 255);
                    const g = Math.round(value.g * 255);
                    const b = Math.round(value.b * 255);
                    const a = value.a || 1;
                    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                }
                return value;
            case 'FLOAT':
                return this.addUnitsToFloatValue(value, variableName);
            case 'STRING':
                return value;
            case 'BOOLEAN':
                return value;
            default:
                return value;
        }
    }

    addUnitsToFloatValue(value, variableName = '') {
        const lowerName = variableName.toLowerCase();
        
        // Font-weight variables (no units) - highest priority
        if (this.isFontWeightVariable(variableName)) {
            return this.convertFontWeightValue(value);
        }
        
        // Opacity values (no units, convert percentage to decimal if needed)
        if (this.isOpacityVariable(variableName)) {
            // If value is > 1, assume it's a percentage (e.g., 20 = 0.2)
            if (value > 1 && value <= 100) {
                return (value / 100).toString();
            }
            return value.toString();
        }
        
        // Line-height values (conditional units)
        if (this.isLineHeightVariable(variableName)) {
            // If it's a reasonable line-height multiplier (1-3), no units
            if (value >= 1 && value <= 3) {
                return value.toString();
            }
            // Otherwise, treat as pixel value
            return `${value}px`;
        }
        
        // Letter-spacing values (use em for relative spacing)
        if (this.isLetterSpacingVariable(variableName)) {
            return `${value}em`;
        }
        
        // Font-size values (ALWAYS use px) - very specific check
        if (lowerName.includes('font-size') || 
            lowerName.includes('fontsize') || 
            (lowerName.includes('font') && lowerName.includes('size')) ||
            (lowerName.includes('text') && lowerName.includes('size')) ||
            (lowerName.includes('typography') && lowerName.includes('size'))) {
            return `${value}px`;
        }
        
        // Border radius values (use px)
        if (lowerName.includes('radius') || 
            lowerName.includes('border-radius') ||
            lowerName.includes('corner')) {
            return `${value}px`;
        }
        
        // Border width values (use px)
        if ((lowerName.includes('border') && lowerName.includes('width')) ||
            lowerName.includes('border-width') ||
            (lowerName.includes('border') && (lowerName.includes('thick') || lowerName.includes('thin')))) {
            return `${value}px`;
        }
        
        // Spacing values (use px) - comprehensive check
        if (lowerName.includes('spacing') ||
            lowerName.includes('margin') ||
            lowerName.includes('padding') ||
            lowerName.includes('gap') ||
            lowerName.includes('inset') ||
            lowerName.includes('stack') ||
            lowerName.includes('inline')) {
            return `${value}px`;
        }
        
        // Size values (use px)
        if (lowerName.includes('size') && 
            !lowerName.includes('font-size') && 
            !lowerName.includes('fontsize')) {
            return `${value}px`;
        }
        
        // Width and height values (use px)
        if (lowerName.includes('width') || lowerName.includes('height')) {
            return `${value}px`;
        }
        
        // Special case for generic numeric variables that should be unitless
        if (lowerName.includes('numeric') || 
            lowerName.includes('number') ||
            lowerName.match(/^(num|numeric)-?\d+$/)) {
            return value.toString();
        }
        
        // Default to px for any other dimensional values
        return `${value}px`;
    }

    sanitizeVariableName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\-_]/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }

    categorizeVariables(variables) {
        return {
            color: this.categorizeColorVariables(variables.filter(variable => variable.resolvedType === 'COLOR')),
            font: this.categorizeFontVariables(variables.filter(variable => this.isFontVariable(variable.name))),
            spacing: this.categorizeSpacingVariables(variables.filter(variable => this.isSpacingVariable(variable.name))),
            border: this.categorizeBorderVariables(variables.filter(variable => this.isBorderVariable(variable.name))),
            size: this.categorizeSizeVariables(variables.filter(variable => this.isSizeVariable(variable.name))),
            opacity: this.categorizeOpacityVariables(variables.filter(variable => this.isOpacityVariable(variable.name)))
        };
    }

    categorizeColorVariables(colorVariables) {
        const categories = {
            brand: [],
            semantic: [],
            neutral: [],
            interactive: [],
            surface: [],
            other: []
        };

        colorVariables.forEach(variable => {
            const name = variable.name.toLowerCase();
            
            // Brand colors
            if (name.includes('brand') || name.includes('primary') || name.includes('secondary') || 
                name.includes('accent') || name.includes('logo')) {
                categories.brand.push({...variable, subcategory: 'brand'});
            }
            // Semantic colors (feedback states)
            else if (name.includes('success') || name.includes('error') || name.includes('warning') || 
                     name.includes('info') || name.includes('danger') || name.includes('critical') ||
                     name.includes('green') || name.includes('red') || name.includes('yellow') || 
                     name.includes('orange') || name.includes('blue')) {
                categories.semantic.push({...variable, subcategory: 'semantic'});
            }
            // Neutral colors
            else if (name.includes('neutral') || name.includes('gray') || name.includes('grey') || 
                     name.includes('black') || name.includes('white') || name.includes('text') ||
                     name.includes('content')) {
                categories.neutral.push({...variable, subcategory: 'neutral'});
            }
            // Interactive colors
            else if (name.includes('interactive') || name.includes('button') || name.includes('link') || 
                     name.includes('hover') || name.includes('active') || name.includes('focus') ||
                     name.includes('pressed') || name.includes('disabled')) {
                categories.interactive.push({...variable, subcategory: 'interactive'});
            }
            // Surface colors
            else if (name.includes('surface') || name.includes('background') || name.includes('bg') || 
                     name.includes('backdrop') || name.includes('overlay') || name.includes('card') ||
                     name.includes('container')) {
                categories.surface.push({...variable, subcategory: 'surface'});
            }
            // Other colors
            else {
                categories.other.push({...variable, subcategory: 'other'});
            }
        });

        return categories;
    }

    categorizeFontVariables(fontVariables) {
        const categories = {
            family: [],
            size: [],
            weight: [],
            lineHeight: [],
            letterSpacing: [],
            style: [],
            decoration: [],
            other: []
        };

        fontVariables.forEach(variable => {
            const name = variable.name.toLowerCase();
            const type = variable.resolvedType;
            
            // Categorización más específica y precisa basada en nombre y tipo
            if (name.includes('family') || name.includes('font-family') || name.includes('fontfamily')) {
                categories.family.push({...variable, subcategory: 'family'});
            } else if (name.includes('font-size') || name.includes('fontsize') || 
                      (name.includes('size') && type === 'FLOAT' && 
                       !name.includes('border') && !name.includes('icon') && !name.includes('spacing'))) {
                categories.size.push({...variable, subcategory: 'size'});
            } else if (name.includes('weight') || name.includes('font-weight') || name.includes('fontweight')) {
                categories.weight.push({...variable, subcategory: 'weight'});
            } else if (name.includes('line-height') || name.includes('lineheight')) {
                categories.lineHeight.push({...variable, subcategory: 'lineHeight'});
            } else if (name.includes('letter-spacing') || name.includes('letterspacing')) {
                categories.letterSpacing.push({...variable, subcategory: 'letterSpacing'});
            } else if (name.includes('style') || name.includes('font-style') || name.includes('fontstyle')) {
                categories.style.push({...variable, subcategory: 'style'});
            } else if (name.includes('decoration') || name.includes('text-decoration') || name.includes('textdecoration')) {
                categories.decoration.push({...variable, subcategory: 'decoration'});
            } else if (type === 'FLOAT' && (name.includes('text') || name.includes('typography'))) {
                // Variables FLOAT que contienen 'text' o 'typography' probablemente son font-size
                if (name.includes('size') || name.match(/\d+(px|rem|em)$/)) {
                    categories.size.push({...variable, subcategory: 'size'});
                } else {
                    categories.other.push({...variable, subcategory: 'other'});
                }
            } else if (name.includes('font') || name.includes('text') || name.includes('typography')) {
                // Otras variables que claramente son de fuente
                categories.other.push({...variable, subcategory: 'other'});
            } else {
                // Variables que no encajan en ninguna categoría específica
                categories.other.push({...variable, subcategory: 'other'});
            }
        });

        return categories;
    }

    categorizeSpacingVariables(spacingVariables) {
        const categories = {
            inline: [],
            inset: [],
            stack: []
        };

        spacingVariables.forEach(variable => {
            const name = variable.name.toLowerCase();
            
            // Verificar que no sea una propiedad tipográfica
            if (name.includes('line-height') || 
                name.includes('lineheight') || 
                name.includes('letter-spacing') || 
                name.includes('letterspacing')) {
                // Estas variables ya fueron filtradas por isSpacingVariable, pero por seguridad
                return;
            }
            
            if (name.includes('inline') || name.includes('horizontal')) {
                categories.inline.push(variable);
            } else if (name.includes('inset') || name.includes('padding') || name.includes('inner')) {
                categories.inset.push(variable);
            } else if (name.includes('stack') || name.includes('vertical') || name.includes('margin')) {
                categories.stack.push(variable);
            } else {
                // Por defecto, si contiene 'spacing' pero no es tipográfico, va a stack
                categories.stack.push(variable);
            }
        });

        return categories;
    }

    categorizeBorderVariables(borderVariables) {
        const categories = {
            radius: [],
            width: []
        };

        borderVariables.forEach(variable => {
            const name = variable.name.toLowerCase();
            
            if (name.includes('radius') || name.includes('border-radius')) {
                categories.radius.push(variable);
            } else if (name.includes('width') || name.includes('border-width')) {
                categories.width.push(variable);
            } else {
                categories.radius.push(variable);
            }
        });

        return categories;
    }

    categorizeSizeVariables(sizeVariables) {
        const categories = {
            icon: [],
            general: []
        };

        sizeVariables.forEach(variable => {
            const name = variable.name.toLowerCase();
            
            if (name.includes('icon') || name.includes('size/icon')) {
                categories.icon.push(variable);
            } else {
                categories.general.push(variable);
            }
        });

        return categories;
    }



    categorizeOpacityVariables(opacityVariables) {
        return opacityVariables;
    }

    generateCSSVariableName(variable, category) {
        const baseName = this.sanitizeVariableName(variable.name);
        
        // Add category prefix for better organization
        switch (category) {
            case 'color':
                return `--color-${baseName}`;
            case 'spacing':
                return `--spacing-${baseName}`;
            case 'typography':
                if (this.isFontWeightVariable(variable.name)) {
                    return `--font-weight-${baseName}`;
                } else if (variable.name.toLowerCase().includes('size')) {
                    return `--font-size-${baseName}`;
                } else {
                    return `--typography-${baseName}`;
                }
            case 'other':
                return `--${baseName}`;
            default:
                return `--${baseName}`;
        }
    }

    generateCSSUsageExamples(categorizedVariables) {
        let examples = `/* Usage Examples */\n\n`;
        
        if (categorizedVariables.colors.length > 0) {
            examples += `/* Color Usage */\n`;
            examples += `.button {\n`;
            examples += `  background-color: var(--color-primary);\n`;
            examples += `  color: var(--color-text);\n`;
            examples += `}\n\n`;
        }
        
        if (categorizedVariables.spacing.length > 0) {
            examples += `/* Spacing Usage */\n`;
            examples += `.card {\n`;
            examples += `  padding: var(--spacing-medium);\n`;
            examples += `  margin-bottom: var(--spacing-large);\n`;
            examples += `}\n\n`;
        }
        
        if (categorizedVariables.typography.length > 0) {
            examples += `/* Typography Usage */\n`;
            examples += `.heading {\n`;
            examples += `  font-size: var(--font-size-large);\n`;
            examples += `  font-weight: var(--font-weight-bold);\n`;
            examples += `}\n\n`;
        }
        
        examples += `/* Dark Mode Support */\n`;
        examples += `@media (prefers-color-scheme: dark) {\n`;
        examples += `  :root {\n`;
        examples += `    /* Override colors for dark mode */\n`;
        examples += `    --color-primary: #your-dark-primary;\n`;
        examples += `    --color-text: #your-dark-text;\n`;
        examples += `  }\n`;
        examples += `}\n`;
        
        return examples;
    }

    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    exportCSS() {
        if (!this.apiData) {
            alert('No hay datos para exportar. Primero obtén las variables de Figma.');
            return;
        }

        const { localVariables, localCollections } = this.getLocalVariables();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        
        let cssContent = `/* Figma Variables - CSS Custom Properties */\n/* Generated on: ${new Date().toLocaleString()} */\n/* Total Variables: ${localVariables.length} */\n\n`;
        
        // Generate CSS with :root structure using exact API structure
        cssContent += `:root {\n`;
        
        // Group by collections and modes exactly as they come from the API
        localCollections.forEach(collection => {
            if (!collection.modes) return;
            
            collection.modes.forEach(mode => {
                cssContent += `  /* ${collection.name} - ${mode.name} */\n`;
                
                const collectionVariables = localVariables.filter(variable => 
                    variable.variableCollectionId === collection.id
                );
                
                collectionVariables.forEach(variable => {
                    const resolvedValue = this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId);
                    if (resolvedValue !== undefined) {
                        const cssValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
                        const cssName = `--${this.sanitizeVariableName(variable.name)}`;
                        cssContent += `  ${cssName}: ${cssValue};\n`;
                    }
                });
                cssContent += `\n`;
            });
        });
        
        cssContent += `}\n`;
        
        this.downloadFile(cssContent, `figma-variables-${timestamp}.css`, 'text/css');
    }

    exportSCSS() {
        if (!this.apiData) {
            alert('No hay datos para exportar. Primero obtén las variables de Figma.');
            return;
        }

        const { localVariables, localCollections } = this.getLocalVariables();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        
        let scssContent = `// Figma Variables - SCSS Variables\n// Generated on: ${new Date().toLocaleString()}\n\n`;
        
        // Group by collections and modes
        localCollections.forEach(collection => {
            if (!collection.modes) return;
            
            collection.modes.forEach(mode => {
                const modeName = this.sanitizeVariableName(mode.name);
                scssContent += `// ${collection.name} - ${mode.name}\n`;
                
                const collectionVariables = localVariables.filter(variable => 
                    variable.variableCollectionId === collection.id
                );
                
                collectionVariables.forEach(variable => {
                    const resolvedValue = this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId);
                    if (resolvedValue !== undefined) {
                        const scssValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
                        const scssName = `$${this.sanitizeVariableName(variable.name)}`;
                        scssContent += `${scssName}: ${scssValue};\n`;
                    }
                });
                scssContent += '\n';
            });
        });
        
        this.downloadFile(scssContent, `figma-variables-${timestamp}.scss`, 'text/scss');
    }

    exportXML() {
        if (!this.apiData) {
            alert('No hay datos para exportar. Primero obtén las variables de Figma.');
            return;
        }

        const { localVariables, localCollections } = this.getLocalVariables();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        
        let xmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<!-- Figma Variables - Android Resources -->\n<!-- Generated on: ${new Date().toLocaleString()} -->\n<resources>\n`;
        
        // Group by collections and modes
        localCollections.forEach(collection => {
            if (!collection.modes) return;
            
            collection.modes.forEach(mode => {
                xmlContent += `    <!-- ${collection.name} - ${mode.name} -->\n`;
                
                const collectionVariables = localVariables.filter(variable => 
                    variable.variableCollectionId === collection.id
                );
                
                collectionVariables.forEach(variable => {
                    const resolvedValue = this.resolveVariableValue(variable.valuesByMode[mode.modeId], mode.modeId);
                    if (resolvedValue !== undefined) {
                        const xmlName = this.sanitizeVariableName(variable.name).replace(/-/g, '_');
                        
                        if (variable.resolvedType === 'COLOR') {
                            const colorValue = this.convertValueForCSS(resolvedValue, variable.resolvedType, variable.name);
                            xmlContent += `    <color name="${xmlName}">${colorValue}</color>\n`;
                        } else if (variable.resolvedType === 'FLOAT') {
                            // For font-weight, use string values in XML
                            if (this.isFontWeightVariable(variable.name)) {
                                const fontWeightValue = this.convertFontWeightValue(resolvedValue);
                                xmlContent += `    <string name="${xmlName}">${fontWeightValue}</string>\n`;
                            } 
                            // For opacity values, use fraction format
                            else if (this.isOpacityVariable(variable.name) || (resolvedValue >= 0 && resolvedValue <= 1)) {
                                xmlContent += `    <item name="${xmlName}" format="float" type="dimen">${resolvedValue}</item>\n`;
                            }
                            // For line-height values without units
                            else if (this.isLineHeightVariable(variable.name) && resolvedValue > 1 && resolvedValue < 3) {
                                xmlContent += `    <item name="${xmlName}" format="float" type="dimen">${resolvedValue}</item>\n`;
                            }
                            // For font sizes, use sp (scalable pixels)
                            else if (this.isFontVariable(variable.name) && variable.name.toLowerCase().includes('size')) {
                                xmlContent += `    <dimen name="${xmlName}">${resolvedValue}sp</dimen>\n`;
                            }
                            // For other dimensional values, use dp
                            else {
                                xmlContent += `    <dimen name="${xmlName}">${resolvedValue}dp</dimen>\n`;
                            }
                        } else if (variable.resolvedType === 'STRING') {
                            xmlContent += `    <string name="${xmlName}">${resolvedValue}</string>\n`;
                        }
                    }
                });
                xmlContent += '\n';
            });
        });
        
        xmlContent += '</resources>';
        this.downloadFile(xmlContent, `figma-variables-${timestamp}.xml`, 'application/xml');
    }



    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new FigmaVariablesUI();
});