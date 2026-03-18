import * as ExcelJS from 'exceljs';
import path from 'path';
import { logger } from '../config/logger';
import { NumberResult } from '../types';

// ─── Leitura do Excel ─────────────────────────────────────────────────────────

/**
 * Lê um arquivo Excel e extrai números de telefone da primeira coluna (coluna A).
 *
 * Regras:
 * - Linhas de cabeçalho são ignoradas automaticamente (detectadas por conteúdo não-numérico)
 * - Números são normalizados: apenas dígitos, sem +, espaços ou traços
 * - Números com comprimento inválido (< 8 ou > 15 dígitos) são ignorados com aviso
 */
export async function parseExcel(filePath: string): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('O arquivo Excel não contém nenhuma planilha.');
  }

  const phones: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(1).value;
    if (cellValue === null || cellValue === undefined) return;

    const raw = String(cellValue).trim();

    // Pula células vazias
    if (!raw) return;

    // Detecta linha de cabeçalho: contém letras que sugerem título
    const headerKeywords = ['numero', 'número', 'phone', 'whatsapp', 'celular', 'telefone', 'contato'];
    const lowerRaw = raw.toLowerCase();
    if (headerKeywords.some((kw) => lowerRaw.includes(kw))) {
      logger.debug({ rowNumber, value: raw }, 'Linha de cabeçalho ignorada');
      return;
    }

    // Normaliza: remove tudo que não é dígito (exceto + inicial que é removido também)
    const normalized = raw.replace(/[^\d]/g, '');

    if (normalized.length >= 8 && normalized.length <= 15) {
      phones.push(normalized);
    } else {
      logger.warn({ rowNumber, value: raw, normalized }, 'Número com comprimento inválido ignorado');
    }
  });

  logger.info({ count: phones.length, file: path.basename(filePath) }, 'Números extraídos do Excel');
  return phones;
}

// ─── Geração do Relatório Excel ───────────────────────────────────────────────

/**
 * Gera um buffer de arquivo Excel com três abas:
 * 1. "Válidos no WhatsApp" — números que existem
 * 2. "Não Encontrados"     — números que não existem
 * 3. "Resumo"              — contagens e data do relatório
 */
export async function generateExcel(
  valid: NumberResult[],
  invalid: NumberResult[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WhatsApp Validator';
  workbook.created = new Date();

  // ── Aba: Válidos ─────────────────────────────────────────────────────────────
  const validSheet = workbook.addWorksheet('Válidos no WhatsApp');
  validSheet.columns = [
    { header: 'Número', key: 'phone', width: 22 },
    { header: 'Status', key: 'status', width: 28 },
  ];
  styleHeaderRow(validSheet, 'FF25D366'); // Verde WhatsApp
  valid.forEach((r) => validSheet.addRow({ phone: r.phone, status: '✓ Existe no WhatsApp' }));

  // ── Aba: Inválidos ────────────────────────────────────────────────────────────
  const invalidSheet = workbook.addWorksheet('Não Encontrados');
  invalidSheet.columns = [
    { header: 'Número', key: 'phone', width: 22 },
    { header: 'Status', key: 'status', width: 30 },
    { header: 'Observação', key: 'note', width: 35 },
  ];
  styleHeaderRow(invalidSheet, 'FFFF4D4D'); // Vermelho
  invalid.forEach((r) =>
    invalidSheet.addRow({
      phone: r.phone,
      status: '✗ Não encontrado',
      note: r.error ?? 'Número não registrado no WhatsApp',
    }),
  );

  // ── Aba: Resumo ───────────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Resumo');
  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 20;

  const rows = [
    ['Relatório de Validação WhatsApp', ''],
    ['', ''],
    ['Total de Números Processados', valid.length + invalid.length],
    ['✓ Existem no WhatsApp', valid.length],
    ['✗ Não Encontrados', invalid.length],
    ['', ''],
    ['Data de Geração', new Date().toLocaleString('pt-BR')],
  ];

  rows.forEach((r, i) => {
    const row = summarySheet.addRow(r);
    if (i === 0) {
      row.getCell(1).font = { bold: true, size: 14 };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Aplica estilo de cabeçalho negrito + cor de fundo em todas as células da linha 1 */
function styleHeaderRow(worksheet: ExcelJS.Worksheet, argbColor: string): void {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: argbColor },
    } as ExcelJS.Fill;
    cell.alignment = { horizontal: 'center' };
  });
  headerRow.commit();
}

// ─── Geração do Relatório CSV ─────────────────────────────────────────────────

/**
 * Gera uma string CSV com todos os resultados (válidos + inválidos).
 * Inclui BOM UTF-8 para abertura correta no Excel do Windows.
 */
export function generateCSV(valid: NumberResult[], invalid: NumberResult[]): string {
  const lines: string[] = ['numero,existe_no_whatsapp,status,observacao'];

  valid.forEach((r) => lines.push(`${r.phone},true,Existe no WhatsApp,`));
  invalid.forEach((r) => {
    const note = (r.error ?? 'Não registrado').replace(/,/g, ';');
    lines.push(`${r.phone},false,Não encontrado,${note}`);
  });

  // \uFEFF = BOM UTF-8 para compatibilidade com Excel no Windows
  return '\uFEFF' + lines.join('\n');
}
