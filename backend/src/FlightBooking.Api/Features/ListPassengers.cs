using FlightBooking.Api.Domain;
using FlightBooking.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Api.Features;

public sealed record PassengerItem(Guid Id, int FlightId, string FullName, string DocumentNumber, DateTimeOffset RegisteredAt);

public sealed class ListPassengersHandler(FlightsDbContext db)
{
    public async Task<Result<List<PassengerItem>>> HandleAsync(int flightId, CancellationToken ct)
    {
        if (!await db.Flights.AnyAsync(f => f.Id == flightId, ct))
            return FlightErrors.NotFound(flightId);

        return await db.Passengers
            .AsNoTracking()
            .Where(p => p.FlightId == flightId)
            .OrderBy(p => p.RegisteredAt)
            .Select(p => new PassengerItem(p.Id, p.FlightId, p.FullName, p.DocumentNumber, p.RegisteredAt))
            .ToListAsync(ct);
    }
}

public static class ListPassengersEndpoint
{
    public static IEndpointRouteBuilder MapListPassengersEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/flights/{flightId:int}/passengers",
                async (int flightId, ListPassengersHandler handler, CancellationToken ct) =>
                    (await handler.HandleAsync(flightId, ct)).MatchOrProblem(passengers => TypedResults.Ok(passengers)))
            .WithName("ListPassengers")
            .WithSummary("Lists the passengers registered on a flight.");

        return app;
    }
}
