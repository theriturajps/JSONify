
const fileUploadArea = document.getElementById('file-upload-area');
const fileInput = document.getElementById('file-input');
const progressBar = document.getElementById('progress-bar');
const statusMessage = document.getElementById('status-message');
const downloadBtn = document.getElementById('download-btn');
const previewBtn = document.getElementById('preview-btn');
const previewSection = document.getElementById('preview-section');
const previewContent = document.getElementById('preview-content');
const delimiterSelect = document.getElementById('delimiter-select');
const encodingSelect = document.getElementById('encoding-select');
const size = document.getElementById('size');

// File size limit (55MB in bytes)
const MAX_FILE_SIZE = 53 * 1024 * 1024; // 13 * 1024 * 1024 bytes = 55MB

size.insertAdjacentText('beforeend', Math.trunc(MAX_FILE_SIZE / 1000000))

let jsonData = [];
let totalRows = 0;

// Drag and Drop Event Handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
	fileUploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
	e.preventDefault();
	e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
	fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.add('drag-over'), false);
});

['dragleave', 'drop'].forEach(eventName => {
	fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.remove('drag-over'), false);
});

fileUploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);
fileUploadArea.addEventListener('drop', handleDrop);

downloadBtn.addEventListener('click', downloadJSON);
previewBtn.addEventListener('click', togglePreview);

function handleDrop(e) {
	const dt = e.dataTransfer;
	const files = dt.files;
	handleFileUpload({ target: { files } });
}

function handleFileUpload(event) {
	// Reset previous state
	jsonData = [];
	totalRows = 0;
	progressBar.style.width = '0%';
	statusMessage.textContent = '';
	downloadBtn.style.display = 'none';
	previewBtn.style.display = 'none';
	previewSection.style.display = 'none';

	const files = Array.from(event.target.files).filter(file =>
		file.name.toLowerCase().endsWith('.csv')
	);

	if (files.length === 0) {
		statusMessage.textContent = 'No CSV files selected.';
		return;
	}

	// Check file size
	const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
	if (oversizedFiles.length > 0) {
		statusMessage.textContent = `Error: File(s) exceed 55MB limit. Maximum file size is 55MB.`;
		return;
	}

	statusMessage.textContent = `Processing ${files.length} file(s)...`;

	files.forEach(file => {
		Papa.parse(file, {
			encoding: encodingSelect.value,
			delimiter: delimiterSelect.value,
			header: true,
			skipEmptyLines: true,
			chunk: function (results, parser) {
				parser.pause();
				jsonData.push(...results.data);
				totalRows += results.data.length;
				updateProgress(totalRows);
				parser.resume();
			},
			complete: function () {
				statusMessage.textContent = `Converted ${totalRows} rows successfully`;
				downloadBtn.style.display = 'inline-block';
				previewBtn.style.display = 'inline-block';
			},
			error: function (error) {
				statusMessage.textContent = `Error: ${error.message}`;
			}
		});
	});
}

function updateProgress(processedRows) {
	const progress = Math.min((processedRows / 10000) * 100, 100);
	progressBar.style.width = `${progress}%`;
}

function downloadJSON() {
	const jsonString = JSON.stringify(jsonData, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	saveAs(blob, `dataforge_${new Date().toISOString().replace(/:/g, '-')}.json`);
}

function togglePreview() {
	if (previewSection.style.display === 'none') {
		const previewData = jsonData.slice(0, 20);
		previewContent.textContent = JSON.stringify(previewData, null, 2);
		previewSection.style.display = 'block';
		previewBtn.textContent = 'Hide Preview';
	} else {
		previewSection.style.display = 'none';
		previewBtn.textContent = 'Preview';
	}
}
