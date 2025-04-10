"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/browser"
import Header from "@/components/header"
import { BusLayout } from "@/components/seat-selection/bus-layout"
import { VanLayout } from "@/components/seat-selection/van-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Seat, PassengerDetails } from "@/types/seat-types"
import { generateBookingCode } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PassengerFormModal } from "@/components/seat-selection/passenger-form-modal"
import { PassengerCard } from "@/components/seat-selection/passenger-card"
import { AlertCircle, Loader2 } from "lucide-react"

export default function SeatSelectionPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const router = useRouter()

  const [trip, setTrip] = useState<any>(null)
  const [vehicleType, setVehicleType] = useState<"BUS" | "VAN">("BUS")
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [passengerDetails, setPassengerDetails] = useState<Record<number, PassengerDetails>>({})
  const [farePerSeat, setFarePerSeat] = useState<number>(0)
  const [bookedSeats, setBookedSeats] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentSeat, setCurrentSeat] = useState<number | null>(null)
  const [currentPassengerNumber, setCurrentPassengerNumber] = useState(1)
  const [isEditing, setIsEditing] = useState(false)

  const supabase = createClient()

  // Add a new state for processing seats
  const [processingSeats, setProcessingSeats] = useState<number[]>([])

  // Fetch trip details
  useEffect(() => {
    async function fetchTripDetails() {
      if (!tripId) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("trips")
          .select(`
           id,
           departure_time,
           destinations (name),
           transport_companies (name),
           vehicle_type,
           fare,
           available_seats,
           capacity,
           trip_amenities,
           notes
         `)
          .eq("id", tripId)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setTrip(data)
          setFarePerSeat(data.fare || 0)
          setVehicleType((data.vehicle_type?.toUpperCase() as "BUS" | "VAN") || "BUS")
        }
      } catch (error) {
        console.error("Error fetching trip details:", error)
        setError("Failed to fetch trip details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTripDetails()
  }, [tripId, supabase])

  // Initialize seats
  useEffect(() => {
    if (!trip) return

    // Fetch booked seats for this trip
    async function fetchBookedSeats() {
      try {
        // First, get all seats for this trip
        const { data: seatsData, error: seatsError } = await supabase
          .from("seats")
          .select("id, seat_number, status")
          .eq("trip_id", tripId)

        if (seatsError) {
          throw seatsError
        }

        // Extract booked and processing seat numbers
        const booked: number[] = []
        const processing: number[] = []

        if (seatsData && seatsData.length > 0) {
          seatsData.forEach((seat) => {
            const seatNumber = Number.parseInt(seat.seat_number)
            if (!isNaN(seatNumber)) {
              if (seat.status === "booked") {
                booked.push(seatNumber)
              } else if (seat.status === "reserved") {
                processing.push(seatNumber)
              }
            }
          })
        }

        // If no seats data found, fall back to checking bookings
        if (seatsData.length === 0) {
          const { data: bookingsData, error: bookingsError } = await supabase
            .from("bookings")
            .select("id, status, selected_seats")
            .eq("trip_id", tripId)

          if (bookingsError) {
            throw bookingsError
          }

          if (bookingsData && bookingsData.length > 0) {
            bookingsData.forEach((booking) => {
              if (booking.selected_seats && Array.isArray(booking.selected_seats)) {
                booking.selected_seats.forEach((seat: any) => {
                  if (typeof seat.number === "number") {
                    // If booking is confirmed, mark as booked, otherwise as processing
                    if (booking.status === "confirmed") {
                      booked.push(seat.number)
                    } else if (booking.status === "pending") {
                      processing.push(seat.number)
                    }
                  }
                })
              }
            })
          }
        }

        setBookedSeats(booked)
        setProcessingSeats(processing)
      } catch (error) {
        console.error("Error fetching booked seats:", error)
      }
    }

    fetchBookedSeats()
  }, [trip, tripId, supabase])

  // Initialize seat statuses
  useEffect(() => {
    const totalSeats = vehicleType === "BUS" ? 66 : 15
    const newSeats = Array.from({ length: totalSeats }, (_, i) => ({
      id: `seat-${i + 1}`,
      number: i + 1,
      status: bookedSeats.includes(i + 1) ? "booked" : processingSeats.includes(i + 1) ? "processing" : "available",
    }))
    setSeats(newSeats)
  }, [vehicleType, bookedSeats, processingSeats])

  const handleSeatClick = (clickedSeat: Seat) => {
    if (clickedSeat.status === "booked" || clickedSeat.status === "processing") return

    // If the seat is already selected and has passenger details, open edit modal
    if (clickedSeat.status === "selected" && passengerDetails[clickedSeat.number]) {
      setCurrentSeat(clickedSeat.number)
      setIsEditing(true)
      setIsModalOpen(true)
      return
    }

    // If the seat is already selected but doesn't have passenger details, deselect it
    if (clickedSeat.status === "selected") {
      const updatedSeats = seats.map((seat) => (seat.id === clickedSeat.id ? { ...seat, status: "available" } : seat))
      const updatedSelectedSeats = selectedSeats.filter((seat) => seat.id !== clickedSeat.id)

      setSeats(updatedSeats)
      setSelectedSeats(updatedSelectedSeats)

      // Remove passenger details if any
      const updatedPassengerDetails = { ...passengerDetails }
      delete updatedPassengerDetails[clickedSeat.number]
      setPassengerDetails(updatedPassengerDetails)

      return
    }

    // If the seat is available, select it and open the modal
    const updatedSeats = seats.map((seat) => (seat.id === clickedSeat.id ? { ...seat, status: "selected" } : seat))
    const updatedSelectedSeats = [...selectedSeats, { ...clickedSeat, status: "selected" }]

    setSeats(updatedSeats)
    setSelectedSeats(updatedSelectedSeats)

    // Open modal to enter passenger details
    setCurrentSeat(clickedSeat.number)
    setCurrentPassengerNumber(updatedSelectedSeats.length)
    setIsEditing(false)

    // Use setTimeout to avoid the infinite loop
    setTimeout(() => {
      setIsModalOpen(true)
    }, 0)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)

    // If we were adding a new passenger and canceled, deselect the seat
    if (!isEditing && currentSeat && !passengerDetails[currentSeat]) {
      const updatedSeats = seats.map((seat) => (seat.number === currentSeat ? { ...seat, status: "available" } : seat))
      const updatedSelectedSeats = selectedSeats.filter((seat) => seat.number !== currentSeat)

      setSeats(updatedSeats)
      setSelectedSeats(updatedSelectedSeats)
    }

    setCurrentSeat(null)
  }

  const handleSavePassenger = (data: PassengerDetails) => {
    if (!currentSeat) return

    // Save passenger details
    setPassengerDetails((prev) => ({
      ...prev,
      [currentSeat]: data,
    }))

    setIsModalOpen(false)
    setCurrentSeat(null)
  }

  const handleEditPassenger = (seatNumber: number) => {
    setCurrentSeat(seatNumber)
    setIsEditing(true)

    // Use setTimeout to avoid the infinite loop
    setTimeout(() => {
      setIsModalOpen(true)
    }, 0)
  }

  const handleContinue = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.")
      return
    }

    // Check if all selected seats have passenger details
    const missingDetails = selectedSeats.some((seat) => !passengerDetails[seat.number])
    if (missingDetails) {
      alert("Please fill in passenger details for all selected seats.")
      return
    }

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(`/booking/${tripId}`)}`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    // All forms are valid, proceed with booking
    const bookingCode = generateBookingCode()

    try {
      // Create booking in database
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          trip_id: tripId,
          booking_code: bookingCode,
          status: "pending",
          total_passengers: selectedSeats.length,
          total_packages: 0,
          selected_seats: selectedSeats.map((seat) => ({
            number: seat.number,
            status: seat.status,
          })),
        })
        .select()
        .single()

      if (bookingError) {
        console.error("Error creating booking:", bookingError)
        throw new Error(bookingError.message || "Failed to create booking")
      }

      // Create passenger_info records for each passenger
      const passengerPromises = selectedSeats.map((seat) => {
        const passenger = passengerDetails[seat.number]
        return supabase.from("passenger_info").insert({
          booking_id: bookingData.id,
          first_name: passenger.firstName,
          last_name: passenger.lastName,
          email: passenger.email || null,
          contact_number: passenger.phoneNumber,
          birthday: passenger.birthday,
          seat_number: seat.number.toString(),
        })
      })

      const passengerResults = await Promise.all(passengerPromises)

      // Check for errors in passenger info creation
      const passengerErrors = passengerResults.filter((result) => result.error)
      if (passengerErrors.length > 0) {
        console.error("Error creating passenger info:", passengerErrors)
        throw new Error("Failed to create passenger information")
      }

      // Store booking details for the payment page
      localStorage.setItem(
        "bookingData",
        JSON.stringify({
          bookingId: bookingData.id,
          bookingCode,
          tripId,
          selectedSeats,
          passengers: Object.values(passengerDetails),
          farePerSeat,
          totalAmount: selectedSeats.length * farePerSeat,
          tripDetails: {
            departure: trip.departure_time,
            destination: trip.destinations?.name,
            company: trip.transport_companies?.name,
          },
        }),
      )

      // Navigate to payment page
      router.push(`/payment/${bookingData.id}`)
    } catch (error: any) {
      console.error("Error creating booking:", error)
      setError(error.message || "Failed to create booking. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading trip details...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-6 grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Choose seat</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicleType === "BUS" ? (
              <BusLayout seats={seats} onSeatClick={handleSeatClick} />
            ) : (
              <VanLayout seats={seats} onSeatClick={handleSeatClick} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Passenger Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {selectedSeats.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {selectedSeats.map((seat, index) => {
                      const passenger = passengerDetails[seat.number]
                      return passenger ? (
                        <PassengerCard
                          key={seat.id}
                          passenger={passenger}
                          index={index}
                          onEdit={() => handleEditPassenger(seat.number)}
                        />
                      ) : (
                        <Card key={seat.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Passenger {index + 1}</h3>
                                <Badge variant="secondary" className="bg-yellow-500 text-white">
                                  Seat {seat.number}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentSeat(seat.number)
                                  setCurrentPassengerNumber(index + 1)
                                  setIsEditing(false)
                                  setTimeout(() => {
                                    setIsModalOpen(true)
                                  }, 0)
                                }}
                              >
                                Add Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fare per seat:</span>
                      <span>₱ {farePerSeat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Number of passengers:</span>
                      <span>{selectedSeats.length}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₱ {(selectedSeats.length * farePerSeat).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-500">Please select a seat to continue</div>
              )}
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white"
                onClick={handleContinue}
                disabled={selectedSeats.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "CONTINUE"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Passenger Form Modal */}
      {isModalOpen && currentSeat !== null && (
        <PassengerFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleSavePassenger}
          seatNumber={currentSeat}
          passengerNumber={currentPassengerNumber}
          initialData={isEditing ? passengerDetails[currentSeat] : undefined}
          isEditing={isEditing}
        />
      )}
    </>
  )
}
