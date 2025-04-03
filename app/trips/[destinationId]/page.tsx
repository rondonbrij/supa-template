"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/browser"
import Header from "@/components/header"

interface Trip {
  id: string
  departure_time: string
  destination_name: string
  company_name: string
  vehicle_type: string
  fare: number
  available_seats: number
  amenities: any
}

export default function TripSelectionPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const { destinationId } = useParams()

  const supabase = createClient()

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
            trip_amenities
          `)
          .eq("destination_id", destinationId)
          .gte("departure_time", new Date().toISOString())
          .order("departure_time", { ascending: true })

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
          }))
          setTrips(formattedTrips)
        }
      } catch (error) {
        console.error("Error fetching trips:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [destinationId, supabase])

  return (
    <>
      <Header />
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-5">Available Trips</h1>
        {loading ? (
          <p>Loading trips...</p>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold">{trip.destination_name}</h2>
                <p>Company: {trip.company_name}</p>
                <p>Departure: {new Date(trip.departure_time).toLocaleString()}</p>
                <p>Vehicle: {trip.vehicle_type}</p>
                <p>Fare: ${trip.fare}</p>
                <p>Seats Available: {trip.available_seats}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No trips available for this destination.</p>
        )}
      </div>
    </>
  )
}

