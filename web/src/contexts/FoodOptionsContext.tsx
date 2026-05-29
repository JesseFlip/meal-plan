import { createContext, useContext, ReactNode } from 'react'
import { useFoodOptions } from '../hooks/useFoodOptions'
import type { FoodOption } from '../hooks/useFoodOptions'

type FoodOptionsContextType = {
  proteins: FoodOption[]
  veggies: FoodOption[]
  carbs: FoodOption[]
  fats: FoodOption[]
  loading: boolean
  addProtein: (name: string) => Promise<void>
  addVeggie: (name: string) => Promise<void>
  addCarb: (name: string) => Promise<void>
  addFat: (name: string) => Promise<void>
  deleteProtein: (id: number) => Promise<void>
  deleteVeggie: (id: number) => Promise<void>
  deleteCarb: (id: number) => Promise<void>
  deleteFat: (id: number) => Promise<void>
}

const FoodOptionsContext = createContext<FoodOptionsContextType | null>(null)

export function FoodOptionsProvider({ children }: { children: ReactNode }) {
  const foodOptions = useFoodOptions()

  return (
    <FoodOptionsContext.Provider value={foodOptions}>
      {children}
    </FoodOptionsContext.Provider>
  )
}

export function useFoodOptionsContext() {
  const context = useContext(FoodOptionsContext)
  if (!context) {
    throw new Error('useFoodOptionsContext must be used within FoodOptionsProvider')
  }
  return context
}
