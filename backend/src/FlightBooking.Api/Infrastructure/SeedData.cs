using FlightBooking.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Api.Infrastructure;

public static class SeedData
{
    public static async Task InitializeAsync(FlightsDbContext db)
    {
        if (await db.Flights.AnyAsync()) return;

        var now = DateTimeOffset.UtcNow;
        var ecuador = TimeSpan.FromHours(-5);
        var tomorrow = new DateTimeOffset(now.ToOffset(ecuador).Date.AddDays(1), ecuador);

        var uioGye = new Flight("FB-101", "Quito", "Guayaquil", tomorrow.AddHours(7), capacity: 5);
        uioGye.RegisterPassenger("Ana Morales", "1712345678", now);

        var gyeGps = new Flight("FB-202", "Guayaquil", "Galápagos (Baltra)", tomorrow.AddHours(9.5), capacity: 3);
        gyeGps.RegisterPassenger("Carlos Vega", "0912345678", now);
        gyeGps.RegisterPassenger("Lucía Paredes", "0923456789", now);

        var uioCue = new Flight("FB-303", "Quito", "Cuenca", tomorrow.AddDays(1).AddHours(13), capacity: 2);
        uioCue.RegisterPassenger("Diego Salazar", "1723456789", now);
        uioCue.RegisterPassenger("Valeria Ortiz", "AB1234567", now);

        var uioBog = new Flight("FB-404", "Quito", "Bogotá", tomorrow.AddDays(2).AddHours(15), capacity: 8);

        db.Flights.AddRange(uioGye, gyeGps, uioCue, uioBog);
        await db.SaveChangesAsync();
    }
}
