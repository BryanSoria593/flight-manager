using System.Text.RegularExpressions;
using FlightBooking.Api.Domain;
using FlightBooking.Api.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Api.Features;

public sealed record RegisterPassengerRequest(string FullName, string DocumentNumber);

public sealed record RegisterPassengerResponse(Guid Id, int FlightId, string FullName, string DocumentNumber, DateTimeOffset RegisteredAt);

public sealed class RegisterPassengerValidator : AbstractValidator<RegisterPassengerRequest>
{
    private static readonly Regex AllowedName = new(@"^\p{L}[\p{L} .'\-]*$", RegexOptions.Compiled);

    public RegisterPassengerValidator()
    {
        RuleLevelCascadeMode = CascadeMode.Stop;

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(200).WithMessage("Full name is too long.")
            .Must(name => Passenger.NormalizeName(name).Length is >= 3 and <= 100)
                .WithMessage("Full name must be between 3 and 100 characters.")
            .Must(name => AllowedName.IsMatch(Passenger.NormalizeName(name)))
                .WithMessage("Full name may only contain letters, spaces, periods, apostrophes and hyphens.");

        RuleFor(x => x.DocumentNumber)
            .NotEmpty().WithMessage("Document number is required.")
            .MaximumLength(50).WithMessage("Document number is too long.")
            .Must(document => Passenger.IsValidDocument(Passenger.NormalizeDocument(document)))
                .WithMessage("Document number must be 5 to 20 alphanumeric characters with no spaces.");
    }
}

public sealed class RegisterPassengerHandler(FlightsDbContext db, FlightLock flightLock, TimeProvider clock)
{
    public async Task<Result<RegisterPassengerResponse>> HandleAsync(
        int flightId, RegisterPassengerRequest request, CancellationToken ct)
    {
        using var lease = await flightLock.AcquireAsync(flightId, ct);

        var flight = await db.Flights
            .Include(f => f.Passengers)
            .SingleOrDefaultAsync(f => f.Id == flightId, ct);
        if (flight is null)
            return FlightErrors.NotFound(flightId);

        var registration = flight.RegisterPassenger(request.FullName, request.DocumentNumber, clock.GetUtcNow());
        if (!registration.IsSuccess)
            return registration.Error;

        await db.SaveChangesAsync(ct);

        var passenger = registration.Value;
        return new RegisterPassengerResponse(
            passenger.Id, flight.Id, passenger.FullName, passenger.DocumentNumber, passenger.RegisteredAt);
    }
}

public static class RegisterPassengerEndpoint
{
    public static IEndpointRouteBuilder MapRegisterPassengerEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/{flightId:int}/passengers", async (
                int flightId,
                RegisterPassengerRequest request,
                IValidator<RegisterPassengerRequest> validator,
                RegisterPassengerHandler handler,
                CancellationToken ct) =>
            {
                var validation = await validator.ValidateAsync(request, ct);
                if (!validation.IsValid)
                    return validation.ToValidationProblem();

                var result = await handler.HandleAsync(flightId, request, ct);
                return result.MatchOrProblem(passenger =>
                    TypedResults.Created($"/api/v1/flights/{flightId}/passengers", passenger));
            })
            .WithName("RegisterPassenger");

        return app;
    }
}
