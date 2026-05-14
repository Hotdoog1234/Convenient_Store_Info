#!/usr/bin/env node
/**
 * Cleanup script — run once to reset test data.
 *
 * What it does:
 *   1. Deletes every Firebase Auth user EXCEPT robert_francis@shieldmw.com
 *   2. Deletes every document in Firestore: accessRequests, approvedUsers
 *
 * Prerequisites:
 *   - Place your Firebase service account key JSON at:
 *       scripts/serviceAccountKey.json
 *   - Download it from: Firebase Console → Project Settings →
 *     Service Accounts → Generate new private key
 *
 * Usage:
 *   node scripts/cleanup.js
 */

const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');

const KEY_PATH    = path.join(__dirname, 'serviceAccountKey.json');
const KEEP_EMAIL  = 'robert_francis@shieldmw.com';
const COLLECTIONS = ['accessRequests', 'approvedUsers', 'blockedUsers'];

// ── Preflight check ────────────────────────────────────────────────────────
if (!fs.existsSync(KEY_PATH)) {
  console.error('\n  ERROR: Service account key not found.');
  console.error(`  Expected: ${KEY_PATH}`);
  console.error('\n  Download it from:');
  console.error('  Firebase Console → Project Settings → Service Accounts → Generate new private key\n');
  process.exit(1);
}

const serviceAccount = require(KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db   = admin.firestore();

// ── Helpers ────────────────────────────────────────────────────────────────

async function deleteAllUsersExcept(keepEmail) {
  console.log('\n── Firebase Auth users ──────────────────────────');
  let deleted = 0;
  let kept    = 0;
  let pageToken;

  do {
    const result = await auth.listUsers(1000, pageToken);

    for (const user of result.users) {
      if (user.email?.toLowerCase() === keepEmail.toLowerCase()) {
        console.log(`  KEEP    ${user.email}`);
        kept++;
      } else {
        await auth.deleteUser(user.uid);
        console.log(`  DELETED ${user.email ?? '(no email)'} [${user.uid}]`);
        deleted++;
      }
    }

    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`\n  Done — ${deleted} deleted, ${kept} kept`);
}

async function deleteCollection(collectionName) {
  console.log(`\n── Firestore: ${collectionName} ${'─'.repeat(Math.max(0, 40 - collectionName.length))}`);
  const snap = await db.collection(collectionName).get();

  if (snap.empty) {
    console.log('  No documents found.');
    return;
  }

  // Delete in batches of 500 (Firestore limit)
  const batches = [];
  let batch = db.batch();
  let count = 0;

  for (const docSnap of snap.docs) {
    batch.delete(docSnap.ref);
    count++;
    if (count % 500 === 0) {
      batches.push(batch.commit());
      batch = db.batch();
    }
  }
  if (count % 500 !== 0) batches.push(batch.commit());

  await Promise.all(batches);
  console.log(`  Deleted ${count} document${count !== 1 ? 's' : ''}.`);
}

async function deleteBlockedAuthAccounts() {
  console.log('\n── Firebase Auth: deleting blocked user accounts ────────');
  const snap = await db.collection('blockedUsers').get();
  if (snap.empty) { console.log('  No blocked users found.'); return; }

  let deleted = 0;
  for (const docSnap of snap.docs) {
    const uid   = docSnap.id;
    const email = docSnap.data().email ?? '(unknown)';
    try {
      await auth.deleteUser(uid);
      console.log(`  DELETED Auth account: ${email} [${uid}]`);
      deleted++;
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`  SKIP (already deleted): ${email} [${uid}]`);
      } else {
        console.error(`  ERROR deleting ${email}: ${err.message}`);
      }
    }
  }
  console.log(`\n  Done — ${deleted} Auth account(s) deleted`);
}

// ── Main ───────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\nCleanup script — project: ${serviceAccount.project_id}`);
  console.log(`Keeping: ${KEEP_EMAIL}`);

  try {
    // Delete Auth accounts for blocked users before wiping Firestore
    await deleteBlockedAuthAccounts();
    await deleteAllUsersExcept(KEEP_EMAIL);
    for (const col of COLLECTIONS) {
      await deleteCollection(col);
    }
    console.log('\n✓ Cleanup complete.\n');
  } catch (err) {
    console.error('\n✕ Cleanup failed:', err.message ?? err);
    process.exit(1);
  }

  process.exit(0);
})();
