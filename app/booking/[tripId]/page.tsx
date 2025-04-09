"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/browser"
import Header from "@/components/header"
import { BusLayout } from "@/components/seat-selection/bus-layout"
import { VanLayout } from "@/components/seat-selection/van-layout"
import { PassengerForm, type PassengerFormHandles } from "@/components/seat-selection/passenger-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Seat, PassengerDetails } from "@/types/seat-types"
import { generateBookingCode } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SeatSelectionPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const router = useRouter()

  const [trip, setTrip] = useState<any>(null)
  const [vehicleType, setVehicleType] = useState<"BUS" | "VAN">("BUS")
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [passengers, setPassengers] = useState<PassengerDetails[]>([])
  const [farePerSeat, setFarePerSeat] = useState<number>(0)
  const [bookedSeats, setBookedSeats] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Store refs to each PassengerForm
  const passengerFormRefs = useRef<Map<number, PassengerFormHandles>>(new Map())

  const supabase = createClient()

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
        // This is a simplified example. In a real app, you would fetch actual booked seats from your database.
        const { data, error } = await supabase.from("bookings").select("selected_seats").eq("trip_id", tripId)

        if (error) {
          throw error
        }

        // Extract booked seat numbers from the data
        const booked: number[] = []
        if (data && data.length > 0) {
          data.forEach((booking) => {
            if (booking.selected_seats && Array.isArray(booking.selected_seats)) {
              booking.selected_seats.forEach((seat: any) => {
                if (typeof seat.number === "number") {
                  booked.push(seat.number)
                }
              })
            }
          })
        }

        setBookedSeats(booked)
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
      status: bookedSeats.includes(i + 1) ? "booked" : "available",
    }))
    setSeats(newSeats)
  }, [vehicleType, bookedSeats])

  const handleSeatClick = (clickedSeat: Seat) => {
    if (clickedSeat.status === "booked") return

    let updatedSeats: Seat[] = []
    let updatedSelectedSeats: Seat[] = []

    if (clickedSeat.status === "selected") {
      // Deselect the seat
      updatedSeats = seats.map((seat) => (seat.id === clickedSeat.id ? { ...seat, status: "available" } : seat))
      updatedSelectedSeats = selectedSeats.filter((seat) => seat.id !== clickedSeat.id)
    } else {
      // Select the seat
      updatedSeats = seats.map((seat) => (seat.id === clickedSeat.id ? { ...seat, status: "selected" } : seat))
      updatedSelectedSeats = [...selectedSeats, { ...clickedSeat, status: "selected" }]
    }

    setSeats(updatedSeats)
    setSelectedSeats(updatedSelectedSeats)
  }

  const handleContinue = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.")
      return
    }

    let allFormsValid = true
    const passengersData: PassengerDetails[] = []

    // Validate all forms
    for (const seat of selectedSeats) {
      const formRef = passengerFormRefs.current.get(seat.number)
      if (formRef) {
        const isValid = await formRef.trigger()
        if (isValid) {
          const values = formRef.getValues()
          passengersData.push({
            ...values,
            birthday: values.birthday,
            seatNumber: seat.number,
          })
        } else {
          allFormsValid = false
        }
      }
    }

    if (!allFormsValid) {
      alert("Please fill in all required fields correctly.")
      return
    }

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
          selected_seats: selectedSeats.map((seat) => ({
            number: seat.number,
            status: seat.status,
          })),
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create passenger_info records for each passenger
      const passengerPromises = passengersData.map((passenger) =>
        supabase.from("passenger_info").insert({
          booking_id: bookingData.id,
          first_name: passenger.firstName,
          last_name: passenger.lastName,
          email: passenger.email || null,
          contact_number: passenger.phoneNumber,
          birthday: passenger.birthday,
          seat_number: passenger.seatNumber.toString(),
        }),
      )

      await Promise.all(passengerPromises)

      // Store booking details for the payment page
      localStorage.setItem(
        "bookingData",
        JSON.stringify({
          bookingId: bookingData.id,
          bookingCode,
          tripId,
          selectedSeats,
          passengers: passengersData,
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
    } catch (error) {
      console.error("Error creating booking:", error)
      setError("Failed to create booking. Please try again.")
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

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
              {selectedSeats.length > 0 ? (
                <>
                  {selectedSeats.map((seat, index) => (
                    <PassengerForm
                      key={seat.id}
                      passengerNumber={index + 1}
                      seatNumber={seat.number}
                      ref={(ref) => {
                        if (ref) {
                          passengerFormRefs.current.set(seat.number, ref)
                        } else {
                          passengerFormRefs.current.delete(seat.number)
                        }
                      }}
                    />
                  ))}
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fare per seat:</span>
                      <span>₱ {farePerSeat.toFixed(2)}</span>
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
                disabled={selectedSeats.length === 0}
              >
                CONTINUE
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
