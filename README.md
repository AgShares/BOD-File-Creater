# Excel Sheet Processor

A modern, web-based Excel file processor with an attractive UI that automatically generates CSV files from Excel sheets based on specific processing logic.

## Features

- **Modern UI**: Clean, responsive design with light/dark mode support
- **Drag & Drop**: Intuitive file upload with drag-and-drop functionality
- **Progress Tracking**: Real-time progress indicators for each processing step
- **Automatic Processing**: Processes Excel files according to predefined logic
- **Multiple Outputs**: Generates 3 different CSV files from the input Excel file

## Requirements

### Input File
- Excel file (.xlsx or .xls format)
- Must contain the following sheets:
  - `NetPosition`
  - `NerveFInal`
  - `CombineNerve`

### Output Files
The application generates three CSV files:
1. **netposition.csv** - Complete NetPosition sheet data
2. **sampleClientmaster.csv** - Processed NerveFInal data (Parts A, B, C combined)
3. **MTD.csv** - CombineNerve data with underscores replaced by double spaces

## Processing Logic

### Step 1: NetPosition Sheet
- Copies entire content of NetPosition sheet
- Saves as `netposition.csv`

### Step 2: NerveFInal Sheet
Creates a combined file with three parts:
- **Part A**: Columns A to N (complete rows)
- **Part B**: Columns O to AB (from row 2 onwards, values only)
- **Part C**: Columns AC to AP (from row 2 onwards, values only)
- Saves as `sampleClientmaster.csv`

### Step 3: CombineNerve Sheet
- Copies entire content of CombineNerve sheet
- Replaces all underscores (_) with double spaces
- Saves as `MTD.csv`

## How to Use

1. **Upload File**: Drag and drop or browse to select your Excel file
2. **Validate**: The application automatically validates required sheets
3. **Process**: Click "Process File" to start automatic processing
4. **Download**: Download the generated CSV files individually

## Technical Details

- Built with HTML5, CSS3, and JavaScript
- Uses SheetJS library for Excel file processing
- Responsive design works on desktop and mobile
- Client-side processing (no server required)
- Modern browser support required

## Setup

1. Download all files to a folder
2. Open `index.html` in a modern web browser
3. No additional setup or server required

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## File Structure

```
BOD FILE GENERATOR/
├── index.html          # Main HTML file
├── style.css           # Styling and themes
├── script.js           # Processing logic
└── README.md          # This documentation
```

## License

This project is created for internal use. All rights reserved.

## Support

For issues or questions, please contact the development team.
