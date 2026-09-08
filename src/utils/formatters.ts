/**
 * Formatadores padronizados para o padrão brasileiro (R$, números e datas)
 */

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatPercent = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }
  return `${value}%`;
};
