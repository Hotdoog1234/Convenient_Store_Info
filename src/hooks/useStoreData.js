import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';

// IndexedDB store — no quota issues for large datasets
const store = localforage.createInstance({ name: 'sea-store-info' });

const KEYS = {
  tankData:   'sea_tank_data',
  ownerData:  'sea_owner_data',
  uploadedAt: 'sea_data_uploaded_at',
};

export const useStoreData = () => {
  const [tankData,      setTankData]      = useState([]);
  const [ownerData,     setOwnerData]     = useState([]);
  const [uploadedAt,    setUploadedAt]    = useState(null);
  const [isLoaded,      setIsLoaded]      = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const [tanks, owners, ts] = await Promise.all([
          store.getItem(KEYS.tankData),
          store.getItem(KEYS.ownerData),
          store.getItem(KEYS.uploadedAt),
        ]);
        if (tanks && owners) {
          setTankData(tanks);
          setOwnerData(owners);
          setUploadedAt(ts);
          setIsLoaded(true);
        }
      } catch {
        // corrupted storage — start fresh
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const saveData = useCallback(async ({ tankData: tanks, ownerData: owners }) => {
    const ts = new Date().toISOString();
    // Update memory immediately so UI responds at once
    setTankData(tanks);
    setOwnerData(owners);
    setUploadedAt(ts);
    setIsLoaded(true);
    // Persist to IndexedDB in the background
    await Promise.all([
      store.setItem(KEYS.tankData,   tanks),
      store.setItem(KEYS.ownerData,  owners),
      store.setItem(KEYS.uploadedAt, ts),
    ]);
  }, []);

  // Grouped by AI_ID: [{ facility, tanks[] }]
  const groupByFacility = useCallback((rows) => {
    const map = {};
    rows.forEach((row) => {
      const id = row.AI_ID;
      if (!map[id]) map[id] = { facility: row, tanks: [] };
      map[id].tanks.push(row);
    });
    return Object.values(map);
  }, []);

  const search = useCallback((category, term) => {
    if (!category || !term) return [];
    let results = [];

    if (category === 'AI_ID') {
      results = tankData.filter((r) => String(r.AI_ID) === String(term).trim());
    } else if (category === 'AI_NAME' || category === 'ADDRESS_1') {
      const lower = term.trim().toLowerCase();
      results = tankData.filter((r) =>
        (r[category] || '').toString().toLowerCase().includes(lower)
      );
    } else if (category === 'COUNTY' || category === 'OWNER_NAME') {
      results = tankData.filter((r) => (r[category] || 'N/A') === term);
    }

    return groupByFacility(results);
  }, [tankData, groupByFacility]);

  const getUniqueValues = useCallback((field) => {
    const vals = [...new Set(tankData.map((r) => r[field]?.toString().trim() || 'N/A'))];
    return vals.sort((a, b) => a.localeCompare(b));
  }, [tankData]);

  const findOwner = useCallback((ownerName) => {
    return ownerData.find(
      (o) => o.OWNER_NAME?.toLowerCase() === ownerName?.toLowerCase()
    ) || null;
  }, [ownerData]);

  const facilityCount = useCallback(() => {
    return new Set(tankData.map((r) => r.AI_ID)).size;
  }, [tankData]);

  return {
    isInitializing,
    isLoaded,
    uploadedAt,
    tankData,
    saveData,
    search,
    getUniqueValues,
    findOwner,
    facilityCount,
    tankCount: tankData.length,
  };
};
