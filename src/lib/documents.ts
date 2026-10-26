import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { addDocument, newId } from './store';
import type { StudyDocument } from './types';

const WEB_PREFIX = 'idb:';

// --- Web: los archivos se guardan en IndexedDB del navegador --------------------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('opositor-diario-docs', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function webPut(key: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function webGet(key: string): Promise<Blob | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction('files').objectStore('files').get(key);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function webDelete(key: string) {
  const db = await openDb();
  db.transaction('files', 'readwrite').objectStore('files').delete(key);
}

// --- Común -------------------------------------------------------------------

function docsDirectory() {
  const dir = new Directory(Paths.document, 'documentos');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Abre el selector, copia los archivos elegidos dentro de la app y los asocia al tema. */
export async function pickDocuments(topicId: string): Promise<number> {
  const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
  if (result.canceled) return 0;

  for (const asset of result.assets) {
    const id = newId();
    let uri: string;
    if (Platform.OS === 'web') {
      const blob = asset.file ?? (await (await fetch(asset.uri)).blob());
      uri = WEB_PREFIX + id;
      await webPut(uri, blob);
    } else {
      const safeName = asset.name.replace(/[^\w.\-]+/g, '_');
      const target = new File(docsDirectory(), `${id}-${safeName}`);
      await new File(asset.uri).copy(target);
      uri = target.uri;
    }
    addDocument({ topicId, name: asset.name, uri, mimeType: asset.mimeType, size: asset.size });
  }
  return result.assets.length;
}

export async function openDocument(doc: StudyDocument) {
  if (Platform.OS === 'web') {
    const blob = doc.uri.startsWith(WEB_PREFIX) ? await webGet(doc.uri) : undefined;
    if (!blob) throw new Error('No se encuentra el archivo en este navegador.');
    window.open(URL.createObjectURL(blob), '_blank');
    return;
  }
  const file = new File(doc.uri);
  if (await file.canPreview()) {
    await file.preview();
  } else if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(doc.uri, { mimeType: doc.mimeType, dialogTitle: doc.name });
  }
}

export async function removeDocumentFile(doc: StudyDocument) {
  try {
    if (Platform.OS === 'web') await webDelete(doc.uri);
    else new File(doc.uri).delete();
  } catch {
    // El registro se borra igualmente aunque el archivo ya no exista.
  }
}

export function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
