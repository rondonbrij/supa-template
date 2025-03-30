"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createOrUpdateProfile(
  userId: string,
  data: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    birth_date: Date
    profile_picture?: string
  },
) {
  const supabase = await createClient()

  // Check if profile exists
  const { data: existingProfile } = await supabase.from("passengers").select("id").eq("auth_id", userId).single()

  if (existingProfile) {
    // Update existing profile
    const { error } = await supabase
      .from("passengers")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        birth_date: data.birth_date.toISOString().split("T")[0],
        profile_picture: data.profile_picture,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Create new profile
    const { error } = await supabase.from("passengers").insert({
      auth_id: userId,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || null,
      birth_date: data.birth_date.toISOString().split("T")[0],
      profile_picture: data.profile_picture,
    })

    if (error) {
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/profile")
  return { success: true }
}

