"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateInputProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minYear?: number
  maxYear?: number
  disabledDates?: (date: Date) => boolean
}

export function DateInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  disabledDates,
}: DateInputProps) {
  const [inputValue, setInputValue] = useState<string>(value ? format(value, "yyyy-MM-dd") : "")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [yearSelectOpen, setYearSelectOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(value ? value.getFullYear() : new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(value ? value.getMonth() : new Date().getMonth())

  // Generate years array
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  // Generate months array
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  useEffect(() => {
    if (value) {
      setInputValue(format(value, "yyyy-MM-dd"))
      setSelectedYear(value.getFullYear())
      setSelectedMonth(value.getMonth())
    } else {
      setInputValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Try to parse the date
    const parsedDate = parse(newValue, "yyyy-MM-dd", new Date())

    if (isValid(parsedDate)) {
      // Check if the date is disabled
      if (disabledDates && disabledDates(parsedDate)) {
        return
      }

      onChange(parsedDate)
      setSelectedYear(parsedDate.getFullYear())
      setSelectedMonth(parsedDate.getMonth())
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(Number.parseInt(year))

    if (value) {
      const newDate = new Date(value)
      newDate.setFullYear(Number.parseInt(year))

      // Check if the new date is valid and not disabled
      if (isValid(newDate) && (!disabledDates || !disabledDates(newDate))) {
        onChange(newDate)
      }
    }
  }

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month)
    setSelectedMonth(monthIndex)

    if (value) {
      const newDate = new Date(value)
      newDate.setMonth(monthIndex)

      // Check if the new date is valid and not disabled
      if (isValid(newDate) && (!disabledDates || !disabledDates(newDate))) {
        onChange(newDate)
      }
    }
  }

  return (
    <div className="relative">
      <div className="flex">
        <Input
          type="date"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          className="rounded-r-none"
        />
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("rounded-l-none border-l-0", !value && "text-muted-foreground")}
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex p-3 space-x-2">
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={months[selectedMonth]} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange(date)
                setCalendarOpen(false)
              }}
              disabled={disabledDates}
              month={new Date(selectedYear, selectedMonth)}
              onMonthChange={(date) => {
                setSelectedYear(date.getFullYear())
                setSelectedMonth(date.getMonth())
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

