export const formatCurrency = (amount: number, options?: Intl.NumberFormatOptions) => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  };

  if (options && options.maximumFractionDigits !== undefined) {
    if (options.minimumFractionDigits === undefined) {
      defaultOptions.minimumFractionDigits = Math.min(2, options.maximumFractionDigits);
    }
  }

  return new Intl.NumberFormat('en-LK', {
    ...defaultOptions,
    ...options,
  }).format(amount);
};
