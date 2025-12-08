export interface StaffMember {
  id: string;
  staffId: string;
  fullName: string;
  location: string;
  conraiss: string;
  jobTitle: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  dateAdded: string;
}

export interface UploadRecord {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'Verified' | 'Pending' | 'Mismatched';
}

export interface MismatchRecord {
  id: string;
  staffId: string;
  name: string;
  type: 'Name' | 'Station' | 'CONRAISS';
  uploadedValue: string;
  systemValue: string;
  status: 'Pending Review' | 'Resolved';
}

export interface MissingRecord {
  id: string;
  staffId: string;
  name: string;
  department: string;
  jobTitle: string;
  status: 'Pending' | 'Added' | 'Ignored';
}

export interface ValidRecord {
  fileNumber: string;
  name: string;
  station: string;
  conraiss: string;
  validationDate: string;
}

export interface Report {
  id: string;
  name: string;
  category: string;
  lastGenerated: string;
}
