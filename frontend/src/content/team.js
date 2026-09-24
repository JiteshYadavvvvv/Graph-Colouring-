/**
 * The project team. Only names are listed here; no roles, contact details
 * or profiles are included. Portraits are loaded from frontend/public/team/
 * (see the README there): replace a file to update a photo.
 */
const photo = (file) => `${import.meta.env.BASE_URL}team/${file}`;

export const TEAM = [
  { id: 'jitesh', name: 'Jitesh Yadav', photo: photo('jitesh.jpg') },
  { id: 'jatin', name: 'Jatin', photo: photo('jatin.jpg') },
  { id: 'harsh', name: 'Harsh Pandey', photo: photo('harsh.jpg') },
  { id: 'neelendu', name: 'Neelendu', photo: photo('neelendu.jpg') },
];

export const TEAM_DEPARTMENT = 'Computer Engineering';
