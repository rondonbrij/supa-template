"use client"

import { format } from "date-fns"
import { Eye, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Trip {
  id: string
  departure_time: string
  destination_name: string
  company_name: string
  vehicle_type: string
  fare: number
  available_seats: number
  amenities: any
  notes?: string
  status?: string
  capacity?: number
}

interface TripCardProps {
  trip: Trip
  onBookNow: (tripId: string) => void
}

export function TripCard({ trip, onBookNow }: TripCardProps) {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "hh:mm a")
    } catch (error) {
      return "Invalid time"
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 className="text-xl font-semibold mb-2">{trip.destination_name}</h3>
      <div className="text-sm text-gray-600 mb-2">{trip.company_name}</div>
      {trip.status && (
        <div className="flex items-center gap-1 text-sm">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              trip.status === "scheduled"
                ? "bg-green-500"
                : trip.status === "departed"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
            }`}
          ></span>
          <span className="capitalize">{trip.status}</span>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold">{formatTime(trip.departure_time)}</div>
        <div className="text-lg font-bold">₱{trip.fare.toFixed(2)}</div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm">
          <span className="font-medium">Seats left:</span>
          <div className="flex items-center gap-1">
            <Users2 className="h-4 w-4 text-gray-500" />
            <span>
              {trip.available_seats} / {trip.capacity || "?"} seats available
            </span>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Notes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trip Notes</DialogTitle>
              <DialogDescription>{trip.notes || "No notes available for this trip."}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <Button onClick={() => onBookNow(trip.id)} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
        Book Seats
      </Button>
    </div>
  )
}
