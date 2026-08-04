export const redeCombustiveis = {
  title: "Rede Combustíveis",
  rb: 13020.32,
  metrics: [
    { label: "M/LT", value: "R$ 0,66" },
    { label: "LB", value: "11%" },
    { label: "TMC", value: "R$ 116,16" },
    { label: "TMV", value: "21,42 L" },
  ],
  note: "Dados consolidados de toda a rede de postos",
};

export const redeProdutos = {
  title: "Rede Produtos",
  rb: 561,
  metrics: [
    { label: "TMP", value: "R$ 0,82" },
    { label: "LB", value: "71%" },
  ],
  note: "Dados de produtos vendidos na rede",
};

export type Slice = {
  name: string;
  value: number;
  primaryLabel: string;
  primaryValue: string;
  lb: string;
  rb: string;
};

export const combustiveis: Slice[] = [
  { name: "Gasolina Comum", value: 5, primaryLabel: "M/LT", primaryValue: "R$ 0,3149", lb: "5%", rb: "R$ 5,00" },
  { name: "Gasolina Aditivada", value: 7, primaryLabel: "M/LT", primaryValue: "R$ 0,22", lb: "6%", rb: "R$ 7,00" },
  { name: "Óleo Diesel S500", value: 11, primaryLabel: "M/LT", primaryValue: "R$ 0,48", lb: "9%", rb: "R$ 11,00" },
  { name: "Óleo Diesel Comum", value: 16, primaryLabel: "M/LT", primaryValue: "R$ 0,57", lb: "11%", rb: "R$ 16,00" },
  { name: "Etanol Hidratado", value: 3, primaryLabel: "M/LT", primaryValue: "R$ 0,66", lb: "4%", rb: "R$ 3,00" },
];

export const produtos: Slice[] = [
  { name: "Aditivo Automóveis", value: 26.05, primaryLabel: "TMP", primaryValue: "R$ 0,57", lb: "48%", rb: "R$ 26,05" },
  { name: "Lubrificantes Automóveis", value: 55.15, primaryLabel: "TMP", primaryValue: "R$ 0,49", lb: "57%", rb: "R$ 55,15" },
  { name: "Aditivo Caminhões/Ônibus/Vans", value: 28.13, primaryLabel: "TMP", primaryValue: "R$ 0,88", lb: "44%", rb: "R$ 28,13" },
  { name: "Lubrificantes Caminhões/Ônibus/Vans", value: 88.12, primaryLabel: "TMP", primaryValue: "R$ 0,73", lb: "90%", rb: "R$ 88,12" },
  { name: "Não encontrado", value: 76.14, primaryLabel: "TMP", primaryValue: "R$ 0,92", lb: "76%", rb: "R$ 76,14" },
];

export const sliceColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
