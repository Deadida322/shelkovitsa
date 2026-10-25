import yazl from 'yazl';

// Сборка .xlsx из XML-частей — для раскладок и форматов, которые exceljs не пишет
// (так сохраняет Excel, LibreOffice, 1С; битые и вредоносные файлы)

export const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
export const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

// Части пишутся в заданном порядке — порядок в архиве важен для потоковых ридеров
export function rawXlsx(parts: [string, string | Buffer][]): Promise<Buffer> {
	const zip = new yazl.ZipFile();
	for (const [name, content] of parts) {
		zip.addBuffer(Buffer.isBuffer(content) ? content : Buffer.from(content), name);
	}
	zip.end();
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		zip.outputStream.on('data', (chunk: Buffer) => chunks.push(chunk));
		zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)));
		zip.outputStream.on('error', reject);
	});
}

export function workbookRels(
	sheets: { id: string; target: string }[],
	sharedStrings: string | null = 'sharedStrings.xml'
) {
	return (
		`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
		sheets
			.map(
				(s) =>
					`<Relationship Id="${s.id}" Type="${REL}/worksheet" Target="${s.target}"/>`
			)
			.join('') +
		(sharedStrings
			? `<Relationship Id="rIdSst" Type="${REL}/sharedStrings" Target="${sharedStrings}"/>`
			: '') +
		`</Relationships>`
	);
}

// Листы в порядке книги: первый в списке — первый лист в Excel
export function workbookXml(sheets: { name: string; id: string }[], prefix = 'x') {
	const p = prefix ? `${prefix}:` : '';
	const ns = prefix ? `xmlns:${prefix}` : 'xmlns';
	return (
		`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<${p}workbook ${ns}="${MAIN}" xmlns:r="${REL}"><${p}sheets>` +
		sheets
			.map(
				(s, i) =>
					`<${p}sheet name="${s.name}" sheetId="${i + 1}" r:id="${s.id}"/>`
			)
			.join('') +
		`</${p}sheets></${p}workbook>`
	);
}

export function sheetXml(rows: string, prefix = '') {
	const p = prefix ? `${prefix}:` : '';
	const ns = prefix ? `xmlns:${prefix}` : 'xmlns';
	return (
		`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<${p}worksheet ${ns}="${MAIN}"><${p}sheetData>${rows}</${p}sheetData></${p}worksheet>`
	);
}

export function sharedStringsXml(strings: string[]) {
	return (
		`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<sst xmlns="${MAIN}" count="${strings.length}" uniqueCount="${strings.length}">` +
		strings
			.map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`)
			.join('') +
		`</sst>`
	);
}

export function escapeXml(text: string) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// «B» + 3 → «B3»; индекс колонки с 0
export function cellRef(column: number, row: number) {
	let name = '';
	for (let n = column + 1; n > 0; n = Math.floor((n - 1) / 26)) {
		name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
	}
	return `${name}${row}`;
}

/**
 * Книга в раскладке Excel: листы раньше sharedStrings, workbook.xml в конце архива.
 * Строки — общие строки (t="s"), числа — <v>. Пустые ячейки не пишутся.
 */
export function excelLikeXlsx(rows: unknown[][]): Promise<Buffer> {
	const strings: string[] = [];
	const index = new Map<string, number>();
	const body = rows
		.map((row, r) => {
			const cells = row
				.map((value, c) => {
					if (value === null || value === undefined || value === '') return '';
					const ref = cellRef(c, r + 1);
					if (typeof value === 'number')
						return `<c r="${ref}"><v>${value}</v></c>`;
					if (typeof value === 'boolean')
						return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
					const text = String(value);
					if (!index.has(text)) {
						index.set(text, strings.length);
						strings.push(text);
					}
					return `<c r="${ref}" t="s"><v>${index.get(text)}</v></c>`;
				})
				.join('');
			return cells ? `<row r="${r + 1}">${cells}</row>` : '';
		})
		.join('');

	return rawXlsx([
		[
			'[Content_Types].xml',
			'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'
		],
		[
			'xl/_rels/workbook.xml.rels',
			workbookRels([{ id: 'rId1', target: 'worksheets/sheet1.xml' }])
		],
		['xl/worksheets/sheet1.xml', sheetXml(body)],
		['xl/sharedStrings.xml', sharedStringsXml(strings)],
		['xl/workbook.xml', workbookXml([{ name: 'Лист1', id: 'rId1' }], '')]
	]);
}
