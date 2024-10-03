import { getApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  getFirestore,
  updateDoc
} from "firebase/firestore";

export class FirestoreDB {
  static async getAllInCollection(collection: string) {
    // console.log("getAllInCollection");
    const docs = await getDocsFromServer(this.makeCollection(collection));
    return docs.docs;
  }

  static async createDocument(collection: string, document: Object) {
    // console.log("createDocument");
    const doc = await addDoc(this.makeCollection(collection), document);
    return doc.id;
  }

  static async updateDocument(
    collection: string,
    documentId: string,
    data: Object
  ) {
    // console.log("updateDocument");
    await updateDoc(
      doc(this.makeCollection(collection), documentId),
      data as any
    );
  }

  static async deleteDocument(collection: string, documentId: string) {
    await deleteDoc(doc(this.makeCollection(collection), documentId));
  }

  private static makeCollection(collectionName: string) {
    return collection(getFirestore(getApp()), collectionName);
  }
}
