"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { MapPin, CalendarIcon, Bus, ArrowUpDown, Building2, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TripCard } from "@/components/trip-card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { LoginPrompt } from "@/components/login-prompt"

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
}

interface Destination {
  id: string
  name: string
}

export default function TripSelectionPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<string>("")
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [vehicleType, setVehicleType] = useState<string>("ALL")
  const [sortOrder, setSortOrder] = useState<string>("earliest")
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [companies, setCompanies] = useState<string[]>([])
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  const { destinationId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Fetch destinations
  useEffect(() => {
    async function fetchDestinations() {
      try {
        const { data, error } = await supabase.from("destinations").select("id, name")

        if (error) {
          console.error("Error fetching destinations:", error)
          return
        }

        if (data) {
          setDestinations(data)

          // Set selected destination if destinationId is provided
          if (destinationId) {
            const destination = data.find((d) => d.id === destinationId)
            if (destination) {
              setSelectedDestination(destination.name)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching destinations:", error)
      }
    }

    fetchDestinations()
  }, [destinationId, supabase])

  // Fetch trips
  useEffect(() => {
    async function fetchTrips() {
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
          .eq("destination_id", destinationId)
          .gte("departure_time", new Date().toISOString())
          .order("departure_time", { ascending: sortOrder === "earliest" })

        if (error) {
          console.error("Error fetching trips:", error)
          return
        }

        if (data) {
          const formattedTrips = data.map((trip: any) => ({
            id: trip.id,
            departure_time: trip.departure_time,
            destination_name: trip.destinations?.name || "Unknown Destination",
            company_name: trip.transport_companies?.name || "Unknown Company",
            vehicle_type: trip.vehicle_type,
            fare: trip.fare,
            available_seats: trip.available_seats,
            amenities: trip.trip_amenities,
            notes: trip.notes,
          }))

          // Extract unique company names
          const uniqueCompanies = [...new Set(formattedTrips.map((trip) => trip.company_name))]
          setCompanies(uniqueCompanies)

          // Apply filters
          let filteredTrips = formattedTrips

          // Filter by date
          if (date) {
            const selectedDate = format(date, "yyyy-MM-dd")
            filteredTrips = filteredTrips.filter((trip) => {
              const tripDate = format(new Date(trip.departure_time), "yyyy-MM-dd")
              return tripDate === selectedDate
            })
          }

          // Filter by vehicle type
          if (vehicleType !== "ALL") {
            filteredTrips = filteredTrips.filter((trip) => trip.vehicle_type?.toUpperCase() === vehicleType)
          }

          // Filter by company
          if (selectedCompany !== "all") {
            filteredTrips = filteredTrips.filter((trip) => trip.company_name === selectedCompany)
          }

          setTrips(filteredTrips)
        }
      } catch (error) {
        console.error("Error fetching trips:", error)
      } finally {
        setLoading(false)
      }
    }

    if (destinationId) {
      fetchTrips()
    }
  }, [destinationId, supabase, date, vehicleType, sortOrder, selectedCompany])

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "hh:mm a")
    } catch (error) {
      return "Invalid time"
    }
  }

  const handleBookNow = async (tripId: string) => {
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // If not authenticated, show login prompt
      setSelectedTripId(tripId)
      setIsLoginPromptOpen(true)
      return
    }

    // If authenticated, proceed to booking
    router.push(`/booking/${tripId}`)
  }

  const handleDestinationChange = (destinationId: string) => {
    router.push(`/trips/${destinationId}`)
  }

  const handleLoginPromptClose = () => {
    setIsLoginPromptOpen(false)
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[200px] justify-start">
                <MapPin className="mr-2 h-4 w-4" />
                {selectedDestination || "Select destination"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search destination..." />
                <CommandList>
                  <CommandEmpty>No destination found.</CommandEmpty>
                  <CommandGroup>
                    {destinations.map((destination) => (
                      <CommandItem
                        key={destination.id}
                        value={destination.name}
                        onSelect={() => {
                          setSelectedDestination(destination.name)
                          handleDestinationChange(destination.id)
                        }}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>{destination.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[200px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center gap-2">
                <Bus className="h-4 w-4" />
                <SelectValue placeholder="All Types" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="BUS">Bus</SelectItem>
              <SelectItem value="VAN">Van</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Earliest to Latest" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="earliest">Earliest to Latest</SelectItem>
              <SelectItem value="latest">Latest to Earliest</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <SelectValue placeholder="All Companies" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading trips...</p>
          </div>
        ) : trips.length > 0 ? (
          <>
            {/* Mobile view */}
            {isMobile ? (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onBookNow={handleBookNow} />
                ))}
              </div>
            ) : (
              /* Desktop table view */
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Seats left</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Book</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{formatTime(trip.departure_time)}</TableCell>
                        <TableCell>{trip.company_name}</TableCell>
                        <TableCell>{trip.destination_name}</TableCell>
                        <TableCell>{trip.available_seats}</TableCell>
                        <TableCell>₱{trip.fare.toFixed(2)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Trip Notes</DialogTitle>
                                <DialogDescription>
                                  {trip.notes || "No notes available for this trip."}
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleBookNow(trip.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Book Seats
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 border rounded-lg">
            <p>No trips available for this destination.</p>
          </div>
        )}
      </div>
      {isLoginPromptOpen && (
        <LoginPrompt
          isOpen={isLoginPromptOpen}
          onClose={handleLoginPromptClose}
          redirectUrl={selectedTripId ? `/booking/${selectedTripId}` : "/trips"}
        />
      )}
    </>
  )
}
