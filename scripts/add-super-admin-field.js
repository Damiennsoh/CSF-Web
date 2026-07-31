// Add isSuperAdmin field to existing users
// Run this script to update Firestore with the new field

// You'll need to manually set these values from your .env.local file
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

console.log(`
🔧 Firebase Setup Required:
1. Open this file: scripts/add-super-admin-field.js
2. Replace the placeholder values in firebaseConfig with your actual Firebase config
3. Install Firebase admin SDK: npm install firebase-admin
4. Run: node scripts/add-super-admin-field.js

📝 Alternative: Manual Firestore Update
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Select the 'users' collection
4. For each user document, add: isSuperAdmin: false
5. For your first super admin, set: isSuperAdmin: true

⚠️  Note: All existing users should start with isSuperAdmin: false
    Then manually set isSuperAdmin: true for your first super admin
`);

// Alternative: Use web version in browser console
console.log(`
🌐 Browser Console Method:
1. Open your admin dashboard in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste and run this code:

(async function addSuperAdminField() {
  const { collection, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js');
  
  // Assuming 'db' is available globally from your app
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  
  let updatedCount = 0;
  for (const userDoc of querySnapshot.docs) {
    const userData = userDoc.data();
    if (userData.isSuperAdmin === undefined) {
      await updateDoc(doc(db, 'users', userDoc.id), {
        isSuperAdmin: false,
        updatedAt: new Date().toISOString()
      });
      console.log('Updated:', userData.email || userDoc.id);
      updatedCount++;
    }
  }
  console.log('Updated', updatedCount, 'users');
})();
`);
