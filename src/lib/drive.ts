import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { SchoolConfig, CalendarEvent } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add all Google Drive scopes
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Auth state observer
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in but no token in memory, we need them to click sign in again to acquire token.
        // But to offer a smoother experience, we can try to re-authenticate or just show Login UI
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get cached token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Log out
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// --- Google Drive API Operations ---

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

/**
 * Lists all .kaldik files saved by the app in Google Drive
 */
export const listKaldikFiles = async (accessToken: string): Promise<DriveFile[]> => {
  try {
    const q = "name contains '.kaldik' and trashed = false";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Drive API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Failed to list files from Google Drive:', error);
    throw error;
  }
};

/**
 * Loads a .kaldik file's content
 */
export const loadKaldikFile = async (
  accessToken: string,
  fileId: string
): Promise<{ config: SchoolConfig; events: CalendarEvent[] }> => {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download file: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load file from Google Drive:', error);
    throw error;
  }
};

/**
 * Saves or updates a .kaldik calendar file in Google Drive
 */
export const saveKaldikFile = async (
  accessToken: string,
  fileName: string,
  fileId: string | null,
  data: { config: SchoolConfig; events: CalendarEvent[] }
): Promise<{ id: string; name: string }> => {
  try {
    // Ensure filename ends with .kaldik
    const actualFileName = fileName.endsWith('.kaldik') ? fileName : `${fileName}.kaldik`;

    const metadata = {
      name: actualFileName,
      mimeType: 'application/json',
    };

    const boundary = 'kaldik_multipart_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(data) +
      closeDelimiter;

    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (fileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save file: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save file to Google Drive:', error);
    throw error;
  }
};

/**
 * Deletes a file from Google Drive
 */
export const deleteKaldikFile = async (accessToken: string, fileId: string): Promise<void> => {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete file: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Failed to delete file from Google Drive:', error);
    throw error;
  }
};

/**
 * Uploads a PNG image or PDF document to Google Drive
 */
export const uploadExportToDrive = async (
  accessToken: string,
  fileName: string,
  mimeType: string,
  blob: Blob
): Promise<{ id: string; name: string }> => {
  try {
    const metadata = {
      name: fileName,
      mimeType,
    };

    const boundary = 'kaldik_export_multipart_boundary';
    const delimiter = `--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = new Blob([
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      '\r\n'
    ], { type: 'application/json' });

    const mediaPartHeader = new Blob([
      delimiter,
      `Content-Type: ${mimeType}\r\n\r\n`
    ], { type: 'text/plain' });

    const closePart = new Blob([
      closeDelimiter
    ], { type: 'text/plain' });

    const multipartBlob = new Blob([
      metadataPart,
      mediaPartHeader,
      blob,
      closePart
    ], { type: 'multipart/related' });

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBlob,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload export to Google Drive: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to upload export to Google Drive:', error);
    throw error;
  }
};
