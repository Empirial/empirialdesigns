import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const manageRepo = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required');
  const uid = request.auth.uid;
  const { action, repoUrl, repoOwner, repoName, repoId } = request.data;
  const db = admin.firestore();

  if (action === 'add') {
    if (!repoUrl || !repoOwner || !repoName) throw new HttpsError('invalid-argument', 'Missing required fields');
    const reposRef = db.collection('users').doc(uid).collection('repos');
    const existing = await reposRef.where('repoOwner', '==', repoOwner).where('repoName', '==', repoName).get();
    if (!existing.empty) throw new HttpsError('already-exists', 'Repository already added');

    const docRef = await reposRef.add({
      repoUrl, repoOwner, repoName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: docRef.id, repoUrl, repoOwner, repoName };
  }

  if (action === 'delete') {
    if (!repoId) throw new HttpsError('invalid-argument', 'Missing repoId');
    await db.collection('users').doc(uid).collection('repos').doc(repoId).delete();
    return { success: true };
  }

  throw new HttpsError('invalid-argument', 'Unknown action');
});
