"use client"

import type { Seat as SeatType } from "@/types/seat-types"
import { Seat } from "./seat"

interface BusLayoutProps {
  seats: SeatType[]
  onSeatClick: (seat: SeatType) => void
}

export function BusLayout({ seats, onSeatClick }: BusLayoutProps) {
  // Helper function to render a row with specific seat numbers and a gap
  const renderRow = (leftSeatNumbers: number[], rightSeatNumbers: number[]) => {
    return (
      <div className="flex gap-2">
        <div className="flex gap-2">
          {leftSeatNumbers.map((num) => {
            const seat = seats.find((s) => s.number === num)
            if (!seat) return null // Skip rendering if seat does not exist
            return <Seat key={seat.id} seat={seat} onClick={() => onSeatClick(seat)} />
          })}
        </div>
        <div className="w-10" /> {/* Gap */}
        <div className="flex gap-2">
          {rightSeatNumbers.map((num) => {
            const seat = seats.find((s) => s.number === num)
            if (!seat) return null // Skip rendering if seat does not exist
            return <Seat key={seat.id} seat={seat} onClick={() => onSeatClick(seat)} />
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex-1 space-y-2">
        {/* Driver's seat */}
        <div className="flex justify-start ml-12 mb-2">
          <Seat seat={{ id: "driver", number: 0, status: "driver" }} onClick={() => {}} />
        </div>

        {/* Main seating area */}
        {renderRow([1, 2, 3], [4, 5])}
        {renderRow([6, 7, 8], [9, 10])}
        {renderRow([11, 12, 13], [14, 15])}
        {renderRow([16, 17, 18], [19, 20])}
        {renderRow([21, 22, 23], [24, 25])}
        {renderRow([26, 27, 28], [29, 30])}
        {renderRow([31, 32, 33], [34, 35])}
        {renderRow([36, 37, 38], [39, 40])}
        {renderRow([41, 42, 43], [44, 45])}
        {renderRow([46, 47, 48], [49, 50])}
        {renderRow([51, 52, 53], [54, 55])}
        {renderRow([56, 57, 58], [59, 60])}
        {renderRow([61, 62, 63, 64, 65, 66], [])}
      </div>

      {/* Legend section */}
      <div className="mt-4 md:ml-4">
        <h1>Legends</h1>
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

