import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { readSheet } from 'src/helpers/excelHelper';
import {
	analyzeSupplierRows,
	ReadinessReport
} from 'src/integrations/marketplace/readiness';
import { loadColorMap, loadSizeMap } from 'src/product-article/supplier-format';

/**
 * Насколько выгрузка поставщика готова к Яндекс Маркету и Яндекс Доставке.
 *   npm run audit:marketplace                       — temp-dev/shel_data_new.xlsx
 *   npm run audit:marketplace -- <файл.xlsx> [--check-images 30] [--json отчёт.json]
 */
async function main() {
	const args = process.argv.slice(2);
	const file = path.resolve(
		args.find((a) => a.endsWith('.xlsx')) ??
			path.join(process.cwd(), '..', 'temp-dev', 'shel_data_new.xlsx')
	);
	const imagesToCheck = Number(valueOf(args, '--check-images') ?? 0);
	const jsonOut = valueOf(args, '--json');

	const rows = await readSheet(file);
	const header = rows[0]?.map(String) ?? [];
	const body = Number.isNaN(Number(rows[0]?.[7])) ? rows.slice(1) : rows;

	const report = analyzeSupplierRows(body, await loadColorMap(), await loadSizeMap());
	print(file, header, report);

	if (imagesToCheck > 0) {
		await checkImages(body, imagesToCheck);
	}
	if (jsonOut) {
		fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));
		console.log(`\nОтчёт: ${path.resolve(jsonOut)}`);
	}
}

function valueOf(args: string[], flag: string) {
	const i = args.indexOf(flag);
	return i === -1 ? undefined : args[i + 1];
}

const pct = (part: number, total: number) =>
	total ? `${((part / total) * 100).toFixed(1)}%` : '—';

function print(file: string, header: string[], r: ReadinessReport) {
	console.log(`Файл: ${path.basename(file)}`);
	console.log(
		`Колонок: ${header.length}; вес/габариты в заголовке: ${
			header.some((h) => /вес|габарит|длина|ширина|высота/i.test(h))
				? 'есть'
				: 'нет'
		}`
	);
	console.log(
		`Вариантов (строк): ${r.rows}, артикулов: ${r.articles}, пар категория/тип: ${r.categories.length}`
	);
	console.log(
		`\nГотово для Маркета: ${r.readyForMarket.rows} строк (${pct(r.readyForMarket.rows, r.rows)}), ` +
			`${r.readyForMarket.articles} артикулов целиком (${pct(r.readyForMarket.articles, r.articles)})`
	);
	console.log(`Готово для Доставки (вес и габариты): ${r.readyForDelivery.rows} строк`);

	for (const scope of ['market', 'delivery'] as const) {
		console.log(`\n${scope === 'market' ? 'Яндекс Маркет' : 'Яндекс Доставка'}:`);
		for (const c of r.checks.filter((check) => check.scope === scope)) {
			const mark = c.failed === 0 ? 'OK ' : c.required ? 'ERR' : 'WRN';
			console.log(
				`  ${mark} ${c.title.padEnd(52)} не проходят: ${String(c.failed).padStart(6)} (${pct(c.failed, r.rows)})` +
					(c.failed ? `  напр.: ${c.examples.slice(0, 2).join(', ')}` : '')
			);
		}
	}

	console.log(
		`\nОстаток «>N» (точное количество неизвестно): ${r.stockOnlyAtLeast} строк`
	);
	console.log(
		`Фото на артикул: мин ${r.picturesPerArticle.min}, медиана ${r.picturesPerArticle.median}, макс ${r.picturesPerArticle.max}`
	);
	const list = (items: [string, number][]) =>
		items
			.slice(0, 12)
			.map(([k, n]) => `${k || '(пусто)'}×${n}`)
			.join(', ');
	if (r.unmappedSizes.length)
		console.log(`Несопоставленные размеры: ${list(r.unmappedSizes)}`);
	if (r.unmappedColors.length)
		console.log(`Несопоставленные цвета: ${list(r.unmappedColors)}`);
	console.log(`\nКатегории (нужно сопоставить с листовыми категориями Маркета):`);
	r.categories
		.slice(0, 15)
		.forEach((c) => console.log(`  ${c.category} / ${c.subcategory}: ${c.rows}`));
	if (r.categories.length > 15) console.log(`  … и ещё ${r.categories.length - 15}`);
}

// Выборочно проверяем, что ссылки на фото живые (Маркет требует постоянные ссылки)
async function checkImages(rows: unknown[][], count: number) {
	const urls = [
		...new Set(
			rows.flatMap((row) =>
				String(row[15] ?? '')
					.split(';')
					.map((u) => u.trim())
					.filter(Boolean)
			)
		)
	];
	const sample = urls.sort(() => Math.random() - 0.5).slice(0, count);
	let ok = 0;
	const broken: string[] = [];
	for (const url of sample) {
		try {
			const res = await fetch(url, {
				method: 'HEAD',
				signal: AbortSignal.timeout(10_000)
			});
			const isImage = (res.headers.get('content-type') ?? '').startsWith('image/');
			if (res.ok && isImage) ok++;
			else broken.push(`${res.status} ${url}`);
		} catch (error) {
			broken.push(`${(error as Error).name} ${url}`);
		}
	}
	console.log(
		`\nФото: проверено ${sample.length} из ${urls.length} уникальных ссылок, доступны ${ok}`
	);
	broken.slice(0, 5).forEach((b) => console.log(`  недоступно: ${b}`));
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
