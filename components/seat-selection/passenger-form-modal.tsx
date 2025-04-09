"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PassengerForm, type PassengerFormHandles } from "@/components/seat-selection/passenger-form"
import { Loader2 } from "lucide-react"

interface PassengerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (passengerData: any) => void
  seatNumber: number
  passengerNumber: number
  initialData?: any
  isEditing?: boolean
}

export function PassengerFormModal({
  isOpen,
  onClose,
  onSave,
  seatNumber,
  passengerNumber,
  initialData,
  isEditing = false,
}: PassengerFormModalProps) {
  const [formRef, setFormRef] = useState<PassengerFormHandles | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!formRef) return

    setIsSaving(true)
    const isValid = await formRef.trigger()

    if (isValid) {
      const values = formRef.getValues()
      onSave({
        ...values,
        seatNumber,
      })
    }
    setIsSaving(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Passenger Details" : "Enter Passenger Details"}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <PassengerForm
            passengerNumber={passengerNumber}
            seatNumber={seatNumber}
            ref={(ref) => {
              if (ref) {
                setFormRef(ref)
              }
            }}
            initialData={initialData}
          />
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
