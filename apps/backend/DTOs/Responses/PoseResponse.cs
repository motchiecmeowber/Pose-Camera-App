namespace backend.DTOs.Responses;

public class PoseResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public float LineWidth { get; set; }
    public float Opacity { get; set; }
    public string? ThumbnailUrl { get; set; }
}