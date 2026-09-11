import { LookupItem } from './lookup.service';

/** Mock data for local template generation / testing without DB */
export const MOCK_COUNTRIES: LookupItem[] = [
  { id: 1, name: 'India' },
];

export const MOCK_STATES: LookupItem[] = [
  { id: 1, name: 'Maharashtra', parentId: 1, parentName: 'India' },
  { id: 2, name: 'Karnataka', parentId: 1, parentName: 'India' },
  { id: 3, name: 'Delhi', parentId: 1, parentName: 'India' },
  { id: 4, name: 'Gujarat', parentId: 1, parentName: 'India' },
  { id: 5, name: 'Tamil Nadu', parentId: 1, parentName: 'India' },
];

export const MOCK_DISTRICTS: LookupItem[] = [
  { id: 367, name: 'Mumbai', parentId: 1, parentName: 'Maharashtra' },
  { id: 368, name: 'Pune', parentId: 1, parentName: 'Maharashtra' },
  { id: 369, name: 'Nagpur', parentId: 1, parentName: 'Maharashtra' },
  { id: 370, name: 'Thane', parentId: 1, parentName: 'Maharashtra' },
  { id: 401, name: 'Bengaluru Urban', parentId: 2, parentName: 'Karnataka' },
  { id: 402, name: 'Mysuru', parentId: 2, parentName: 'Karnataka' },
  { id: 501, name: 'New Delhi', parentId: 3, parentName: 'Delhi' },
  { id: 601, name: 'Ahmedabad', parentId: 4, parentName: 'Gujarat' },
  { id: 701, name: 'Chennai', parentId: 5, parentName: 'Tamil Nadu' },
];

export const MOCK_DEPARTMENTS: LookupItem[] = [
  { id: 29, name: 'Operations' },
  { id: 30, name: 'Production' },
  { id: 31, name: 'Quality Control' },
  { id: 32, name: 'Logistics' },
  { id: 33, name: 'Administration' },
];

export const MOCK_DESIGNATIONS: LookupItem[] = [
  { id: 44, name: 'Worker' },
  { id: 45, name: 'Supervisor' },
  { id: 46, name: 'Technician' },
  { id: 47, name: 'Manager' },
  { id: 48, name: 'Helper' },
];