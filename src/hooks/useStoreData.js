import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { haversineMiles } from '../utils/geoDistance';

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

  // Returns up to `count` nearest facilities sorted by distance, each with distanceMiles
  const findNearest = useCallback((userLat, userLng, count = 5) => {
    return groupByFacility(tankData)
      .map(({ facility, tanks }) => {
        const lat = parseFloat(facility.LATITUDE);
        const lng = parseFloat(facility.LONGITUDE);
        const distanceMiles =
          !isNaN(lat) && !isNaN(lng)
            ? haversineMiles(userLat, userLng, lat, lng)
            : null;
        return { facility, tanks, distanceMiles };
      })
      .filter(({ distanceMiles }) => distanceMiles !== null)
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
      .slice(0, count);
  }, [tankData, groupByFacility]);

  return {
    isInitializing,
    isLoaded,
    uploadedAt,
    tankData,
    saveData,
    search,
    findNearest,
    getUniqueValues,
    findOwner,
    facilityCount,
    tankCount: tankData.length,
  };
};
