export class ClassroomBooking {
  id: number;
  title: string;
  description?: string;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
