"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/browser"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Wallet, AlertCircle, CheckCircle2, QrCode } from "lucide-react"
import Image from "next/image"

export default function PaymentPage() {
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
  const [paymentMethod, setPaymentMethod] = useState("gcash")
  const [gcashNumber, setGcashNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)

  // Fetch booking details
  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) return

      setLoading(true)
      try {
        // Fetch pending booking
        const { data: bookingData, error: bookingError } = await supabase
          .from("pending_bookings")
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

        // Fetch passenger details from pending_passenger_info
        const { data: passengerData, error: passengerError } = await supabase
          .from("pending_passenger_info")
          .select("*")
          .eq("booking_id", bookingId)

        if (passengerError) throw passengerError

        setPassengers(passengerData || [])

        // Calculate total amount
        const total = (passengerData?.length || 0) * tripData.fare
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

  const handlePaymentSubmit = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Validate payment details based on method
      if (paymentMethod === "gcash" && !gcashNumber) {
        throw new Error("Please enter your GCash number")
      } else if (paymentMethod === "qr" && !showQrCode) {
        // Show QR code first
        setShowQrCode(true)
        setIsProcessing(false)
        return
      }

      // If QR code is already shown, proceed with payment
      if (paymentMethod === "qr" && showQrCode) {
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } else {
        // For GCash, simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Create payment record with confirmed status
      // This will trigger the database function to transfer the booking
      const { data: paymentProofData, error: paymentProofError } = await supabase.from("payment_proofs").insert({
        booking_id: bookingId,
        payment_method: paymentMethod,
        payment_status: "confirmed", // Set to confirmed to trigger the function
        confirmed_at: new Date().toISOString(), // Add the current timestamp
      })

      if (paymentProofError) {
        throw paymentProofError
      }

      // Payment successful
      setIsSuccess(true)

      // Redirect to confirmation page after 3 seconds
      setTimeout(() => {
        router.push(`/booking/confirmation/${bookingId}`)
      }, 3000)
    } catch (error: any) {
      console.error("Payment error:", error)
      setError(error.message || "Payment processing failed. Please try again.")
    } finally {
      if (!showQrCode || paymentMethod !== "qr") {
        setIsProcessing(false)
      }
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading payment details...</p>
          </div>
        </div>
      </>
    )
  }

  if (error && !isSuccess) {
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
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </>
    )
  }

  if (isSuccess) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Payment Successful</AlertTitle>
            <AlertDescription className="text-green-700">
              Your payment has been processed successfully. You will be redirected to the confirmation page shortly.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Payment</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
              <CardDescription>Review your booking details before payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Trip Details</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm text-muted-foreground">Destination:</div>
                  <div className="text-sm font-medium">{destination?.name}</div>

                  <div className="text-sm text-muted-foreground">Company:</div>
                  <div className="text-sm font-medium">{company?.name}</div>

                  <div className="text-sm text-muted-foreground">Departure:</div>
                  <div className="text-sm font-medium">
                    {trip?.departure_time ? format(new Date(trip.departure_time), "PPP p") : "N/A"}
                  </div>

                  <div className="text-sm text-muted-foreground">Vehicle Type:</div>
                  <div className="text-sm font-medium">{trip?.vehicle_type || "N/A"}</div>

                  <div className="text-sm text-muted-foreground">Booking Code:</div>
                  <div className="text-sm font-medium">{booking?.booking_code}</div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg">Passenger Details</h3>
                <div className="space-y-3 mt-2">
                  {passengers.length > 0 ? (
                    passengers.map((passenger, index) => (
                      <div key={passenger.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Passenger {index + 1}</span>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
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
                    ))
                  ) : (
                    <div className="text-center py-2 text-gray-500">No passenger details available</div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg">Price Details</h3>
                <div className="space-y-2 mt-2">
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
                    <span>Total Amount:</span>
                    <span>₱ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2 border rounded-md p-4">
                  <RadioGroupItem value="gcash" id="gcash" />
                  <Label htmlFor="gcash" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="h-5 w-5" />
                    <span>GCash</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-4">
                  <RadioGroupItem value="qr" id="qr" />
                  <Label htmlFor="qr" className="flex items-center gap-2 cursor-pointer">
                    <QrCode className="h-5 w-5" />
                    <span>QR Code Payment</span>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "gcash" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gcash_number">GCash Number</Label>
                    <Input
                      id="gcash_number"
                      placeholder="09XX XXX XXXX"
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "qr" && showQrCode && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4 p-4 border rounded-md">
                    <p className="text-center font-medium">Scan this QR code to pay</p>
                    <div className="bg-white p-2 border">
                      <div className="relative h-48 w-48">
                        <Image
                          src="/placeholder.svg?height=200&width=200"
                          alt="Payment QR Code"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      After scanning and completing payment, click the Pay button below
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or information"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white"
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === "qr" && showQrCode ? (
                  "Confirm Payment"
                ) : (
                  `Pay ₱ ${totalAmount.toFixed(2)}`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}
