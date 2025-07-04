class ExcelProcessor {
    constructor() {
        this.workbook = null;
        this.processedFiles = {
            netPosition: null,
            sampleClientmaster: null,
            mtd: null
        };
        this.initializeEventListeners();
        this.initializeTheme();
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const processBtn = document.getElementById('processBtn');
        const clearBtn = document.getElementById('clearBtn');
        const themeToggle = document.getElementById('themeToggle');
        const processAnotherBtn = document.getElementById('processAnotherBtn');

        // File input events
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Button events
        processBtn.addEventListener('click', () => this.processFile());
        clearBtn.addEventListener('click', () => this.clearFile());
        themeToggle.addEventListener('click', () => this.toggleTheme());
        processAnotherBtn.addEventListener('click', () => this.resetProcessor());

        // Download button events
        document.getElementById('downloadNetPosition').addEventListener('click', () => this.downloadFile('netPosition'));
        document.getElementById('downloadSampleClient').addEventListener('click', () => this.downloadFile('sampleClientmaster'));
        document.getElementById('downloadMTD').addEventListener('click', () => this.downloadFile('mtd'));

        // Browse link
        document.querySelector('.browse-link').addEventListener('click', () => fileInput.click());
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect({ target: { files: files } });
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
            this.showError('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }

        // Display file info
        this.displayFileInfo(file);
        
        // Read the file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.workbook = XLSX.read(e.target.result, { type: 'binary' });
                this.validateRequiredSheets();
                document.getElementById('processBtn').disabled = false;
            } catch (error) {
                this.showError('Error reading Excel file: ' + error.message);
            }
        };
        reader.readAsBinaryString(file);
    }

    displayFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileInfoSection').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    validateRequiredSheets() {
        const requiredSheets = ['NetPosition', 'NerveFInal', 'CombineNerve'];
        const availableSheets = this.workbook.SheetNames;
        
        const missingSheets = requiredSheets.filter(sheet => !availableSheets.includes(sheet));
        
        if (missingSheets.length > 0) {
            this.showError(`Missing required sheets: ${missingSheets.join(', ')}`);
            document.getElementById('processBtn').disabled = true;
            return false;
        }
        
        return true;
    }

    async processFile() {
        if (!this.workbook) {
            this.showError('No file loaded');
            return;
        }

        // Show processing section
        document.getElementById('fileInfoSection').style.display = 'none';
        document.getElementById('processingSection').style.display = 'block';

        try {
            // Process each sheet with progress updates
            await this.processWithProgress();
            
            // Show results section
            document.getElementById('processingSection').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'block';
        } catch (error) {
            this.showError('Error processing file: ' + error.message);
            this.resetToFileInfo();
        }
    }

    async processWithProgress() {
        const steps = [
            { id: 'step1', progress: 33, process: () => this.processNetPosition() },
            { id: 'step2', progress: 66, process: () => this.processNerveFinal() },
            { id: 'step3', progress: 100, process: () => this.processCombineNerve() }
        ];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // Update step status
            document.getElementById(step.id).classList.add('active');
            
            // Process the step
            await step.process();
            
            // Update progress
            this.updateProgress(step.progress);
            
            // Complete step
            document.getElementById(step.id).classList.remove('active');
            document.getElementById(step.id).classList.add('completed');
            
            // Add delay for visual feedback
            await this.delay(500);
        }
    }

    updateProgress(percentage) {
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = percentage + '%';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    processNetPosition() {
        const sheet = this.workbook.Sheets['NetPosition'];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const data = [];
        
        // Process NetPosition with proper numeric formatting and handle zero values
        for (let row = range.s.r; row <= range.e.r; row++) {
            const rowData = [];
            
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = sheet[cellAddress];
                
                if (cell) {
                    let value = cell.v;
                    
                    // Always preserve zero values as "0" (no empty cells for zeros anywhere)
                    if (typeof value === 'number' && value === 0) {
                        value = '0'; // Always output zero as "0"
                    } else if (typeof value === 'number') {
                        // For the last column, ensure numeric formatting
                        if (col === range.e.c) {
                            // Last column - format as number
                            if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.0001) {
                                value = Math.round(value).toString();
                            } else {
                                value = value.toString();
                            }
                        } else {
                            // Other numeric columns - preserve format
                            if (Math.abs(value) >= 1e10) {
                                value = value.toFixed(0);
                            } else if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.0001) {
                                value = Math.round(value).toString();
                            } else {
                                value = value.toString();
                            }
                        }
                    } else if (value === null || value === undefined) {
                        value = ''; // Handle null/undefined as empty
                    }
                    
                    rowData.push(value);
                } else {
                    rowData.push(''); // Empty cell
                }
            }
            
            // Always add the row (don't skip entire rows)
            data.push(rowData);
        }
        
        // Convert to CSV
        this.processedFiles.netPosition = this.arrayToCSV(data);
    }

    processNerveFinal() {
        const sheet = this.workbook.Sheets['NerveFInal'];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        
        let combinedData = [];
        
        // Part A: Columns A to N (0 to 13) - copy as text/values only based on column A (with number formatting)
        const partA = this.extractSheetDataBasedOnColumn(sheet, range, 0, 13, 0, 0); // Column A (index 0)
        combinedData = combinedData.concat(partA);
        
        // Part B: Columns O to AB (14 to 27) - from row 2 onwards, values only, based on column O (raw values)
        const partB = this.extractSheetDataRaw(sheet, range, 14, 27, 1, 14); // Column O (index 14)
        combinedData = combinedData.concat(partB);
        
        // Part C: Columns AC to AP (28 to 41) - from row 2 onwards, values only, based on column AC (raw values)
        const partC = this.extractSheetDataRaw(sheet, range, 28, 41, 1, 28); // Column AC (index 28)
        combinedData = combinedData.concat(partC);
        
        // Convert to CSV
        this.processedFiles.sampleClientmaster = this.arrayToCSV(combinedData);
    }

    extractSheetDataBasedOnColumn(sheet, range, startCol, endCol, startRow, referenceCol) {
        const data = [];
        
        // First, find the last row that has data in the reference column
        let lastRowWithData = startRow - 1;
        for (let row = startRow; row <= range.e.r; row++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: referenceCol });
            const cell = sheet[cellAddress];
            // Check if cell has actual data (not empty, not null, not undefined, not just whitespace)
            if (cell && cell.v !== '' && cell.v !== null && cell.v !== undefined) {
                const cellValue = String(cell.v).trim();
                if (cellValue !== '') {
                    lastRowWithData = row;
                }
            }
        }
        
        // Extract data only up to the last row with data in reference column
        for (let row = startRow; row <= lastRowWithData; row++) {
            const rowData = [];
            
            for (let col = startCol; col <= endCol; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = sheet[cellAddress];
                
                if (cell) {
                    // Try to get the raw value first, then formatted value, then computed value
                    let value = cell.w || cell.v || '';
                    
                    // If the raw value is a number in scientific notation, convert it properly
                    if (typeof value === 'string' && value.includes('E')) {
                        // Try to parse as number and convert to fixed notation
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                            value = num.toFixed(0);
                        }
                    } else if (typeof value === 'number') {
                        // If it's a number, format it properly
                        if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.0001) {
                            value = Math.round(value).toString();
                        } else {
                            value = value.toString();
                        }
                    }
                    
                    rowData.push(value);
                } else {
                    rowData.push('');
                }
            }
            
            data.push(rowData);
        }
        
        return data;
    }

    extractSheetDataRaw(sheet, range, startCol, endCol, startRow, referenceCol) {
        const data = [];
        
        // First, find the last row that has data in the reference column
        let lastRowWithData = startRow - 1;
        for (let row = startRow; row <= range.e.r; row++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: referenceCol });
            const cell = sheet[cellAddress];
            // Check if cell has actual data (not empty, not null, not undefined, not just whitespace)
            if (cell && cell.v !== '' && cell.v !== null && cell.v !== undefined) {
                const cellValue = String(cell.v).trim();
                if (cellValue !== '') {
                    lastRowWithData = row;
                }
            }
        }
        
        // Extract data only up to the last row with data in reference column
        for (let row = startRow; row <= lastRowWithData; row++) {
            const rowData = [];
            
            for (let col = startCol; col <= endCol; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = sheet[cellAddress];
                
                // For Parts B and C, just get the raw value without any formatting
                const value = cell ? cell.v : '';
                rowData.push(value);
            }
            
            data.push(rowData);
        }
        
        return data;
    }

    convertToValuesOnly(data) {
        // Convert all data to values only (remove any formulas, keep only computed values)
        return data.map(row => 
            row.map(cell => {
                // If it's a formula result, return the computed value
                // If it's already a value, return as is
                if (cell === null || cell === undefined) {
                    return '';
                }
                
                // Handle different data types and ensure we get the actual value
                if (typeof cell === 'object' && cell.hasOwnProperty('v')) {
                    // If it's an Excel cell object, extract the value
                    return this.formatCellValue(cell.v);
                } else if (typeof cell === 'number') {
                    // Handle numbers specially to avoid scientific notation
                    return this.formatCellValue(cell);
                } else if (typeof cell === 'boolean') {
                    // Convert booleans to strings
                    return String(cell);
                } else if (typeof cell === 'string') {
                    // Return string as is
                    return cell;
                } else {
                    // For any other type, convert to string
                    return String(cell);
                }
            })
        );
    }

    formatCellValue(value) {
        // Handle numerical values to preserve integers and avoid scientific notation
        if (typeof value === 'number') {
            // For large numbers, convert to fixed notation to avoid scientific notation
            if (Math.abs(value) >= 1e10) {
                // Large numbers - format as fixed notation
                return value.toFixed(0);
            } else if (Number.isInteger(value)) {
                // Regular integers
                return value.toString();
            } else {
                // For decimals, check if it's very close to an integer
                const rounded = Math.round(value);
                if (Math.abs(value - rounded) < 0.0001) {
                    // If very close to integer, return as integer
                    return rounded.toString();
                } else {
                    // Return as decimal but with limited precision
                    return value.toFixed(10).replace(/\.?0+$/, '');
                }
            }
        } else if (typeof value === 'string') {
            // If it's already a string, check if it's a number in scientific notation
            if (value.includes('E') || value.includes('e')) {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    // Convert scientific notation to fixed notation
                    return num.toFixed(0);
                }
            }
            return value;
        }
        
        // For non-numbers, return as string
        return String(value);
    }

    arrayToCSV(data) {
        return data.map(row => 
            row.map(cell => {
                const value = cell === null || cell === undefined ? '' : String(cell);
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            }).join(',')
        ).join('\n');
    }

    processCombineNerve() {
        const sheet = this.workbook.Sheets['CombineNerve'];
        let csvData = XLSX.utils.sheet_to_csv(sheet);
        
        // Replace all underscores with double spaces
        csvData = csvData.replace(/_/g, '  ');
        
        this.processedFiles.mtd = csvData;
    }

    downloadFile(fileType) {
        const fileData = this.processedFiles[fileType];
        if (!fileData) {
            this.showError('File not processed yet');
            return;
        }

        const fileNames = {
            netPosition: 'netposition.csv',
            sampleClientmaster: 'sampleClientmaster.csv',
            mtd: 'MTD.csv'
        };

        const blob = new Blob([fileData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileNames[fileType]);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    clearFile() {
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfoSection').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('processBtn').disabled = true;
        this.workbook = null;
        this.processedFiles = {
            netPosition: null,
            sampleClientmaster: null,
            mtd: null
        };
    }

    resetProcessor() {
        this.clearFile();
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('processingSection').style.display = 'none';
        
        // Reset progress
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = '0%';
        
        // Reset steps
        ['step1', 'step2', 'step3'].forEach(stepId => {
            const step = document.getElementById(stepId);
            step.classList.remove('active', 'completed');
        });
    }

    resetToFileInfo() {
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('fileInfoSection').style.display = 'block';
    }

    showError(message) {
        alert(message); // Simple error handling - could be enhanced with a modal
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ExcelProcessor();
});

// Add some helper functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add loading animation for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
    });
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals or reset to initial state
            const processor = window.excelProcessor;
            if (processor && document.getElementById('resultsSection').style.display === 'block') {
                processor.resetProcessor();
            }
        }
    });
});

// Export for global access
window.ExcelProcessor = ExcelProcessor;
