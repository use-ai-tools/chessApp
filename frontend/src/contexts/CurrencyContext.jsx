import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';

const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
};

export const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem('chess-currency') || 'INR');
  const [rates, setRates] = useState({ INR: 1, USD: 0.0119, EUR: 0.0109, GBP: 0.0094, AED: 0.0437 }); // fallback
  const [ratesLoaded, setRatesLoaded] = useState(false);

  // Fetch live exchange rates (base INR)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/INR');
        if (res.ok) {
          const data = await res.json();
          if (data.rates) {
            setRates({
              INR: 1,
              USD: data.rates.USD || 0.0119,
              EUR: data.rates.EUR || 0.0109,
              GBP: data.rates.GBP || 0.0094,
              AED: data.rates.AED || 0.0437,
            });
            setRatesLoaded(true);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch exchange rates, using fallback');
      }
    };
    fetchRates();
    // Refresh rates every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const changeCurrency = useCallback((newCurrency) => {
    if (CURRENCIES[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem('chess-currency', newCurrency);
    }
  }, []);

  // Convert from INR to selected currency with 4 decimal places
  const convert = useCallback((amountINR) => {
    if (currency === 'INR') return amountINR;
    const rate = rates[currency] || 1;
    return parseFloat((amountINR * rate).toFixed(4));
  }, [currency, rates]);

  // Format amount with currency symbol and proper decimals
  const format = useCallback((amountINR) => {
    const info = CURRENCIES[currency];
    if (currency === 'INR') {
      return `${info.symbol}${amountINR}`;
    }
    const converted = convert(amountINR);
    return `${info.symbol}${converted.toFixed(4)}`;
  }, [currency, convert]);

  // Short format for cards (2 decimal for non-INR)
  const formatShort = useCallback((amountINR) => {
    const info = CURRENCIES[currency];
    if (currency === 'INR') {
      return `${info.symbol}${amountINR}`;
    }
    const converted = convert(amountINR);
    return `${info.symbol}${converted.toFixed(4)}`;
  }, [currency, convert]);

  const getSymbol = useCallback(() => CURRENCIES[currency]?.symbol || '₹', [currency]);

  return (
    <CurrencyContext.Provider value={{
      currency, changeCurrency, convert, format, formatShort, getSymbol,
      rates, ratesLoaded,
      currencies: CURRENCIES,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
