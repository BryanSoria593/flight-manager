import { useEffect, useRef } from 'react'
import type { Flight } from '../types'
import { PassengerList } from './PassengerList'
import { RegisterPassengerForm } from './RegisterPassengerForm'

const STACKED_LAYOUT_QUERY = '(max-width: 900px)'

export function FlightDetail({ flight }: { flight: Flight }) {
  const articleRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!window.matchMedia?.(STACKED_LAYOUT_QUERY).matches) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    articleRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  return (
    <article ref={articleRef} className="card-static" aria-labelledby="detail-title">
      <h2 id="detail-title" ref={headingRef} tabIndex={-1}>
        {flight.flightNumber} · {flight.origin} → {flight.destination}
      </h2>
      <RegisterPassengerForm flight={flight} focusFallbackRef={headingRef} />
      <h3>Pasajeros registrados</h3>
      <PassengerList flightId={flight.id} />
    </article>
  )
}
