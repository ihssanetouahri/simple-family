/** Données visuelles fictives, déconnectées de tout compte réel. */
export type DemoTransaction = {
  id: string;
  merchant: string;
  category: 'Courses' | 'Shopping' | 'Factures' | 'Transport';
  date: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
};
export const demoBalance = 43109.0;
export const demoTransactions: DemoTransaction[] = [
  { id: '1', merchant: 'Marjane', category: 'Courses', date: '21 oct.', amount: 284.50, type: 'EXPENSE' },
  { id: '2', merchant: 'Zara', category: 'Shopping', date: '20 oct.', amount: 459, type: 'EXPENSE' },
  { id: '3', merchant: 'Orange Maroc', category: 'Factures', date: '18 oct.', amount: 199, type: 'EXPENSE' },
  { id: '4', merchant: 'Casa Tramway', category: 'Transport', date: '17 oct.', amount: 60, type: 'EXPENSE' },
];
export const formatDH = (amount: number, fractionDigits = 2) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(amount) + ' DH';
