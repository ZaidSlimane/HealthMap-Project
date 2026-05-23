export interface CalendarEventDto {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    requestId: number;
    patientName: string;
    examType: string;
    urgency: string;
  };
  backgroundColor: string;
  borderColor: string;
}
