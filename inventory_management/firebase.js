// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_T7xF8p2VVS9iuHUjzmm0BNo0ItwOeB0",
  authDomain: "inventory-management-68394.firebaseapp.com",
  projectId: "inventory-management-68394",
  storageBucket: "inventory-management-68394.appspot.com",
  messagingSenderId: "1050460251606",
  appId: "1:1050460251606:web:9a7ce45dd94fc8b959b077",
  measurementId: "G-QMQC1N80X2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore}