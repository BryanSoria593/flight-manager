using FlightBooking.Api.Domain;
using FlightBooking.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Api.Features;

public sealed record FlightItem(
    int Id, string FlightNumber, string Origin, string Destination, DateTimeOffset DepartsAt,
    int Capacity, int RegisteredPassengers, int AvailableSeats, bool IsFull);

public sealed class ListFlightsHandler(FlightsDbContext db)
{
    public async Task<List<FlightItem>> HandleAsync(CancellationToken ct)
    {
        var rows = await db.Flights
            .AsNoTracking()
            .OrderBy(f => f.DepartsAt)
            .Select(f => new
            {
                f.Id, f.FlightNumber, f.Origin, f.Destination, f.DepartsAt, f.Capacity,
                Registered = f.Passengers.Count(),
            })
            .ToListAsync(ct);

        return rows
            .Select(r => new FlightItem(
                r.Id, r.FlightNumber, r.Origin, r.Destination, r.DepartsAt, r.Capacity, r.Registered,
                Flight.SeatsLeft(r.Capacity, r.Registered),
                Flight.IsFullFor(r.Capacity, r.Registered)))
            .ToList();
    }
}

public static class ListFlightsEndpoint
{
    public static IEndpointRouteBuilder MapListFlightsEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("", async (ListFlightsHandler handler, CancellationToken ct) =>
                TypedResults.Ok(await handler.HandleAsync(ct)))
            .WithName("ListFlights");

        return app;
    }
}
