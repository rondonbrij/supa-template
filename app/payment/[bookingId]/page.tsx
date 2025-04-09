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
import { Loader2, CreditCard, Wallet, AlertCircle, CheckCircle2 } from "lucide-react"

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
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCvv] = useState("")
  const [gcashNumber, setGcashNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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

  const handlePaymentSubmit = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Validate payment details based on method
      if (paymentMethod === "credit_card") {
        if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
          throw new Error("Please fill in all credit card details")
        }
      } else if (paymentMethod === "gcash") {
        if (!gcashNumber) {
          throw new Error("Please enter your GCash number")
        }
      }

      // In a real app, you would process the payment with a payment gateway here
      // For this mock implementation, we'll simulate a payment process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Record the payment proof
      const { data: paymentProofData, error: paymentProofError } = await supabase
        .from("payment_proofs")
        .insert({
          booking_id: bookingId,
          payment_method: paymentMethod,
          // In a real app, you would upload an image proof
          proof_image: "mock_payment_proof.jpg",
          status: "pending", // Initially pending until approved
        })
        .select()
        .single()

      if (paymentProofError) throw paymentProofError

      // Update booking status to confirmed
      const { error: updateError } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId)

      if (updateError) throw updateError

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
      setIsProcessing(false)
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
                  {passengers.map((passenger, index) => (
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
                  ))}
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
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-5 w-5" />
                    <span>Credit/Debit Card</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-4">
                  <RadioGroupItem value="gcash" id="gcash" />
                  <Label htmlFor="gcash" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="h-5 w-5" />
                    <span>GCash</span>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "credit_card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card_number">Card Number</Label>
                    <Input
                      id="card_number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card_name">Cardholder Name</Label>
                    <Input
                      id="card_name"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card_expiry">Expiry Date</Label>
                      <Input
                        id="card_expiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card_cvv">CVV</Label>
                      <Input id="card_cvv" placeholder="123" value={cardCvv} onChange={(e) => setCvv(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

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
