using System.Text.Json;
using FlightBooking.Api.Domain;
using FluentValidation.Results;

namespace FlightBooking.Api.Infrastructure;

public static class ResultHttpExtensions
{
    public static IResult MatchOrProblem<T>(this Result<T> result, Func<T, IResult> onSuccess) =>
        result.IsSuccess
            ? onSuccess(result.Value)
            : TypedResults.Problem(
                detail: result.Error.Message,
                statusCode: result.Error.Type == ErrorType.NotFound
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?> { ["code"] = result.Error.Code });

    public static IResult ToValidationProblem(this ValidationResult validation) =>
        TypedResults.ValidationProblem(validation.Errors
            .GroupBy(e => JsonNamingPolicy.CamelCase.ConvertName(e.PropertyName))
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()));
}
