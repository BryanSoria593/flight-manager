using FlightBooking.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Api.Features;

public sealed record FlightItem(
    int Id, string FlightNumber, string Origin, string Destination, DateTimeOffset DepartsAt,
    int Capacity, int RegisteredPassengers, int AvailableSeats, bool IsFull);

public sealed class ListFlightsHandler(FlightsDbContext db)
{
    public Task<List<FlightItem>> HandleAsync(CancellationToken ct) =>
        db.Flights
            .AsNoTracking()
            .OrderBy(f => f.DepartsAt)
            .Select(f => new FlightItem(
                f.Id, f.FlightNumber, f.Origin, f.Destination, f.DepartsAt, f.Capacity,
                f.Passengers.Count(),
                f.Capacity - f.Passengers.Count(),
                f.Passengers.Count() >= f.Capacity))
            .ToListAsync(ct);
}

public static class ListFlightsEndpoint
{
    public static IEndpointRouteBuilder MapListFlightsEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/flights", async (ListFlightsHandler handler, CancellationToken ct) =>
                TypedResults.Ok(await handler.HandleAsync(ct)))
            .WithName("ListFlights")
            .WithSummary("Lists flights with their current occupancy.");

        return app;
    }
}
