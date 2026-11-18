import { useEffect, useRef } from 'react'
import type { Flight } from '../types'
import { PassengerList } from './PassengerList'
import { RegisterPassengerForm } from './RegisterPassengerForm'

const STACKED_LAYOUT_QUERY = '(max-width: 900px)'

export function FlightDetail({ flight }: { flight: Flight }) {
  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!window.matchMedia?.(STACKED_LAYOUT_QUERY).matches) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    articleRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  return (
    <article ref={articleRef} className="card-static" aria-labelledby="detail-title">
      <h2 id="detail-title">
        {flight.flightNumber} · {flight.origin} → {flight.destination}
      </h2>
      <RegisterPassengerForm flight={flight} />
      <h3>Pasajeros registrados</h3>
      <PassengerList flightId={flight.id} />
    </article>
  )
}
