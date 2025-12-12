import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";
import type { Subject } from "../types/app";

const COLLECTION_NAME = "subjects";

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name"));
    const snapshot = await getDocs(q);
    const subjects = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Subject)
    );

    // If no subjects exist, return null or empty array to trigger seeding if needed
    return subjects;
  } catch (error) {
    console.error("Error getting subjects: ", error);
    throw error;
  }
};

export const addSubject = async (name: string): Promise<Subject> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), { name });
    return { id: docRef.id, name };
  } catch (error) {
    console.error("Error adding subject: ", error);
    throw error;
  }
};
