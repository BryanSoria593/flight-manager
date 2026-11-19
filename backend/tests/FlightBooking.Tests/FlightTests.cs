using FlightBooking.Api.Domain;

namespace FlightBooking.Tests;

public sealed class FlightTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 17, 12, 0, 0, TimeSpan.FromHours(-5));

    private static Flight NewFlight(int capacity) => new("FB-999", "Quito", "Loja", Now.AddDays(1), capacity);

    [Fact]
    public void RegisterPassenger_WithAvailableSeats_AddsPassenger()
    {
        var flight = NewFlight(capacity: 2);

        var result = flight.RegisterPassenger("Ana Morales", "1712345678", Now);

        Assert.True(result.IsSuccess);
        Assert.Single(flight.Passengers);
        Assert.Equal(1, flight.AvailableSeats);
    }

    [Fact]
    public void RegisterPassenger_WhenFlightIsFull_ReturnsFlightFull()
    {
        var flight = NewFlight(capacity: 1);
        flight.RegisterPassenger("Ana Morales", "1712345678", Now);

        var result = flight.RegisterPassenger("Carlos Vega", "0912345678", Now);

        Assert.False(result.IsSuccess);
        Assert.Equal("Flight.Full", result.Error.Code);
        Assert.Single(flight.Passengers);
    }

    [Fact]
    public void RegisterPassenger_WithSameDocumentInDifferentCaseOrSpacing_ReturnsAlreadyRegistered()
    {
        var flight = NewFlight(capacity: 5);
        flight.RegisterPassenger("Ana Morales", "ab12345", Now);

        var result = flight.RegisterPassenger("Ana Morales", "  AB12345 ", Now);

        Assert.False(result.IsSuccess);
        Assert.Equal("Passenger.AlreadyRegistered", result.Error.Code);
        Assert.Single(flight.Passengers);
    }

    [Theory]
    [InlineData("1234")]
    [InlineData("123456789012345678901")]
    public void RegisterPassenger_WithDocumentOutsideAllowedLength_Throws(string documentNumber)
    {
        var flight = NewFlight(capacity: 2);

        Assert.Throws<ArgumentException>(() => flight.RegisterPassenger("Ana Morales", documentNumber, Now));
    }
}
