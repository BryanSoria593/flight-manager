namespace FlightBooking.Api.Domain;

public sealed class Flight
{
    private readonly List<Passenger> _passengers = [];

    private Flight() { }

    public Flight(string flightNumber, string origin, string destination, DateTimeOffset departsAt, int capacity)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(flightNumber);
        ArgumentException.ThrowIfNullOrWhiteSpace(origin);
        ArgumentException.ThrowIfNullOrWhiteSpace(destination);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(capacity);

        FlightNumber = flightNumber;
        Origin = origin;
        Destination = destination;
        DepartsAt = departsAt;
        Capacity = capacity;
    }

    public int Id { get; private set; }
    public string FlightNumber { get; private set; } = null!;
    public string Origin { get; private set; } = null!;
    public string Destination { get; private set; } = null!;
    public DateTimeOffset DepartsAt { get; private set; }
    public int Capacity { get; private set; }
    public IReadOnlyCollection<Passenger> Passengers => _passengers.AsReadOnly();

    public int AvailableSeats => Capacity - _passengers.Count;
    public bool IsFull => AvailableSeats <= 0;

    public Result<Passenger> RegisterPassenger(string fullName, string documentNumber, DateTimeOffset now)
    {
        if (IsFull)
            return FlightErrors.Full(FlightNumber, Capacity);

        var document = Passenger.NormalizeDocument(documentNumber);
        if (_passengers.Any(p => p.DocumentNumber == document))
            return FlightErrors.PassengerAlreadyRegistered(document, FlightNumber);

        var passenger = Passenger.Create(fullName, document, now);
        _passengers.Add(passenger);
        return passenger;
    }
}
