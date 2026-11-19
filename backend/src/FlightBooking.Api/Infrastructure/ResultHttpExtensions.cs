using System.Diagnostics;
using System.Text.Json;
using FlightBooking.Api.Domain;
using FluentValidation.Results;

namespace FlightBooking.Api.Infrastructure;

public static class ResultHttpExtensions
{
    public static IResult MatchOrProblem<T>(this Result<T> result, Func<T, IResult> onSuccess)
    {
        if (result.IsSuccess)
            return onSuccess(result.Value);

        var statusCode = result.Error.Type switch
        {
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            _ => throw new UnreachableException($"Unsupported error type: {result.Error.Type}."),
        };

        return TypedResults.Problem(
            detail: result.Error.Message,
            statusCode: statusCode,
            extensions: new Dictionary<string, object?> { ["code"] = result.Error.Code });
    }

    public static IResult ToValidationProblem(this ValidationResult validation) =>
        TypedResults.Problem(new HttpValidationProblemDetails(validation.Errors
            .GroupBy(e => JsonNamingPolicy.CamelCase.ConvertName(e.PropertyName))
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()))
        {
            Status = StatusCodes.Status400BadRequest,
        });
}
