export const getPhotoUrl = (photoUrl?: string | null): string | undefined => {
  if (!photoUrl || photoUrl === 'null' || photoUrl === 'undefined') return undefined;
  
  // If it's a base64 data URI or an external HTTP link, return it as is
  if (photoUrl.startsWith('data:') || photoUrl.startsWith('http')) {
    return photoUrl;
  }
  
  // If it's a relative path (old format), prepend the backend URL
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return photoUrl.startsWith('/') ? `${backendUrl}${photoUrl}` : `${backendUrl}/${photoUrl}`;
};
