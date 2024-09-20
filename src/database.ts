import { getApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDocsFromServer,
  getFirestore,
  updateDoc
} from "firebase/firestore";

export class FirestoreDB {
  static async getAllInCollection(collection: string) {
    const docs = await getDocsFromServer(this.makeCollection(collection));
    return docs.docs;
  }

  static async createDocument(collection: string, document: Object) {
    const doc = await addDoc(this.makeCollection(collection), document);
    return doc.id;
  }

  static async updateDocument(
    collection: string,
    documentId: string,
    data: Object
  ) {
    await updateDoc(
      doc(this.makeCollection(collection), documentId),
      data as any
    );
  }

  private static makeCollection(collectionName: string) {
    return collection(getFirestore(getApp()), collectionName);
  }
}
