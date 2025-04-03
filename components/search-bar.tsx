"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/browser"
import { useRouter } from "next/navigation"

type Destination = {
  id: string
  name: string
}

export default function SearchBar() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Fetch destinations only once when component mounts
  useEffect(() => {
    async function fetchDestinations() {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("destinations").select("id, name").order("name")

        if (error) {
          console.error("Error fetching destinations:", error)
          return
        }

        setDestinations(data || [])
      } catch (error) {
        console.error("Error fetching destinations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDestinations()
  }, [supabase])

  // Filter destinations based on search term
  const filteredDestinations = searchTerm
    ? destinations.filter((dest) => dest.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : destinations

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="destination" className="text-sm font-medium">
            Where are you going?
          </label>
          <div className="relative" ref={inputRef}>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-label="Select a destination"
                  className="w-full justify-between h-10 font-normal text-left"
                  onClick={() => setOpen(!open)}
                >
                  <span className="truncate">
                    {value
                      ? destinations.find((destination) => destination.name === value)?.name
                      : "Search for a destination..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 shadow-lg" style={{ width: inputRef.current?.clientWidth }} align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search for a destination..."
                    className="h-9"
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading destinations...</span>
                        </div>
                      ) : (
                        "No destination found."
                      )}
                    </CommandEmpty>
                    <CommandGroup heading="Destinations">
                      {filteredDestinations.map((destination) => (
                        <CommandItem
                          key={destination.id}
                          value={destination.name}
                          onSelect={(currentValue) => {
                            setValue(currentValue === value ? "" : currentValue)
                            setOpen(false)
                            setSearchTerm("")
                            router.push(`/trips/${destination.id}`)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", value === destination.name ? "opacity-100" : "opacity-0")}
                          />
                          {destination.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}

