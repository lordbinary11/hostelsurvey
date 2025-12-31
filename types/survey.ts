export interface Survey {
  id?: number;
  hostelName: string;
  photoPath: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  numberOfFloors: number;
  numberOfRooms: number;
  numberOfResidents: number;
  managerName: string;
  managerPhone: string;
  hasWifi: boolean;
  completionStatus: 'Running' | 'Uncompleted' | 'Completed';
  createdAt?: string;
}

