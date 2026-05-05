import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  tankData:   'sea_tank_data',
  ownerData:  'sea_owner_data',
  uploadedAt: 'sea_data_uploaded_at',
};

export const useStoreData = () => {
  const [tankData,   setTankData]   = useState([]);
  const [ownerData,  setOwnerData]  = useState([]);
  const [uploadedAt, setUploadedAt] = useState(null);
  const [isLoaded,   setIsLoaded]   = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.tankData);
      const rawOwners = localStorage.getItem(STORAGE_KEYS.ownerData);
      const ts = localStorage.getItem(STORAGE_KEYS.uploadedAt);
      if (raw && rawOwners) {
        setTankData(JSON.parse(raw));
        setOwnerData(JSON.parse(rawOwners));
        setUploadedAt(ts);
        setIsLoaded(true);
      }
    } catch {
      // corrupted localStorage — start fresh
    }
  }, []);

  const saveData = useCallback(({ tankData: tanks, ownerData: owners }) => {
    const ts = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.tankData,   JSON.stringify(tanks));
    localStorage.setItem(STORAGE_KEYS.ownerData,  JSON.stringify(owners));
    localStorage.setItem(STORAGE_KEYS.uploadedAt, ts);
    setTankData(tanks);
    setOwnerData(owners);
    setUploadedAt(ts);
    setIsLoaded(true);
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
