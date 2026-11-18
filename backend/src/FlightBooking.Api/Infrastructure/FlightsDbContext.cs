using FlightBooking.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Api.Infrastructure;

public sealed class FlightsDbContext(DbContextOptions<FlightsDbContext> options) : DbContext(options)
{
    public DbSet<Flight> Flights => Set<Flight>();
    public DbSet<Passenger> Passengers => Set<Passenger>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Flight>(flight =>
        {
            flight.HasMany(f => f.Passengers).WithOne().HasForeignKey(p => p.FlightId);
            flight.Navigation(f => f.Passengers).UsePropertyAccessMode(PropertyAccessMode.Field);
            flight.Ignore(f => f.AvailableSeats);
            flight.Ignore(f => f.IsFull);
        });

        modelBuilder.Entity<Passenger>().Property(p => p.Id).ValueGeneratedNever();
    }
}
