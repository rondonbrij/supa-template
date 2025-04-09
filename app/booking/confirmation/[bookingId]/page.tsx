"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/browser"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Printer, Home, AlertCircle } from "lucide-react"

export default function ConfirmationPage() {
  const params = useParams()
  const bookingId = params.bookingId as string
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)
  const [trip, setTrip] = useState<any>(null)
  const [destination, setDestination] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [passengers, setPassengers] = useState<any[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  // Fetch booking details
  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) return

      setLoading(true)
      try {
        // Fetch booking
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single()

        if (bookingError) throw bookingError

        setBooking(bookingData)

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select(`
            *,
            destinations (id, name),
            transport_companies (id, name)
          `)
          .eq("id", bookingData.trip_id)
          .single()

        if (tripError) throw tripError

        setTrip(tripData)
        setDestination(tripData.destinations)
        setCompany(tripData.transport_companies)

        // Fetch passenger details
        const { data: passengerData, error: passengerError } = await supabase
          .from("passenger_info")
          .select("*")
          .eq("booking_id", bookingId)

        if (passengerError) throw passengerError

        setPassengers(passengerData || [])

        // Calculate total amount
        const total = passengerData.length * tripData.fare
        setTotalAmount(total)
      } catch (error: any) {
        console.error("Error fetching booking details:", error)
        setError(error.message || "Failed to load booking details")
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [bookingId, supabase])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading booking details...</p>
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
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        <div className="max-w-3xl mx-auto">
          <Alert className="bg-green-50 border-green-200 mb-6">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Booking Confirmed</AlertTitle>
            <AlertDescription className="text-green-700">
              Your booking has been confirmed. Please save or print your booking details for reference.
            </AlertDescription>
          </Alert>

          <Card className="mb-6 print:shadow-none">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-2xl">Booking Confirmation</CardTitle>
              <CardDescription>Booking Code: {booking?.booking_code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Trip Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm text-muted-foreground">Destination:</div>
                  <div className="text-sm font-medium">{destination?.name}</div>

                  <div className="text-sm text-muted-foreground">Company:</div>
                  <div className="text-sm font-medium">{company?.name}</div>

                  <div className="text-sm text-muted-foreground">Departure Date:</div>
                  <div className="text-sm font-medium">
                    {trip?.departure_time ? format(new Date(trip.departure_time), "PPP") : "N/A"}
                  </div>

                  <div className="text-sm text-muted-foreground">Departure Time:</div>
                  <div className="text-sm font-medium">
                    {trip?.departure_time ? format(new Date(trip.departure_time), "p") : "N/A"}
                  </div>

                  <div className="text-sm text-muted-foreground">Vehicle Type:</div>
                  <div className="text-sm font-medium">{trip?.vehicle_type || "N/A"}</div>

                  <div className="text-sm text-muted-foreground">Status:</div>
                  <div className="text-sm font-medium">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {booking?.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-2">Passenger Details</h3>
                <div className="space-y-3">
                  {passengers.map((passenger, index) => (
                    <div key={passenger.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Passenger {index + 1}</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Seat {passenger.seat_number}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span>
                          {passenger.first_name} {passenger.last_name}
                        </span>
                        <span className="text-muted-foreground">Contact:</span>
                        <span>{passenger.contact_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-2">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fare per seat:</span>
                    <span className="text-sm">₱ {trip?.fare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Number of passengers:</span>
                    <span className="text-sm">{passengers.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Amount Paid:</span>
                    <span>₱ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border mt-4">
                <h3 className="font-semibold mb-2">Important Information</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Please arrive at least 30 minutes before departure time.</li>
                  <li>• Present this booking confirmation at the terminal.</li>
                  <li>• For any changes or cancellations, please contact customer service.</li>
                  <li>• Contact: {company?.contact_number || "N/A"}</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 print:hidden">
              <Button className="w-full sm:w-auto" onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print Ticket
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => router.push("/")} variant="default">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}
