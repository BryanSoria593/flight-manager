namespace FlightBooking.Api.Domain;

public sealed class Passenger
{
    private Passenger() { }

    private Passenger(Guid id, string fullName, string documentNumber, DateTimeOffset registeredAt)
    {
        Id = id;
        FullName = fullName;
        DocumentNumber = documentNumber;
        RegisteredAt = registeredAt;
    }

    public Guid Id { get; private set; }
    public int FlightId { get; private set; }
    public string FullName { get; private set; } = null!;
    public string DocumentNumber { get; private set; } = null!;
    public DateTimeOffset RegisteredAt { get; private set; }

    internal static Passenger Create(string fullName, string documentNumber, DateTimeOffset registeredAt) =>
        new(Guid.CreateVersion7(),
            string.Join(' ', fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries)),
            documentNumber,
            registeredAt);

    public static string NormalizeDocument(string documentNumber) => documentNumber.Trim().ToUpperInvariant();
}
