/**
 * Auth Guard
 * Protects routes requiring authentication
 *
 * Usage:
 * { path: 'bookings', component: BookingsComponent, canActivate: [AuthGuard] }
 */

import { inject } from '@angular/core'
import { Router, type CanActivateFn } from '@angular/router'
import { supabase } from '@/lib/supabase'

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router)

  try {
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth guard error:', error)
      await router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      })
      return false
    }

    if (!session) {
      await router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      })
      return false
    }

    // User is authenticated
    return true

  } catch (error) {
    console.error('Auth guard error:', error)
    await router.navigate(['/login'])
    return false
  }
}

/**
 * Role Guard
 * Protects routes requiring specific roles
 *
 * Usage:
 * { path: 'admin', component: AdminComponent, canActivate: [roleGuard('admin')] }
 */
export const roleGuard = (requiredRole: 'renter' | 'owner' | 'admin'): CanActivateFn => {
  return async (route, state) => {
    const router = inject(Router)

    try {
      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        await router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        })
        return false
      }

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile) {
        console.error('Failed to get user profile:', profileError)
        await router.navigate(['/'])
        return false
      }

      // Check if user has required role
      if (profile.role !== requiredRole) {
        console.warn(`User role ${profile.role} doesn't match required role ${requiredRole}`)
        await router.navigate(['/'])
        return false
      }

      return true

    } catch (error) {
      console.error('Role guard error:', error)
      await router.navigate(['/'])
      return false
    }
  }
}
