using System.Net;

namespace FlightBooking.Tests;

public sealed class ConcurrencyTests
{
    [Fact]
    public async Task Post_50ConcurrentRequests_RegistersExactlyTheCapacity()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-404");

        var responses = await Task.WhenAll(Enumerable.Range(0, 50).Select(i =>
            client.RegisterAsync(flight.Id, "Pasajero Concurrente", $"DOC{i:D6}")));

        Assert.Equal(8, responses.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.Equal(42, responses.Count(r => r.StatusCode == HttpStatusCode.Conflict));

        var after = await client.GetFlightAsync("FB-404");
        Assert.Equal(8, after.RegisteredPassengers);
        Assert.True(after.IsFull);
    }
}
