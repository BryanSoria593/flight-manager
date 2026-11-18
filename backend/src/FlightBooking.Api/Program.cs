using System.Diagnostics;
using FlightBooking.Api.Features;
using FlightBooking.Api.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<InMemoryDatabaseRoot>();
builder.Services.AddDbContext<FlightsDbContext>((sp, options) =>
    options.UseInMemoryDatabase("FlightBooking", sp.GetRequiredService<InMemoryDatabaseRoot>()));

builder.Services.AddSingleton<FlightLock>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddScoped<ListFlightsHandler>();
builder.Services.AddScoped<ListPassengersHandler>();
builder.Services.AddScoped<RegisterPassengerHandler>();

builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    var problem = context.ProblemDetails;
    problem.Extensions.TryAdd("traceId", Activity.Current?.Id ?? context.HttpContext.TraceIdentifier);
    if (problem is HttpValidationProblemDetails)
        problem.Extensions.TryAdd("code", "Request.Invalid");
    else if (problem.Status >= 500)
        problem.Extensions.TryAdd("code", "Server.Unexpected");
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
    app.UseMiddleware<FaultInjectionMiddleware>();

app.MapListFlightsEndpoint();
app.MapListPassengersEndpoint();
app.MapRegisterPassengerEndpoint();
app.MapGet("/health", () => TypedResults.Ok(new { status = "ok" }));

await using (var scope = app.Services.CreateAsyncScope())
{
    await SeedData.InitializeAsync(scope.ServiceProvider.GetRequiredService<FlightsDbContext>());
}

app.Run();

public partial class Program { }
