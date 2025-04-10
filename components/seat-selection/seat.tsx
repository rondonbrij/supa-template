"use client"

interface SeatProps {
  seat: {
    number: number
    status: "available" | "selected" | "pwd" | "processing" | "booked" | "driver"
  }
  onClick: () => void
  size?: "sm" | "md"
}

export function Seat({ seat, onClick, size = "md" }: SeatProps) {
  const getStatusStyles = () => {
    switch (seat.status) {
      case "available":
        return "bg-white hover:bg-gray-100 border-gray-300"
      case "selected":
        return "bg-[#90EE90] hover:bg-[#7CCD7C] text-white border-[#7CCD7C]"
      case "pwd":
        return "bg-[#87CEEB] text-white border-[#87CEEB]"
      case "processing":
        return "bg-yellow-300 text-white border-yellow-300 cursor-not-allowed"
      case "booked":
        return "bg-red-500 text-white border-red-500 cursor-not-allowed"
      case "driver":
        return "bg-black text-white border-black cursor-not-allowed"
      default:
        return "bg-white"
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={["booked", "processing", "driver"].includes(seat.status)}
      className={`
        ${size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"}
        border-2 flex items-center justify-center font-medium transition-all
        ${getStatusStyles()}
      `}
    >
      {seat.status === "driver" ? "" : seat.number}
    </button>
  )
}
