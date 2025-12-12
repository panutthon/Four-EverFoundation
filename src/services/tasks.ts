import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import type { Task } from "../types/app";

const COLLECTION_NAME = "tasks";

export const getTasks = async (): Promise<Task[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("dueDate", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task));
  } catch (error) {
    console.error("Error getting tasks: ", error);
    throw error;
  }
};

export const addTask = async (task: Omit<Task, "id">): Promise<Task> => {
  try {
    const now = Date.now();
    const newTask = { ...task, createdAt: now, updatedAt: now };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newTask);
    return { id: docRef.id, ...newTask };
  } catch (error) {
    console.error("Error adding task: ", error);
    throw error;
  }
};

export const updateTask = async (
  id: string,
  updates: Partial<Task>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    console.error("Error updating task: ", error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting task: ", error);
    throw error;
  }
};
