import type { DataTableColumn } from "./dataTable.types";

export function normalizeDataTableValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function compareDataTableValues(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

function escapeSpreadsheetValue(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportDataTableToExcel<TItem, TKey extends string>(
  items: TItem[],
  columns: DataTableColumn<TItem, TKey>[],
  fileName: string,
) {
  const rows = items.map((item) =>
    columns.map((column) => escapeSpreadsheetValue(column.getValue(item))),
  );
  const table = `
    <table>
      <thead>
        <tr>${columns
          .map((column) => `<th>${escapeSpreadsheetValue(column.label)}</th>`)
          .join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
  const blob = new Blob([`\uFEFF${table}`], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
