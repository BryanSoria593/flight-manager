using System.Text.RegularExpressions;

namespace FlightBooking.Api.Domain;

public sealed partial class Passenger
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

    internal static Passenger Create(string fullName, string documentNumber, DateTimeOffset registeredAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(documentNumber);

        var normalizedName = NormalizeName(fullName);
        var normalizedDocument = NormalizeDocument(documentNumber);
        if (normalizedName.Length is < 3 or > 100)
            throw new ArgumentOutOfRangeException(nameof(fullName));
        if (!IsValidDocument(normalizedDocument))
            throw new ArgumentException("Document number must be 5 to 20 alphanumeric characters.", nameof(documentNumber));

        return new(Guid.NewGuid(), normalizedName, normalizedDocument, registeredAt);
    }

    public static string NormalizeName(string fullName) =>
        string.Join(' ', fullName.Normalize().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    public static string NormalizeDocument(string documentNumber) => documentNumber.Trim().ToUpperInvariant();

    public static bool IsValidDocument(string normalizedDocument) => DocumentPattern().IsMatch(normalizedDocument);

    [GeneratedRegex("^[A-Z0-9]{5,20}$", RegexOptions.CultureInvariant)]
    private static partial Regex DocumentPattern();
}
