"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/browser"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, MapPinIcon, Users } from "lucide-react"

export default function SearchBar() {
  const [departureDate, setDepartureDate] = useState<Date>()
  const [fromLocation, setFromLocation] = useState<string>("")
  const [toLocation, setToLocation] = useState<string>("")
  const [passengers, setPassengers] = useState<string>("1")
  const [destinations, setDestinations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchDestinations() {
      try {
        const { data, error } = await supabase.from("destinations").select("id, name, city, state")

        if (error) throw error

        setDestinations(data || [])
      } catch (error) {
        console.error("Error fetching destinations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDestinations()
  }, [supabase])

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="fromLocation" className="text-sm font-medium flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            From
          </Label>
          <Select value={fromLocation} onValueChange={setFromLocation}>
            <SelectTrigger id="fromLocation" className="h-10">
              <SelectValue placeholder="Select departure" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((destination) => (
                <SelectItem key={destination.id} value={destination.id.toString()}>
                  {destination.name}, {destination.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toLocation" className="text-sm font-medium flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            To
          </Label>
          <Select value={toLocation} onValueChange={setToLocation}>
            <SelectTrigger id="toLocation" className="h-10">
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((destination) => (
                <SelectItem key={destination.id} value={destination.id.toString()}>
                  {destination.name}, {destination.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="departureDate" className="text-sm font-medium flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Departure Date
          </Label>
          <DateInput
            value={departureDate}
            onChange={setDepartureDate}
            disabledDates={(date) => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return date < today
            }}
            minYear={new Date().getFullYear()}
            maxYear={new Date().getFullYear() + 1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passengers" className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Passengers
          </Label>
          <Select value={passengers} onValueChange={setPassengers}>
            <SelectTrigger id="passengers" className="h-10">
              <SelectValue placeholder="Passengers" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "passenger" : "passengers"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end md:col-span-4">
          <Button className="h-10 w-full">Search Routes</Button>
        </div>
      </div>
    </div>
  )
}

