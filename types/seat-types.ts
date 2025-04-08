export interface Seat {
    id: string
    number: number
    status: "available" | "selected" | "pwd" | "processing" | "booked" | "driver"
  }
  
  export interface PassengerDetails {
    firstName: string
    lastName: string
    email?: string
    phoneNumber: string
    birthday: Date | string
    seatNumber: number
  }
  
  