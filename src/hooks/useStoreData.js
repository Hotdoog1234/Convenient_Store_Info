import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { haversineMiles } from '../utils/geoDistance';

const BATCH_SIZE = 400;

const splitBatches = (arr) => {
  const out = [];
  for (let i = 0; i < arr.length; i += BATCH_SIZE) out.push(arr.slice(i, i + BATCH_SIZE));
  return out;
};

const writeDataBatches = async (collectionName, records) => {
  const batches = splitBatches(records);
  await Promise.all(
    batches.map((batch, i) =>
      setDoc(doc(db, collectionName, `batch_${i}`), { records: batch })
    )
  );
  return batches.length;
};

const readDataBatches = async (collectionName, batchCount) => {
  if (!batchCount) return [];
  const snapshots = await Promise.all(
    Array.from({ length: batchCount }, (_, i) =>
      getDoc(doc(db, collectionName, `batch_${i}`))
    )
  );
  return snapshots.flatMap(s => (s.exists() ? s.data().records : []));
};

export const useStoreData = (userReady = false) => {
  const [tankData,        setTankData]        = useState([]);
  const [ownerData,       setOwnerData]       = useState([]);
  const [tankUploadedAt,  setTankUploadedAt]  = useState(null);
  const [ownerUploadedAt, setOwnerUploadedAt] = useState(null);
  const [isLoaded,        setIsLoaded]        = useState(false);
  const [isInitializing,  setIsInitializing]  = useState(true);
  const [loadingStatus,   setLoadingStatus]   = useState('Connecting to Firebase…');
  const [loadError,       setLoadError]       = useState(null);

  useEffect(() => {
    if (!userReady) return;

    (async () => {
      try {
        setLoadingStatus('Connecting to Firebase…');
        setLoadError(null);

        const [tankMeta, ownerMeta] = await Promise.all([
          getDoc(doc(db, 'metadata', 'tankData')),
          getDoc(doc(db, 'metadata', 'ownerData')),
        ]);

        const tankBatchCount  = tankMeta.exists()  ? (tankMeta.data().batchCount  ?? 0) : 0;
        const ownerBatchCount = ownerMeta.exists() ? (ownerMeta.data().batchCount ?? 0) : 0;

        console.log('[useStoreData] metadata/tankData:', tankMeta.exists() ? tankMeta.data() : '(no doc)');
        console.log('[useStoreData] metadata/ownerData:', ownerMeta.exists() ? ownerMeta.data() : '(no doc)');
        console.log(`[useStoreData] batchCounts — tank: ${tankBatchCount}, owner: ${ownerBatchCount}`);

        if (tankBatchCount === 0) {
          setLoadingStatus('No data found in Firestore — tank data has not been uploaded yet.');
          return;
        }

        setLoadingStatus(`Loading tank data… (${tankBatchCount} batch${tankBatchCount !== 1 ? 'es' : ''})`);

        const [tanks, owners] = await Promise.all([
          readDataBatches('tankData',  tankBatchCount),
          readDataBatches('ownerData', ownerBatchCount),
        ]);

        console.log(`[useStoreData] Fetch complete — tanks: ${tanks.length}, owners: ${owners.length}`);

        if (tanks.length > 0) {
          setTankData(tanks);
          setIsLoaded(true);
          setLoadingStatus(`Loading complete — ${tanks.length.toLocaleString()} tank records loaded`);
        } else {
          setLoadingStatus(`No tank records returned from Firestore (batchCount was ${tankBatchCount}).`);
        }

        if (owners.length > 0) setOwnerData(owners);

        if (tankMeta.exists()) {
          const ts = tankMeta.data().uploadedAt;
          setTankUploadedAt(ts?.toDate ? ts.toDate().toISOString() : ts);
        }
        if (ownerMeta.exists()) {
          const ts = ownerMeta.data().uploadedAt;
          setOwnerUploadedAt(ts?.toDate ? ts.toDate().toISOString() : ts);
        }
      } catch (err) {
        console.error('[useStoreData] Firestore load failed:', err);
        setLoadError(`Firebase error: ${err.message}`);
        setLoadingStatus('');
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [userReady]);

  const saveTankData = useCallback(async (tanks) => {
    const batchCount = await writeDataBatches('tankData', tanks);
    await setDoc(doc(db, 'metadata', 'tankData'), {
      uploadedAt:    serverTimestamp(),
      recordCount:   tanks.length,
      facilityCount: new Set(tanks.map(r => r.AI_ID)).size,
      batchCount,
    });
    setTankData(tanks);
    setTankUploadedAt(new Date().toISOString());
    setIsLoaded(true);
  }, []);

  const saveOwnerData = useCallback(async (owners) => {
    const batchCount = await writeDataBatches('ownerData', owners);
    await setDoc(doc(db, 'metadata', 'ownerData'), {
      uploadedAt:  serverTimestamp(),
      recordCount: owners.length,
      batchCount,
    });
    setOwnerData(owners);
    setOwnerUploadedAt(new Date().toISOString());
  }, []);

  const groupByFacility = useCallback((rows) => {
    const map = {};
    rows.forEach((row) => {
      const id = row.AI_ID;
      if (!map[id]) map[id] = { facility: row, tanks: [] };
      map[id].tanks.push(row);
    });
    return Object.values(map);
  }, []);

  const search = useCallback((category, term, term2) => {
    if (!category || !term) return [];
    let results = [];

    if (category === 'AI_ID') {
      results = tankData.filter((r) => String(r.AI_ID) === String(term).trim());
    } else if (category === 'AI_NAME' || category === 'ADDRESS_1') {
      const lower = term.trim().toLowerCase();
      results = tankData.filter((r) =>
        (r[category] || '').toString().toLowerCase().includes(lower)
      );
    } else if (category === 'COUNTY') {
      results = tankData.filter((r) => (r.COUNTY || 'N/A') === term);
    } else if (category === 'OWNER_NAME') {
      const lower = term.trim().toLowerCase();
      results = tankData.filter((r) =>
        (r.OWNER_NAME || '').toLowerCase().includes(lower)
      );
    } else if (category === 'TANK_STATUS_CODE') {
      const matchIds = new Set(
        tankData.filter((r) => r.TANK_STATUS_CODE?.trim() === term).map((r) => r.AI_ID)
      );
      results = tankData.filter((r) => matchIds.has(r.AI_ID));
    } else if (category === 'TANK_STATUS_COUNTY') {
      if (!term2) return [];
      const matchIds = new Set(
        tankData
          .filter((r) => r.TANK_STATUS_CODE?.trim() === term && (r.COUNTY || 'N/A') === term2)
          .map((r) => r.AI_ID)
      );
      results = tankData.filter((r) => matchIds.has(r.AI_ID));
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
    loadingStatus,
    loadError,
    tankUploadedAt,
    ownerUploadedAt,
    saveTankData,
    saveOwnerData,
    search,
    findNearest,
    getUniqueValues,
    findOwner,
    facilityCount,
    tankCount:  tankData.length,
    ownerCount: ownerData.length,
  };
};
