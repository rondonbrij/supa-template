"use client"

import type { Seat as SeatType } from "@/types/seat-types"
import { Seat } from "./seat"

interface VanLayoutProps {
  seats: SeatType[]
  onSeatClick: (seat: SeatType) => void
}

export function VanLayout({ seats, onSeatClick }: VanLayoutProps) {
  // Helper function to render a row with specific seat numbers
  const renderRow = (seatNumbers: number[]) => {
    return (
      <div className="flex justify-start gap-2">
        {seatNumbers.map((num) => {
          const seat = seats.find((s) => s.number === num)
          if (!seat) return null // Skip rendering if seat does not exist
          return <Seat key={seat.id} seat={seat} onClick={() => onSeatClick(seat)} size="md" />
        })}
      </div>
    )
  }

  const renderDriverSeat = () => (
    <Seat seat={{ id: "driver", number: 0, status: "driver" }} onClick={() => {}} size="md" />
  )

  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex-1 space-y-2">
        {/* Main seating area with Driver seat before seat 1 */}
        <div className="flex justify-start gap-2">
          {renderDriverSeat()} {/* Driver seat placed before seat 1 */}
          {seats
            .filter((seat) => seat.number === 1 || seat.number === 2)
            .map((seat) => (
              <Seat key={seat.id} seat={seat} onClick={() => onSeatClick(seat)} size="md" />
            ))}
        </div>
        {renderRow([3, 4, 5])}
        {renderRow([6, 7, 8])}
        {renderRow([9, 10, 11])}
        {renderRow([12, 13, 14, 15])}
      </div>

      {/* Legend section */}
      <div className="mt-4 md:ml-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black" />
            <span>Driver</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#90EE90]" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#87CEEB]" />
            <span>PWD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300" />
            <span>Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500" />
            <span>Booked</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Note: Actual seat arrangement may vary depending on the vehicle.
        </p>
      </div>
    </div>
  )
}

