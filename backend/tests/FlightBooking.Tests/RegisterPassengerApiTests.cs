using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace FlightBooking.Tests;

public sealed class RegisterPassengerApiTests
{
    [Fact]
    public async Task Post_WithAvailableSeats_Returns201AndUpdatesOccupancy()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var before = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(before.Id, "Juan Pérez", "1799999999");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var after = await client.GetFlightAsync("FB-101");
        Assert.Equal(before.RegisteredPassengers + 1, after.RegisteredPassengers);
    }

    [Fact]
    public async Task Post_WithInvalidData_Returns400WithFieldErrors()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, "", "12");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Request.Invalid", problem!.Code);
        Assert.Contains("fullName", problem.Errors!.Keys);
        Assert.Contains("documentNumber", problem.Errors.Keys);
    }

    [Fact]
    public async Task Post_ToUnknownFlight_Returns404()
    {
        await using var api = new TestApi();

        var response = await api.CreateClient().RegisterAsync(999, "Juan Pérez", "1799999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Flight.NotFound", problem!.Code);
    }

    [Fact]
    public async Task Post_ToFullFlight_Returns409()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var full = await client.GetFlightAsync("FB-303");

        var response = await client.RegisterAsync(full.Id, "Juan Pérez", "1799999999");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Flight.Full", problem!.Code);
    }

    [Fact]
    public async Task Post_ToOneFlight_DoesNotChangeOtherFlights()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var before = await client.GetFlightsAsync();
        var target = before.Single(f => f.FlightNumber == "FB-101");

        var response = await client.RegisterAsync(target.Id, "Juan Pérez", "1799999999");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var after = await client.GetFlightsAsync();
        foreach (var other in before.Where(f => f.Id != target.Id))
            Assert.Equal(other.RegisteredPassengers, after.Single(f => f.Id == other.Id).RegisteredPassengers);
    }
}

internal sealed class TestApi : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder) => builder.UseEnvironment("Testing");
}

internal sealed record FlightBody(int Id, string FlightNumber, int Capacity, int RegisteredPassengers, int AvailableSeats, bool IsFull);

internal sealed record ProblemBody(int Status, string? Code, Dictionary<string, string[]>? Errors);

internal static class ApiClientExtensions
{
    public static async Task<List<FlightBody>> GetFlightsAsync(this HttpClient client) =>
        (await client.GetFromJsonAsync<List<FlightBody>>("/api/v1/flights"))!;

    public static async Task<FlightBody> GetFlightAsync(this HttpClient client, string flightNumber) =>
        (await client.GetFlightsAsync()).Single(f => f.FlightNumber == flightNumber);

    public static Task<HttpResponseMessage> RegisterAsync(this HttpClient client, int flightId, string fullName, string documentNumber) =>
        client.PostAsJsonAsync($"/api/v1/flights/{flightId}/passengers", new { fullName, documentNumber });
}
