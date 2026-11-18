namespace FlightBooking.Api.Infrastructure;

public sealed class FlightLock
{
    private readonly SemaphoreSlim[] _stripes =
        Enumerable.Range(0, 64).Select(_ => new SemaphoreSlim(1, 1)).ToArray();

    public async Task<IDisposable> AcquireAsync(int flightId, CancellationToken cancellationToken)
    {
        var stripe = _stripes[(int)((uint)flightId % (uint)_stripes.Length)];
        await stripe.WaitAsync(cancellationToken);
        return new Releaser(stripe);
    }

    private sealed class Releaser(SemaphoreSlim stripe) : IDisposable
    {
        private int _released;

        public void Dispose()
        {
            if (Interlocked.Exchange(ref _released, 1) == 0)
                stripe.Release();
        }
    }
}
