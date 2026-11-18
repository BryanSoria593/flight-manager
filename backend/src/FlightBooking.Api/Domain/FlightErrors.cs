namespace FlightBooking.Api.Domain;

public static class FlightErrors
{
    public static Error NotFound(int flightId) =>
        new("Flight.NotFound", $"Flight {flightId} was not found.", ErrorType.NotFound);

    public static Error Full(string flightNumber, int capacity) =>
        new("Flight.Full", $"Flight {flightNumber} has reached its maximum capacity of {capacity} passengers.", ErrorType.Conflict);

    public static Error PassengerAlreadyRegistered(string documentNumber, string flightNumber) =>
        new("Passenger.AlreadyRegistered", $"Document {documentNumber} is already registered on flight {flightNumber}.", ErrorType.Conflict);
}
