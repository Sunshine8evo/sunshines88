export type Service = {
  id?: string;
  name: string;
  price: number;
  duration: number;
  type: string;
};

export type Staff = {
  id?: string;
  name: string;
  full_name: string;
  status: string;
};

export type Addon = {
  id?: string;
  name: string;
  price: number;
};

export type BookingSlot = {
  bookingDate: string;
  h: number;
  m: number;
  dur: number;
  col: number;
};

export type ExistingBooking = BookingSlot & {
  id?: string;
};

export type CustomerBookingInput = {
  service: Service;
  bookingDate: string;
  time: string;
  fname: string;
  lname: string;
  phone: string;
  notes: string;
  staffName: string;
  requestStaff: boolean;
  addons: Addon[];
};
