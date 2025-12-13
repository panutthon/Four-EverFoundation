import { db } from "../firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
} from "firebase/firestore";
import type { ClassSchedule } from "../types/app";

const COLLECTION_NAME = "timetable";

export const getSchedules = async (): Promise<ClassSchedule[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ClassSchedule)
        );
    } catch (error) {
        console.error("Error getting schedules: ", error);
        throw error;
    }
};

export const addSchedule = async (
    schedule: Omit<ClassSchedule, "id">
): Promise<ClassSchedule> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), schedule);
        return { id: docRef.id, ...schedule };
    } catch (error) {
        console.error("Error adding schedule: ", error);
        throw error;
    }
};

export const updateSchedule = async (
    id: string,
    updates: Partial<ClassSchedule>
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error updating schedule: ", error);
        throw error;
    }
};

export const deleteSchedule = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting schedule: ", error);
        throw error;
    }
};
