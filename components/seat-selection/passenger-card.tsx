"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit2 } from "lucide-react"

interface PassengerCardProps {
  passenger: {
    firstName: string
    lastName: string
    email?: string
    phoneNumber: string
    birthday: string
    seatNumber: number
  }
  index: number
  onEdit: () => void
}

export function PassengerCard({ passenger, index, onEdit }: PassengerCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Passenger {index + 1}</h3>
            <Badge variant="secondary" className="bg-green-500 text-white">
              Seat {passenger.seatNumber}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1 text-sm">
          <span className="text-muted-foreground">Name:</span>
          <span>
            {passenger.firstName} {passenger.lastName}
          </span>
          {passenger.email && (
            <>
              <span className="text-muted-foreground">Email:</span>
              <span className="truncate">{passenger.email}</span>
            </>
          )}
          <span className="text-muted-foreground">Phone:</span>
          <span>{passenger.phoneNumber}</span>
          <span className="text-muted-foreground">Birthday:</span>
          <span>{new Date(passenger.birthday).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
