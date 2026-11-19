using System.Net;
using System.Net.Http.Json;
using System.Text;
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

    [Fact]
    public async Task Post_WithMalformedJson_Returns400WithRequestMalformedCodeAndTraceId()
    {
        await using var api = new TestApi();
        var response = await api.CreateClient().PostAsync(
            "/api/v1/flights/1/passengers",
            new StringContent("{", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Request.Malformed", problem!.Code);
        Assert.False(string.IsNullOrWhiteSpace(problem.TraceId));
    }

    [Fact]
    public async Task Get_UnknownRoute_Returns404WithResourceNotFoundCodeAndTraceId()
    {
        await using var api = new TestApi();

        var response = await api.CreateClient().GetAsync("/route-that-does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Resource.NotFound", problem!.Code);
        Assert.False(string.IsNullOrWhiteSpace(problem.TraceId));
    }

    [Fact]
    public async Task Post_WithDuplicateDocument_Returns409()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, "Otra Persona", "1712345678");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Passenger.AlreadyRegistered", problem!.Code);
    }

    [Theory]
    [InlineData("Juan 123", "123456")]
    [InlineData("Juan Pérez", "1234")]
    [InlineData("Juan Pérez", "123456789012345678901")]
    [InlineData("Ab  ", "ABC12345")]
    [InlineData("A        ", "ABC12345")]
    [InlineData("Juan Pérez", "AB 12345")]
    public async Task Post_WithInvalidNameOrDocument_Returns400(string fullName, string documentNumber)
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, fullName, documentNumber);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Request.Invalid", problem!.Code);
    }

    [Fact]
    public async Task Post_WithRepeatedSpacesInName_Returns201WithNormalizedName()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, "Ana   María  Pérez", "ZX98765");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var passenger = await response.Content.ReadFromJsonAsync<PassengerBody>();
        Assert.Equal("Ana María Pérez", passenger!.FullName);
    }

    [Fact]
    public async Task Post_WithDecomposedAccents_Returns201WithComposedName()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, "José Pérez", "NFD12345");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var passenger = await response.Content.ReadFromJsonAsync<PassengerBody>();
        Assert.Equal("José Pérez", passenger!.FullName);
    }

    [Fact]
    public async Task Post_WithSurroundingSpaces_Returns201WithTheSameValuesTheDomainStores()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, "  Juan Pérez ", " zx98765 ");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var passenger = await response.Content.ReadFromJsonAsync<PassengerBody>();
        Assert.Equal("Juan Pérez", passenger!.FullName);
        Assert.Equal("ZX98765", passenger.DocumentNumber);
    }

    [Fact]
    public async Task Post_WithSeedDocumentSurroundedBySpaces_Returns409AlreadyRegistered()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, "Otra Persona", " 1712345678 ");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Passenger.AlreadyRegistered", problem!.Code);
    }

    [Fact]
    public async Task Post_WithOversizedFields_Returns400BeforeNormalizing()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-101");

        var response = await client.RegisterAsync(flight.Id, new string('A', 201), new string('1', 51));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Contains("Full name is too long.", problem!.Errors!["fullName"]);
        Assert.Contains("Document number is too long.", problem.Errors["documentNumber"]);
    }
}

public sealed class ListPassengersApiTests
{
    [Fact]
    public async Task Get_ExistingFlight_ReturnsSeedPassengersInStableOrder()
    {
        await using var api = new TestApi();
        var client = api.CreateClient();
        var flight = await client.GetFlightAsync("FB-202");

        var passengers = await client.GetFromJsonAsync<List<PassengerBody>>(
            $"/api/v1/flights/{flight.Id}/passengers");

        Assert.Equal(["Carlos Vega", "Lucía Paredes"], passengers!.Select(p => p.FullName));
    }

    [Fact]
    public async Task Get_UnknownFlight_Returns404WithFlightNotFoundCode()
    {
        await using var api = new TestApi();

        var response = await api.CreateClient().GetAsync("/api/v1/flights/999/passengers");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        Assert.Equal("Flight.NotFound", problem!.Code);
    }
}

public sealed class TestApiIsolationTests
{
    [Fact]
    public async Task EachTestHost_StartsFromTheSeedData()
    {
        for (var host = 0; host < 2; host++)
        {
            await using var api = new TestApi();
            var client = api.CreateClient();
            var flight = await client.GetFlightAsync("FB-202");

            Assert.Equal(2, flight.RegisteredPassengers);
            var response = await client.RegisterAsync(flight.Id, "Ultimo Asiento", "LAST12345");
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }
    }
}

internal sealed class TestApi : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder.UseEnvironment("Testing")
               .UseSetting("InMemoryDatabaseName", $"FlightBooking-{Guid.NewGuid()}");
}

internal sealed record FlightBody(int Id, string FlightNumber, int Capacity, int RegisteredPassengers, int AvailableSeats, bool IsFull);

internal sealed record ProblemBody(int Status, string? Code, Dictionary<string, string[]>? Errors, string? TraceId);
internal sealed record PassengerBody(Guid Id, int FlightId, string FullName, string DocumentNumber, DateTimeOffset RegisteredAt);

internal static class ApiClientExtensions
{
    public static async Task<List<FlightBody>> GetFlightsAsync(this HttpClient client) =>
        (await client.GetFromJsonAsync<List<FlightBody>>("/api/v1/flights"))!;

    public static async Task<FlightBody> GetFlightAsync(this HttpClient client, string flightNumber) =>
        (await client.GetFlightsAsync()).Single(f => f.FlightNumber == flightNumber);

    public static Task<HttpResponseMessage> RegisterAsync(this HttpClient client, int flightId, string fullName, string documentNumber) =>
        client.PostAsJsonAsync($"/api/v1/flights/{flightId}/passengers", new { fullName, documentNumber });
}
