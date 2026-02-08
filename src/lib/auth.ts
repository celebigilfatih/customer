// Simple authentication utility for admin panel
export interface AdminCredentials {
  username: string;
  password: string;
}

// In a real application, these would be stored securely (environment variables, database, etc.)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // This should be hashed in production
};

export function validateAdminCredentials(credentials: AdminCredentials): boolean {
  return credentials.username === ADMIN_CREDENTIALS.username && 
         credentials.password === ADMIN_CREDENTIALS.password;
}

export function setAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('admin_authenticated', 'true');
  }
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('admin_authenticated');
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  }
  return false;
}