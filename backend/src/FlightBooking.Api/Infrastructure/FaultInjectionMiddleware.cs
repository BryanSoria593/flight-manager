namespace FlightBooking.Api.Infrastructure;

public sealed class FaultInjectionMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private const string HeaderName = "X-Simulate-Failure";
    private readonly int _latencyMs = configuration.GetValue<int>("FaultInjection:LatencyMs");

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await next(context);
            return;
        }

        if (_latencyMs > 0)
            await Task.Delay(_latencyMs, context.RequestAborted);

        if (context.Request.Headers[HeaderName] == "true")
        {
            await TypedResults.Problem(
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    detail: "Simulated failure to exercise error handling.",
                    extensions: new Dictionary<string, object?> { ["code"] = "Server.SimulatedFailure" })
                .ExecuteAsync(context);
            return;
        }

        await next(context);
    }
}
