using System.Diagnostics;
using FlightBooking.Api.Features;
using FlightBooking.Api.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var databaseName = builder.Configuration["InMemoryDatabaseName"] ?? "FlightBooking";
builder.Services.AddDbContext<FlightsDbContext>(options => options.UseInMemoryDatabase(databaseName));

builder.Services.AddSingleton<FlightLock>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddScoped<ListFlightsHandler>();
builder.Services.AddScoped<ListPassengersHandler>();
builder.Services.AddScoped<RegisterPassengerHandler>();
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = false);

builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    var problem = context.ProblemDetails;
    problem.Extensions.TryAdd("traceId", Activity.Current?.Id ?? context.HttpContext.TraceIdentifier);
    problem.Extensions.TryAdd("code", problem switch
    {
        HttpValidationProblemDetails => "Request.Invalid",
        { Status: >= 500 } => "Server.Unexpected",
        { Status: 400 } => "Request.Malformed",
        { Status: 404 } => "Resource.NotFound",
        { Status: 415 } => "Request.UnsupportedMediaType",
        { Status: int status } => $"Http.{status}",
        _ => "Http.Unknown",
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
    app.UseMiddleware<FaultInjectionMiddleware>();

var flights = app.MapGroup("/api/v1/flights");
flights.MapListFlightsEndpoint();
flights.MapListPassengersEndpoint();
flights.MapRegisterPassengerEndpoint();
app.MapGet("/health", () => TypedResults.Ok(new { status = "ok" }));

await using (var scope = app.Services.CreateAsyncScope())
{
    await SeedData.InitializeAsync(
        scope.ServiceProvider.GetRequiredService<FlightsDbContext>(),
        scope.ServiceProvider.GetRequiredService<TimeProvider>());
}

app.Run();

public partial class Program { }
