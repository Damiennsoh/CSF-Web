const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqU43VzKjXH2LQyYk8t9Xx2f7w3y6z9a",
  authDomain: "csf-website-ba751.firebaseapp.com",
  projectId: "csf-website-ba751",
  storageBucket: "csf-website-ba751.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const regularEvents = [
  {
    title: "Weekly Bible Study",
    description: "Deep dive into God's Word with interactive discussions and fellowship.",
    eventDate: "2026-12-31", // Recurring event - set far future
    time: "7:00 PM - 8:30 PM",
    location: "Fellowship Hall",
    isFeatured: false,
    isActive: true,
    registrationRequired: false,
    eventType: "regular",
    createdAt: serverTimestamp()
  },
  {
    title: "Sunday Worship",
    description: "Join us for inspiring worship, powerful messages, and community fellowship.",
    eventDate: "2026-12-31", // Recurring event - set far future
    time: "10:00 AM - 12:00 PM",
    location: "Main Chapel",
    isFeatured: false,
    isActive: true,
    registrationRequired: false,
    eventType: "regular",
    createdAt: serverTimestamp()
  }
];

async function addRegularEvents() {
  try {
    console.log('Adding regular events to Firestore...');
    
    for (const event of regularEvents) {
      const docRef = await addDoc(collection(db, "events"), event);
      console.log(`✅ Added event: ${event.title} (ID: ${docRef.id})`);
    }
    
    console.log('🎉 All regular events added successfully!');
  } catch (error) {
    console.error('❌ Error adding events:', error);
  }
}

addRegularEvents();
