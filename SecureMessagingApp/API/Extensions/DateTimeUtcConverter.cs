// DateTimeUtcConverter.cs
using System.Text.Json;
using System.Text.Json.Serialization;

public class DateTimeUtcConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options)
        => DateTime.SpecifyKind(reader.GetDateTime(), DateTimeKind.Utc);

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => writer.WriteStringValue(
            DateTime.SpecifyKind(value, DateTimeKind.Utc)
                    .ToString("yyyy-MM-ddTHH:mm:ssZ")  // always appends Z
        );
}