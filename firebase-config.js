// firebase-config.js
// Firebase Project configuration credentials
var firebaseConfig = {
  apiKey: "AIzaSyCdl6NHPZYdOeSQpNPHHYNDwBErKD8NL20",
  authDomain: "rich-schools.firebaseapp.com",
  projectId: "rich-schools",
  storageBucket: "rich-schools.firebasestorage.app",
  messagingSenderId: "1057709107473",
  appId: "1:1057709107473:web:df2dc79984e323bcadc4b0",
  measurementId: "G-0RZ90M5FG8",

  // EmailJS Configuration (Optional - for booking email notifications)
  // Register at https://www.emailjs.com/ to get credentials
  emailjsServiceId: "YOUR_EMAILJS_SERVICE_ID",
  emailjsTemplateId: "YOUR_EMAILJS_TEMPLATE_ID",
  emailjsPublicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  notificationEmail: "info@rich-schools.com"
};

if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}

